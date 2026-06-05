import { describe, expect, test } from 'bun:test';

import { content, document, markdown, publication } from '#core/providers/standardsite';
import type { ContentBlock } from '#core/providers/standardsite';
import type { SemanticType } from '#core/providers/standardsite/content/types';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

const identity: ResolvedIdentity = {
	did: 'did:plc:alice',
	handle: 'alice.test',
	pdsUrl: 'https://pds.example.com'
};

const sem = (rawType: string, type: SemanticType, value: unknown): ContentBlock => ({
	rawType,
	source: value,
	semantic: { type, value }
});

const unclassified = (rawType: string, source: unknown): ContentBlock => ({ rawType, source });

describe('standard.site helpers', () => {
	test('parses publication and document records', () => {
		expect(
			publication.parse({
				$type: 'site.standard.publication',
				name: 'Example Publication',
				url: 'https://example.com'
			})
		).toMatchObject({ $type: 'site.standard.publication', name: 'Example Publication' });

		expect(
			document.parse({
				$type: 'site.standard.document',
				title: 'Hello',
				publishedAt: '2025-01-01T00:00:00Z',
				site: 'at://did:plc:alice/site.standard.publication/self'
			})
		).toMatchObject({ $type: 'site.standard.document', title: 'Hello' });
	});

	test('document.normalize exposes semantic content', () => {
		const normalized = document.normalize(
			{
				uri: 'at://did:plc:alice/site.standard.document/hello',
				cid: 'cid-document',
				value: {
					title: 'Hello',
					publishedAt: '2025-01-01T00:00:00Z',
					site: 'at://did:plc:alice/site.standard.publication/self',
					content: {
						$type: 'app.offprint.content',
						items: [{ $type: 'app.offprint.block.text', plaintext: 'Hello world' }]
					}
				}
			},
			identity
		);

		expect(normalized.contentVendor).toBe('offprint');
		expect(normalized.content).toMatchObject({
			contentType: 'app.offprint.content',
			warnings: [],
			fallbackText: undefined,
			blocks: [
				{
					rawType: 'app.offprint.block.text',
					path: 'content.items[0]',
					source: { plaintext: 'Hello world' },
					semantic: {
						type: 'paragraph',
						value: { text: 'Hello world', richText: undefined }
					}
				}
			]
		});
	});

	test('content.normalize and createNormalizer return semantic blocks', () => {
		const normalizer = content.createNormalizer({ bundles: [content.offprintBundle] });
		const result = normalizer({
			$type: 'app.offprint.content',
			items: [{ $type: 'app.offprint.block.text', plaintext: 'Hello world' }]
		});

		expect(result.blocks).toEqual([
			{
				rawType: 'app.offprint.block.text',
				path: 'content.items[0]',
				source: { plaintext: 'Hello world' },
				semantic: {
					type: 'paragraph',
					value: { text: 'Hello world', richText: undefined }
				}
			}
		]);
	});

	test('content.createNormalizer can extend normalization via normalizer registry', () => {
		const normalizer = content.createNormalizer({
			contentTypes: {
				'app.custom.content': {
					vendor: 'offprint',
					extractBlocks: (input) => ({
						blocks: Array.isArray(input.items)
							? input.items.map((item, index) => ({ input: item, path: `content.items[${index}]` }))
							: []
					})
				}
			},
			semanticHandlers: {
				'app.custom.block.note': (input) => ({
					type: 'paragraph',
					value: {
						text: typeof input.text === 'string' ? `note:${input.text}` : '',
						richText: undefined
					}
				})
			}
		});

		expect(
			normalizer({
				$type: 'app.custom.content',
				items: [{ $type: 'app.custom.block.note', text: 'Hello' }]
			})
		).toEqual({
			contentType: 'app.custom.content',
			blocks: [
				{
					rawType: 'app.custom.block.note',
					path: 'content.items[0]',
					source: { text: 'Hello' },
					semantic: {
						type: 'paragraph',
						value: {
							text: 'note:Hello',
							richText: undefined
						}
					}
				}
			],
			warnings: [],
			fallbackText: undefined,
			skipped: undefined
		});
	});

	test('content.normalize preserves semantic projections and unsupported blocks', () => {
		const result = content.normalize({
			$type: 'app.offprint.content',
			items: [
				{ $type: 'app.offprint.block.heading', level: 2, plaintext: 'Heading 2' },
				{
					$type: 'app.offprint.block.webBookmark',
					href: 'https://github.com/tassis',
					title: 'tassis - Overview'
				},
				{ $type: 'app.offprint.block.table', cells: ['one', 'two'] }
			]
		});

		expect(result.blocks).toEqual([
			{
				rawType: 'app.offprint.block.heading',
				path: 'content.items[0]',
				source: { level: 2, plaintext: 'Heading 2' },
				semantic: {
					type: 'heading',
					value: { level: 2, text: 'Heading 2', richText: undefined }
				}
			},
			{
				rawType: 'app.offprint.block.webBookmark',
				path: 'content.items[1]',
				source: {
					href: 'https://github.com/tassis',
					title: 'tassis - Overview'
				},
				semantic: {
					type: 'rich-link-like',
					value: {
						url: 'https://github.com/tassis',
						title: 'tassis - Overview',
						description: undefined,
						siteName: undefined,
						previewImage: undefined
					}
				}
			},
			{
				rawType: 'app.offprint.block.table',
				path: 'content.items[2]',
				source: { cells: ['one', 'two'] }
			}
		]);
	});

	test('content.normalize preserves iframe semantics distinctly from rich links', () => {
		const result = content.normalize({
			$type: 'pub.leaflet.content',
			pages: [
				{
					$type: 'pub.leaflet.pages.linearDocument',
					id: 'page-1',
					blocks: [
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.iframe',
								url: 'https://example.com/embed/video',
								title: 'Embedded video',
								description: 'A playable embed',
								aspectRatio: '16:9'
							}
						}
					]
				}
			]
		});

		expect(result.blocks).toEqual([
			{
				rawType: 'pub.leaflet.blocks.iframe',
				path: 'content.pages[0].blocks[0].block',
				source: {
					url: 'https://example.com/embed/video',
					title: 'Embedded video',
					description: 'A playable embed',
					aspectRatio: '16:9'
				},
				semantic: {
					type: 'iframe-like',
					value: {
						url: 'https://example.com/embed/video',
						title: undefined,
						description: 'A playable embed',
						aspectRatio: '16:9'
					}
				}
			}
		]);
	});

	test('markdown renders semantic blocks only', () => {
		const rendered = markdown.render([
			sem('app.offprint.block.heading', 'heading', { level: 2, text: 'Hello' }),
			sem('app.offprint.block.text', 'paragraph', {
				text: 'hello world',
				richText: {
					text: 'hello world',
					spans: [
						{ byteStart: 0, byteEnd: 5, marks: ['bold'] },
						{ byteStart: 6, byteEnd: 11, link: 'https://example.com' }
					]
				}
			}),
			sem('app.offprint.block.code', 'code', { code: 'const a = 1;', language: 'ts' }),
			unclassified('pub.leaflet.blocks.page', {})
		]);

		expect(rendered).toBe(
			[
				'## Hello',
				'',
				'**hello** [world](https://example.com)',
				'',
				'```ts',
				'const a = 1;',
				'```',
				'',
				'<!-- unsupported block: pub.leaflet.blocks.page -->'
			].join('\n')
		);
	});

	test('markdown degrades supported semantic blocks without comments by default', () => {
		const rendered = markdown.render([
			sem('app.offprint.block.button', 'button-like', {
				url: 'https://example.com/read',
				text: 'Read more',
				align: 'center'
			}),
			sem('pub.leaflet.blocks.iframe', 'iframe-like', {
				url: 'https://example.com/embed/video'
			}),
			sem('app.offprint.block.blueskyPost', 'bluesky-post-like', {
				uri: 'at://did:plc:alice/app.bsky.feed.post/123',
				clientHost: 'bsky.app'
			}),
			sem('app.offprint.block.imageCarousel', 'gallery-like', {
				items: [
					{ src: 'https://cdn.example.com/1.png', alt: 'One' },
					{ src: 'https://cdn.example.com/2.png', alt: 'Two' }
				],
				layout: 'carousel',
				ref: 'https://example.com/gallery'
			})
		]);

		expect(rendered).toBe(
			[
				'[Read more](https://example.com/read)',
				'',
				'[https://example\\.com/embed/video](https://example.com/embed/video)',
				'',
				'[https://bsky\\.app/profile/did:plc:alice/post/123](https://bsky.app/profile/did:plc:alice/post/123)',
				'',
				'![One](https://cdn.example.com/1.png)',
				'',
				'![Two](https://cdn.example.com/2.png)'
			].join('\n')
		);
	});

	test('markdown can preserve degraded semantic details as comments', () => {
		const rendered = markdown.render(
			[
				sem('app.offprint.block.button', 'button-like', {
					url: 'https://example.com/read',
					text: 'Read more',
					align: 'center'
				}),
				sem('app.offprint.block.imageCarousel', 'gallery-like', {
					items: [{ src: 'https://cdn.example.com/1.png', alt: 'One' }],
					layout: 'carousel',
					ref: 'https://example.com/gallery'
				}),
				sem('app.offprint.block.webBookmark', 'rich-link-like', {
					url: 'https://example.com/post',
					title: 'Example Post',
					description: 'A preview description',
					siteName: 'Example',
					previewImage: { src: 'https://cdn.example.com/preview.png' }
				}),
				sem('pub.leaflet.blocks.iframe', 'iframe-like', {
					url: 'https://example.com/embed/video',
					title: 'Embedded video',
					description: 'A playable embed',
					aspectRatio: '16:9'
				}),
				sem('app.offprint.block.blueskyPost', 'bluesky-post-like', {
					uri: 'at://did:plc:alice/app.bsky.feed.post/123',
					cid: 'bafycid',
					clientHost: 'https://bsky.app'
				})
			],
			{ preserveDegradedSemanticsAsComments: true }
		);

		expect(rendered).toBe(
			[
				'[Read more](https://example.com/read)',
				'<!-- button-like align: center -->',
				'',
				'![One](https://cdn.example.com/1.png)',
				'<!-- gallery-like layout: carousel; ref: https://example.com/gallery -->',
				'',
				'[Example Post](https://example.com/post)',
				'<!-- rich-link-like siteName: Example; description: A preview description; previewImage: https://cdn.example.com/preview.png -->',
				'',
				'[Embedded video](https://example.com/embed/video)',
				'<!-- iframe-like description: A playable embed; aspectRatio: 16:9 -->',
				'',
				'[https://bsky\\.app/profile/did:plc:alice/post/123](https://bsky.app/profile/did:plc:alice/post/123)',
				'<!-- bluesky-post-like cid: bafycid; clientHost: https://bsky.app -->'
			].join('\n')
		);
	});

	test('markdown can use custom Bluesky post base URL', () => {
		const rendered = markdown.render(
			[
				sem('app.offprint.block.blueskyPost', 'bluesky-post-like', {
					uri: 'at://did:plc:alice/app.bsky.feed.post/123'
				})
			],
			{ blueskyPostBaseUrl: 'https://staging.bsky.app' }
		);

		expect(rendered).toBe(
			'[https://staging\\.bsky\\.app/profile/did:plc:alice/post/123](https://staging.bsky.app/profile/did:plc:alice/post/123)'
		);
	});

	test('markdown.createRenderer can override semantic rendering', () => {
		const renderer = markdown.createRenderer({
			heading: (block, context) => {
				const value = block.semantic.value as { level: number; text: string };
				return `${context.indent}H${value.level}: ${value.text}`;
			}
		});

		expect(
			renderer([
				sem('app.offprint.block.heading', 'heading', { level: 2, text: 'Hello' }),
				sem('app.offprint.block.text', 'paragraph', { text: 'world' })
			])
		).toBe(['H2: Hello', '', 'world'].join('\n'));
	});

	test('document.list exposes semantic content results', async () => {
		const transport: CoreTransport = {
			request: async () => ({ status: 404, headers: new Headers(), text: '' }),
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>() =>
				({
					records: [
						{
							uri: 'at://did:plc:alice/site.standard.document/hello',
							cid: 'cid-document',
							value: {
								title: 'Hello',
								publishedAt: '2025-01-01T00:00:00Z',
								site: 'at://did:plc:alice/site.standard.publication/self',
								textContent: 'Leaflet Heading',
								content: {
									$type: 'pub.leaflet.content',
									pages: [
										{
											$type: 'pub.leaflet.pages.linearDocument',
											id: 'page-1',
											blocks: [
												{
													$type: 'pub.leaflet.pages.linearDocument#block',
													block: {
														$type: 'pub.leaflet.blocks.header',
														level: 2,
														plaintext: 'Leaflet Heading'
													}
												}
											]
										}
									]
								}
							}
						}
					]
				}) as T
		};

		const response = await document.list(transport, identity, { limit: 10 });
		expect(response.documents[0]?.content).toMatchObject({
			contentType: 'pub.leaflet.content',
			warnings: [],
			fallbackText: 'Leaflet Heading',
			blocks: [
				{
					rawType: 'pub.leaflet.blocks.header',
					path: 'content.pages[0].blocks[0].block',
					source: { level: 2, plaintext: 'Leaflet Heading' },
					semantic: {
						type: 'heading',
						value: { level: 2, text: 'Leaflet Heading', richText: undefined }
					}
				}
			]
		});
	});
});
