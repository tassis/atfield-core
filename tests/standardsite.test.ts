import { describe, expect, test } from 'bun:test';

import { content, document, publication } from '#core/providers/standardsite';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

const identity: ResolvedIdentity = {
	did: 'did:plc:alice',
	handle: 'alice.test',
	pdsUrl: 'https://pds.example.com'
};

describe('standard.site helpers', () => {
	test('parses a valid publication record shape', () => {
		expect(
			publication.parse({
				$type: 'site.standard.publication',
				name: 'Example Publication',
				url: 'https://example.com',
				preferences: {
					$type: 'site.standard.publication#preferences',
					showInDiscover: true
				}
			})
		).toEqual({
			$type: 'site.standard.publication',
			name: 'Example Publication',
			url: 'https://example.com',
			preferences: {
				$type: 'site.standard.publication#preferences',
				showInDiscover: true
			}
		});
	});

	test('parses a valid document record shape', () => {
		expect(
			document.parse({
				$type: 'site.standard.document',
				title: 'Hello',
				publishedAt: '2025-01-01T00:00:00Z',
				site: 'at://did:plc:alice/site.standard.publication/self',
				tags: ['news']
			})
		).toEqual({
			$type: 'site.standard.document',
			title: 'Hello',
			publishedAt: '2025-01-01T00:00:00Z',
			site: 'at://did:plc:alice/site.standard.publication/self',
			tags: ['news']
		});
	});

	test('rejects invalid publication record type', () => {
		expect(() => publication.parse({ $type: 'app.bsky.actor.profile' })).toThrow(
			'Invalid Standard Site publication record type'
		);
	});

	test('content.normalize normalizes supported offprint blocks', () => {
		const result = content.normalize({
			$type: 'app.offprint.content',
			items: [
				{
					$type: 'app.offprint.block.heading',
					level: 2,
					plaintext: 'Heading 2'
				},
				{
					$type: 'app.offprint.block.blockquote',
					content: [{ $type: 'app.offprint.block.text', plaintext: 'Quote' }]
				},
				{
					$type: 'app.offprint.block.taskList',
					children: [
						{
							checked: false,
							content: { $type: 'app.offprint.block.text', plaintext: 'TodoList1' }
						},
						{
							checked: true,
							content: { $type: 'app.offprint.block.text', plaintext: 'TodoList2' },
							children: [
								{
									checked: false,
									content: { $type: 'app.offprint.block.text', plaintext: 'SubTodoList1' }
								}
							]
						}
					]
				},
				{
					$type: 'app.offprint.block.webBookmark',
					href: 'https://github.com/tassis',
					title: 'tassis - Overview'
				},
				{
					$type: 'app.offprint.block.image',
					image: {
						ref: { $link: 'bafk-image' },
						mimeType: 'image/jpeg'
					},
					aspectRatio: { width: 1200, height: 630 }
				}
			]
		});

		expect(result).toEqual({
			vendor: 'offprint',
			contentType: 'app.offprint.content',
			blocks: [
				{ type: 'heading', level: 2, text: 'Heading 2' },
				{ type: 'blockquote', text: 'Quote' },
				{
					type: 'list',
					style: 'task',
					items: [
						{
							text: 'TodoList1',
							blocks: [{ type: 'paragraph', text: 'TodoList1' }],
							checked: false
						},
						{
							text: 'TodoList2',
							blocks: [{ type: 'paragraph', text: 'TodoList2' }],
							checked: true,
							children: [
								{
									text: 'SubTodoList1',
									blocks: [{ type: 'paragraph', text: 'SubTodoList1' }],
									checked: false
								}
							]
						}
					]
				},
				{
					type: 'embed',
					embedType: 'link',
					url: 'https://github.com/tassis',
					title: 'tassis - Overview'
				},
				{
					type: 'image',
					layout: 'single',
					images: [
						{
							cid: 'bafk-image',
							mimeType: 'image/jpeg',
							width: 1200,
							height: 630
						}
					]
				}
			],
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize supports offprint image blocks using blob-shaped records', () => {
		const result = content.normalize({
			$type: 'app.offprint.content',
			items: [
				{
					$type: 'app.offprint.block.image',
					blob: {
						ref: { $link: 'bafk-single-blob' },
						mimeType: 'image/png'
					},
					aspectRatio: { width: 640, height: 480 }
				},
				{
					$type: 'app.offprint.block.imageGrid',
					images: [
						{
							blob: {
								ref: { $link: 'bafk-grid-blob' },
								mimeType: 'image/webp'
							},
							aspectRatio: { width: 320, height: 240 }
						}
					]
				}
			]
		});

		expect(result).toEqual({
			vendor: 'offprint',
			contentType: 'app.offprint.content',
			blocks: [
				{
					type: 'image',
					layout: 'single',
					images: [
						{
							cid: 'bafk-single-blob',
							mimeType: 'image/png',
							width: 640,
							height: 480
						}
					]
				},
				{
					type: 'image',
					layout: 'grid',
					images: [
						{
							cid: 'bafk-grid-blob',
							mimeType: 'image/webp',
							width: 320,
							height: 240
						}
					]
				}
			],
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize warns and falls back for unsupported blocks', () => {
		const seenWarnings: string[] = [];
		const result = content.normalize(
			{
				$type: 'app.offprint.content',
				items: [
					{ $type: 'app.offprint.block.heading', plaintext: 'Heading 1', level: 1 },
					{ $type: 'app.offprint.block.table', cells: ['one', 'two', 'three'] }
				]
			},
			{
				fallbackText: 'Heading 1\nonetwothree',
				onWarning: (warning) => seenWarnings.push(warning.code)
			}
		);

		expect(result).toEqual({
			vendor: 'offprint',
			contentType: 'app.offprint.content',
			blocks: [
				{ type: 'heading', level: 1, text: 'Heading 1' },
				{
					type: 'unsupported',
					rawType: 'app.offprint.block.table',
					vendor: 'offprint',
					raw: { $type: 'app.offprint.block.table', cells: ['one', 'two', 'three'] }
				}
			],
			warnings: [
				{
					code: 'unsupported_block',
					message: 'Unsupported standard.site content block: app.offprint.block.table',
					path: 'content.items[1]',
					rawType: 'app.offprint.block.table'
				}
			],
			fallbackText: 'Heading 1\nonetwothree'
		});
		expect(seenWarnings).toEqual(['unsupported_block']);
	});

	test('content.normalize warns for invalid content input', () => {
		const result = content.normalize(undefined, {
			fallbackText: 'Fallback text only'
		});

		expect(result).toEqual({
			vendor: undefined,
			contentType: undefined,
			blocks: [],
			warnings: [
				{
					code: 'invalid_content',
					message: 'Expected standard.site content object',
					path: 'content'
				}
			],
			fallbackText: 'Fallback text only'
		});
	});

	test('content.renderMarkdown renders representative shared blocks', () => {
		const markdown = content.renderMarkdown([
			{ type: 'heading', level: 2, text: 'Hello' },
			{
				type: 'paragraph',
				text: 'hello world',
				richText: {
					text: 'hello world',
					spans: [
						{ byteStart: 0, byteEnd: 5, marks: ['bold'] },
						{ byteStart: 6, byteEnd: 11, link: 'https://example.com' }
					]
				}
			},
			{
				type: 'list',
				style: 'bullet',
				items: [
					{
						text: 'Parent',
						blocks: [{ type: 'heading', level: 3, text: 'Nested title' }],
						children: [{ text: 'Child' }]
					}
				]
			},
			{ type: 'code', code: 'const a = 1;', language: 'ts' },
			{
				type: 'table',
				rows: [
					{
						cells: [
							{ text: 'One', header: true },
							{ text: 'Two', header: true }
						]
					},
					{ cells: [{ text: 'A' }, { text: 'B' }] }
				]
			},
			{ type: 'unsupported', rawType: 'pub.leaflet.blocks.page', vendor: 'leaflet', raw: {} }
		]);

		expect(markdown).toBe(
			[
				'## Hello',
				'',
				'**hello** [world](https://example.com)',
				'',
				'-',
				'',
				'    ### Nested title',
				'',
				'    - Child',
				'',
				'```ts',
				'const a = 1;',
				'```',
				'',
				'| One | Two |',
				'| --- | --- |',
				'| A | B |',
				'',
				'<!-- unsupported block: pub.leaflet.blocks.page -->'
			].join('\n')
		);
	});

	test('content.renderMarkdown can omit unknown block comments', () => {
		const markdown = content.renderMarkdown(
			[{ type: 'unsupported', rawType: 'app.offprint.block.mystery', vendor: 'offprint', raw: {} }],
			{ preserveFallbackBlocksAsComments: false }
		);

		expect(markdown).toBe('');
	});

	test('content.renderMarkdown can opt into inline HTML for underline and highlight', () => {
		const markdown = content.renderMarkdown(
			[
				{
					type: 'paragraph',
					text: 'abcdef',
					richText: {
						text: 'abcdef',
						spans: [
							{ byteStart: 0, byteEnd: 3, marks: ['underline'] },
							{ byteStart: 3, byteEnd: 6, marks: ['highlight'] }
						]
					}
				}
			],
			{ inlineStyle: 'html' }
		);

		expect(markdown).toBe('<u>abc</u><mark>def</mark>');
	});

	test('content.renderMarkdown cleans merged HTML inline output', () => {
		const text = 'link highlight';
		const markdown = content.renderMarkdown(
			[
				{
					type: 'paragraph',
					text,
					richText: {
						text,
						spans: [
							{
								byteStart: 0,
								byteEnd: 4,
								marks: ['bold'],
								link: 'https://bsky.app/profile/tassis.bsky.social'
							},
							{
								byteStart: 4,
								byteEnd: 5,
								marks: ['bold', 'italic'],
								link: 'https://bsky.app/profile/tassis.bsky.social'
							},
							{
								byteStart: 5,
								byteEnd: 14,
								marks: ['highlight'],
								link: 'https://bsky.app/profile/tassis.bsky.social'
							}
						]
					}
				}
			],
			{ inlineStyle: 'html' }
		);

		expect(markdown).toBe(
			'<a href="https://bsky.app/profile/tassis.bsky.social"><strong>link</strong> <mark>highlight</mark></a>'
		);
	});

	test('content.renderMarkdown keeps mixed rich text markdown stable by default', () => {
		const text =
			'RichTextLine the bold, Italic, strikethrough, and underline code with hyperlink and highlight';
		const range = (needle: string) => {
			const start = text.indexOf(needle);
			return { byteStart: start, byteEnd: start + needle.length };
		};

		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ ...range('bold'), marks: ['bold'] },
						{ ...range('Italic'), marks: ['italic'] },
						{ ...range('strikethrough'), marks: ['strikethrough'] },
						{ ...range('underline'), marks: ['underline'] },
						{ ...range('code'), marks: ['code'] },
						{ ...range('hyperlink'), link: 'https://bsky.app/profile/tassis.bsky.social' },
						{ ...range('highlight'), marks: ['highlight'] }
					]
				}
			}
		]);

		expect(markdown).toBe(
			'RichTextLine the **bold**, *Italic*, ~~strikethrough~~, and underline `code` with [hyperlink](https://bsky.app/profile/tassis.bsky.social) and highlight'
		);
	});

	test('content.renderMarkdown degrades overlapping bold and italic ranges by default', () => {
		const text = 'plain bolditalic overlap plain';
		const range = (needle: string, fromIndex = 0) => {
			const start = text.indexOf(needle, fromIndex);
			return { byteStart: start, byteEnd: start + needle.length };
		};

		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ ...range('bolditalic'), marks: ['bold', 'italic'] },
						{ ...range('bolditalic overlap'), marks: ['bold'] },
						{ ...range('overlap', text.indexOf('overlap')), marks: ['italic'] }
					]
				}
			}
		]);

		expect(markdown).toBe('plain bolditalic overlap plain');
	});

	test('content.renderMarkdown keeps adjacent mixed formatting ranges stable by default', () => {
		const text = 'RichTextLine the bold, Italic';
		const range = (needle: string) => {
			const start = text.indexOf(needle);
			return { byteStart: start, byteEnd: start + needle.length };
		};

		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ ...range('bold,'), marks: ['bold'] },
						{ ...range('Italic'), marks: ['italic'] }
					]
				}
			}
		]);

		expect(markdown).toBe('RichTextLine the **bold,** *Italic*');
	});

	test('content.renderMarkdown degrades directly touching mixed formatting ranges by default', () => {
		const text = 'boldItalic';
		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ byteStart: 0, byteEnd: 4, marks: ['bold'] },
						{ byteStart: 4, byteEnd: 10, marks: ['italic'] }
					]
				}
			}
		]);

		expect(markdown).toBe('boldItalic');
	});

	test('content.renderMarkdown degrades overlapping UTF-8 mixed formatting ranges by default', () => {
		const text = '前言 粗體斜體 重疊 結尾';
		const range = (needle: string, fromIndex = 0) => {
			const start = text.indexOf(needle, fromIndex);
			const encoder = new TextEncoder();
			return {
				byteStart: encoder.encode(text.slice(0, start)).length,
				byteEnd: encoder.encode(text.slice(0, start + needle.length)).length
			};
		};

		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ ...range('粗體斜體'), marks: ['bold', 'italic'] },
						{ ...range('粗體斜體 重疊'), marks: ['bold'] },
						{ ...range('重疊', text.indexOf('重疊')), marks: ['italic'] }
					]
				}
			}
		]);

		expect(markdown).toBe('前言 粗體斜體 重疊 結尾');
	});

	test('content.renderMarkdown degrades directly touching UTF-8 mixed formatting ranges by default', () => {
		const text = '粗體🙂斜體';
		const encoder = new TextEncoder();
		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ byteStart: 0, byteEnd: encoder.encode('粗體').length, marks: ['bold'] },
						{
							byteStart: encoder.encode('粗體').length,
							byteEnd: encoder.encode('粗體🙂斜體').length,
							marks: ['italic']
						}
					]
				}
			}
		]);

		expect(markdown).toBe('粗體🙂斜體');
	});

	test('content.renderMarkdown preserves UTF-8 rich text byte ranges', () => {
		const text = '前言 中文 🙂 link';
		const range = (needle: string) => {
			const start = text.indexOf(needle);
			const encoder = new TextEncoder();
			return {
				byteStart: encoder.encode(text.slice(0, start)).length,
				byteEnd: encoder.encode(text.slice(0, start + needle.length)).length
			};
		};

		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{ ...range('中文'), marks: ['bold'] },
						{ ...range('🙂'), marks: ['italic'] },
						{ ...range('link'), link: 'https://example.com' }
					]
				}
			}
		]);

		expect(markdown).toBe('前言 **中文** *🙂* [link](https://example.com)');
	});

	test('content.renderMarkdown preserves UTF-8 byte ranges in inline HTML mode', () => {
		const text = '台灣🙂測試';
		const range = (needle: string) => {
			const start = text.indexOf(needle);
			const encoder = new TextEncoder();
			return {
				byteStart: encoder.encode(text.slice(0, start)).length,
				byteEnd: encoder.encode(text.slice(0, start + needle.length)).length
			};
		};

		const markdown = content.renderMarkdown(
			[
				{
					type: 'paragraph',
					text,
					richText: {
						text,
						spans: [
							{ ...range('台灣'), marks: ['underline'] },
							{ ...range('🙂'), marks: ['highlight'] }
						]
					}
				}
			],
			{ inlineStyle: 'html' }
		);

		expect(markdown).toBe('<u>台灣</u><mark>🙂</mark>測試');
	});

	test('content.renderMarkdown ignores skipped metadata on normalized results', () => {
		const markdown = content.renderMarkdown({
			vendor: 'leaflet',
			contentType: 'pub.leaflet.content',
			blocks: [{ type: 'paragraph', text: 'Visible block' }],
			warnings: [],
			skipped: [
				{
					kind: 'container',
					vendor: 'leaflet',
					reason: 'unsupported_page_type',
					rawType: 'pub.leaflet.pages.canvas',
					path: 'content.pages[1]',
					raw: { $type: 'pub.leaflet.pages.canvas' }
				}
			],
			fallbackText: 'ignored fallback'
		});

		expect(markdown).toBe('Visible block');
	});

	test('content.renderMarkdown renders mention metadata as handle-first Bluesky links', () => {
		const text = 'alice text';
		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text,
				richText: {
					text,
					spans: [
						{
							byteStart: 0,
							byteEnd: 5,
							mention: { did: 'did:plc:alice', handle: 'alice.test' }
						}
					]
				}
			}
		]);

		expect(markdown).toBe('[alice](https://bsky.app/profile/alice.test) text');
	});

	test('content.renderMarkdown falls back to DID for mentions without handles', () => {
		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text: '@alice',
				richText: {
					text: '@alice',
					spans: [{ byteStart: 0, byteEnd: 6, mention: { did: 'did:plc:alice' } }]
				}
			}
		]);

		expect(markdown).toBe('[@alice](https://bsky.app/profile/did:plc:alice)');
	});

	test('content.renderMarkdown can customize mention profile base URL', () => {
		const markdown = content.renderMarkdown(
			[
				{
					type: 'paragraph',
					text: '@alice',
					richText: {
						text: '@alice',
						spans: [
							{ byteStart: 0, byteEnd: 6, mention: { handle: 'alice.test', did: 'did:plc:alice' } }
						]
					}
				}
			],
			{ mentionProfileBaseUrl: 'https://example.com/profile/' }
		);

		expect(markdown).toBe('[@alice](https://example.com/profile/alice.test)');
	});

	test('content.renderMarkdown renders leaflet-style didMention text to Bluesky profile links', () => {
		const markdown = content.renderMarkdown([
			{
				type: 'paragraph',
				text: '@tassis.bsky.social ',
				richText: {
					text: '@tassis.bsky.social ',
					spans: [
						{
							byteStart: 0,
							byteEnd: 19,
							mention: {
								did: 'did:plc:zxvukmzkctjttaljhhdl45lb',
								handle: 'tassis.bsky.social'
							}
						}
					]
				}
			}
		]);

		expect(markdown).toBe('[@tassis\\.bsky\\.social](https://bsky.app/profile/tassis.bsky.social)');
	});

	test('content.normalize preserves offprint rich text facets', () => {
		const result = content.normalize({
			$type: 'app.offprint.content',
			items: [
				{
					$type: 'app.offprint.block.text',
					plaintext: 'hello world',
					facets: [
						{
							index: { byteStart: 0, byteEnd: 5 },
							features: [{ $type: 'app.offprint.richtext.facet#bold' }]
						},
						{
							index: { byteStart: 6, byteEnd: 11 },
							features: [
								{ $type: 'app.offprint.richtext.facet#link', uri: 'https://example.com' },
								{
									$type: 'app.offprint.richtext.facet#mention',
									did: 'did:plc:alice',
									handle: 'alice.test'
								}
							]
						}
					]
				}
			]
		});

		expect(result).toEqual({
			vendor: 'offprint',
			contentType: 'app.offprint.content',
			blocks: [
				{
					type: 'paragraph',
					text: 'hello world',
					richText: {
						text: 'hello world',
						spans: [
							{
								byteStart: 0,
								byteEnd: 5,
								marks: ['bold'],
								link: undefined,
								mention: undefined
							},
							{
								byteStart: 6,
								byteEnd: 11,
								link: 'https://example.com',
								mention: { did: 'did:plc:alice', handle: 'alice.test' },
								marks: undefined
							}
						]
					}
				}
			],
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize normalizes supported pckt blocks', () => {
		const result = content.normalize({
			$type: 'blog.pckt.content',
			items: [
				{
					$type: 'blog.pckt.block.heading',
					level: 3,
					plaintext: 'Pckt Heading'
				},
				{
					$type: 'blog.pckt.block.website',
					src: 'https://example.com',
					title: 'Example',
					description: 'Example description'
				},
				{
					$type: 'blog.pckt.block.image',
					attrs: {
						src: 'https://cdn.example/image.jpg',
						alt: 'Cover image',
						title: 'Cover',
						align: 'center',
						aspectRatio: { width: 1200, height: 630 },
						blob: {
							ref: { $link: 'bafk-pckt-image' },
							mimeType: 'image/jpeg'
						}
					}
				},
				{
					$type: 'blog.pckt.block.table',
					content: [
						{
							$type: 'blog.pckt.block.tableRow',
							content: [
								{
									$type: 'blog.pckt.block.tableHeader',
									content: [{ $type: 'blog.pckt.block.text', plaintext: 'One' }]
								},
								{
									$type: 'blog.pckt.block.tableCell',
									colspan: 2,
									content: [{ $type: 'blog.pckt.block.text', plaintext: 'Two' }]
								}
							]
						}
					]
				},
				{
					$type: 'blog.pckt.block.gallery',
					ref: 'at://did:plc:alice/blog.pckt.gallery/gallery-1'
				}
			]
		});

		expect(result).toEqual({
			vendor: 'pckt',
			contentType: 'blog.pckt.content',
			blocks: [
				{ type: 'heading', level: 3, text: 'Pckt Heading' },
				{
					type: 'embed',
					embedType: 'link',
					url: 'https://example.com',
					title: 'Example',
					text: 'Example description'
				},
				{
					type: 'image',
					layout: 'single',
					images: [
						{
							cid: 'bafk-pckt-image',
							src: 'https://cdn.example/image.jpg',
							mimeType: 'image/jpeg',
							width: 1200,
							height: 630,
							alt: 'Cover image',
							title: 'Cover',
							align: 'center'
						}
					]
				},
				{
					type: 'table',
					rows: [
						{
							cells: [
								{ text: 'One', header: true },
								{ text: 'Two', header: false, colspan: 2 }
							]
						}
					]
				},
				{
					type: 'embed',
					embedType: 'gallery',
					url: 'at://did:plc:alice/blog.pckt.gallery/gallery-1'
				}
			],
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize preserves pckt rich text facets', () => {
		const result = content.normalize({
			$type: 'blog.pckt.content',
			items: [
				{
					$type: 'blog.pckt.block.heading',
					plaintext: 'pckt heading',
					facets: [
						{
							index: { byteStart: 0, byteEnd: 4 },
							features: [{ $type: 'blog.pckt.richtext.facet#italic' }]
						}
					]
				},
				{
					$type: 'blog.pckt.block.bulletList',
					content: [
						{
							content: [
								{
									$type: 'blog.pckt.block.text',
									plaintext: 'first item',
									facets: [
										{
											index: { byteStart: 0, byteEnd: 5 },
											features: [
												{ $type: 'blog.pckt.richtext.facet#didMention', did: 'did:plc:bob' },
												{
													$type: 'blog.pckt.richtext.facet#atMention',
													atURI: 'at://did:plc:bob/app.bsky.actor.profile/self'
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		});

		expect(result).toEqual({
			vendor: 'pckt',
			contentType: 'blog.pckt.content',
			blocks: [
				{
					type: 'heading',
					level: 1,
					text: 'pckt heading',
					richText: {
						text: 'pckt heading',
						spans: [
							{
								byteStart: 0,
								byteEnd: 4,
								marks: ['italic']
							}
						]
					}
				},
				{
					type: 'list',
					style: 'bullet',
					items: [
						{
							text: 'first item',
							blocks: [
								{
									type: 'paragraph',
									text: 'first item',
									richText: {
										text: 'first item',
										spans: [
											{
												byteStart: 0,
												byteEnd: 5,
												mention: {
													did: 'did:plc:bob',
													atUri: 'at://did:plc:bob/app.bsky.actor.profile/self'
												}
											}
										]
									}
								}
							],
							richText: {
								text: 'first item',
								spans: [
									{
										byteStart: 0,
										byteEnd: 5,
										mention: {
											did: 'did:plc:bob',
											atUri: 'at://did:plc:bob/app.bsky.actor.profile/self'
										}
									}
								]
							}
						}
					]
				}
			],
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize supports pckt code block attrs.language shape', () => {
		const result = content.normalize({
			$type: 'blog.pckt.content',
			items: [
				{
					$type: 'blog.pckt.block.codeBlock',
					attrs: { language: 'typescript' },
					plaintext: 'const callData = () => {\n  return "hi"\n}'
				}
			]
		});

		expect(result).toEqual({
			vendor: 'pckt',
			contentType: 'blog.pckt.content',
			blocks: [
				{
					type: 'code',
					code: 'const callData = () => {\n  return "hi"\n}',
					language: 'typescript'
				}
			],
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize supports leaflet linear document content extraction', () => {
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
								$type: 'pub.leaflet.blocks.header',
								level: 2,
								plaintext: 'Leaflet Heading'
							}
						},
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.unorderedList',
								children: [
									{
										$type: 'pub.leaflet.blocks.unorderedList#listItem',
										content: { $type: 'pub.leaflet.blocks.text', plaintext: 'Unorder1' },
										children: [
											{
												$type: 'pub.leaflet.blocks.unorderedList#listItem',
												content: { $type: 'pub.leaflet.blocks.text', plaintext: 'Unorder2' }
											}
										]
									}
								]
							}
						},
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.website',
								src: 'https://bsky.app/profile/tassis.bsky.social',
								title: 'Tassis',
								description: 'Software Engineer'
							}
						},
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.button',
								url: 'https://bsky.app/profile/tassis.bsky.social',
								text: 'Me'
							}
						},
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.code',
								language: 'typescript',
								plaintext: 'const callFunc = () => {\n  console.log("hi"); \n}'
							}
						},
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.poll',
								pollRef: {
									uri: 'at://did:plc:alice/pub.leaflet.poll.definition/poll-1',
									cid: 'bafyreipollcid'
								}
							}
						},
						{
							$type: 'pub.leaflet.pages.linearDocument#block',
							block: {
								$type: 'pub.leaflet.blocks.page',
								id: 'linked-page'
							}
						}
					]
				},
				{
					$type: 'pub.leaflet.pages.canvas',
					id: 'canvas-1',
					blocks: []
				}
			]
		});

		expect(result).toEqual({
			vendor: 'leaflet',
			contentType: 'pub.leaflet.content',
			blocks: [
				{ type: 'heading', level: 2, text: 'Leaflet Heading' },
				{
					type: 'list',
					style: 'bullet',
					items: [
						{
							text: 'Unorder1',
							blocks: [{ type: 'paragraph', text: 'Unorder1' }],
							children: [
								{
									text: 'Unorder2',
									blocks: [{ type: 'paragraph', text: 'Unorder2' }]
								}
							]
						}
					]
				},
				{
					type: 'embed',
					embedType: 'link',
					url: 'https://bsky.app/profile/tassis.bsky.social',
					title: 'Tassis',
					text: 'Software Engineer'
				},
				{
					type: 'embed',
					embedType: 'button',
					url: 'https://bsky.app/profile/tassis.bsky.social',
					text: 'Me'
				},
				{
					type: 'code',
					code: 'const callFunc = () => {\n  console.log("hi"); \n}',
					language: 'typescript'
				},
				{
					type: 'unsupported',
					rawType: 'pub.leaflet.blocks.poll',
					vendor: 'leaflet',
					raw: {
						$type: 'pub.leaflet.blocks.poll',
						pollRef: {
							uri: 'at://did:plc:alice/pub.leaflet.poll.definition/poll-1',
							cid: 'bafyreipollcid'
						}
					}
				},
				{
					type: 'unsupported',
					rawType: 'pub.leaflet.blocks.page',
					vendor: 'leaflet',
					raw: {
						$type: 'pub.leaflet.blocks.page',
						id: 'linked-page'
					}
				}
			],
			skipped: [
				{
					kind: 'container',
					vendor: 'leaflet',
					reason: 'unsupported_page_type',
					rawType: 'pub.leaflet.pages.canvas',
					path: 'content.pages[1]',
					raw: {
						$type: 'pub.leaflet.pages.canvas',
						id: 'canvas-1',
						blocks: []
					}
				}
			],
			warnings: [
				{
					code: 'unsupported_block',
					message: 'Unsupported standard.site content block: pub.leaflet.blocks.poll',
					path: 'content.pages[0].blocks[5].block',
					rawType: 'pub.leaflet.blocks.poll'
				},
				{
					code: 'unsupported_block',
					message: 'Unsupported standard.site content block: pub.leaflet.blocks.page',
					path: 'content.pages[0].blocks[6].block',
					rawType: 'pub.leaflet.blocks.page'
				}
			],
			fallbackText: undefined
		});
	});

	test('content.normalize preserves richer leaflet list item blocks', () => {
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
								$type: 'pub.leaflet.blocks.unorderedList',
								children: [
									{
										$type: 'pub.leaflet.blocks.unorderedList#listItem',
										content: {
											$type: 'pub.leaflet.blocks.header',
											level: 3,
											plaintext: 'Nested title'
										},
										children: [
											{
												$type: 'pub.leaflet.blocks.unorderedList#listItem',
												content: {
													$type: 'pub.leaflet.blocks.image',
													image: {
														ref: { $link: 'bafk-leaflet-item-image' },
														mimeType: 'image/webp'
													},
													aspectRatio: { width: 400, height: 300 },
													alt: 'Inline list image'
												}
											}
										]
									}
								]
							}
						}
					]
				}
			]
		});

		expect(result).toEqual({
			vendor: 'leaflet',
			contentType: 'pub.leaflet.content',
			blocks: [
				{
					type: 'list',
					style: 'bullet',
					items: [
						{
							text: 'Nested title',
							blocks: [{ type: 'heading', level: 3, text: 'Nested title' }],
							checked: undefined,
							children: [
								{
									text: '',
									blocks: [
										{
											type: 'image',
											layout: 'single',
											images: [
												{
													cid: 'bafk-leaflet-item-image',
													src: undefined,
													mimeType: 'image/webp',
													width: 400,
													height: 300,
													alt: 'Inline list image'
												}
											]
										}
									],
									checked: undefined,
									children: undefined
								}
							]
						}
					]
				}
			],
			skipped: undefined,
			warnings: [],
			fallbackText: undefined
		});
	});

	test('content.normalize warns for unsupported content types', () => {
		const result = content.normalize(
			{
				$type: 'app.unknown.content',
				items: []
			},
			{
				fallbackText: 'Fallback text only'
			}
		);

		expect(result).toEqual({
			vendor: undefined,
			contentType: 'app.unknown.content',
			blocks: [],
			warnings: [
				{
					code: 'unsupported_content',
					message: 'Unsupported standard.site content type: app.unknown.content',
					path: 'content',
					rawType: 'app.unknown.content'
				}
			],
			fallbackText: 'Fallback text only'
		});
	});

	test('content.normalize warns for missing items array', () => {
		const result = content.normalize(
			{
				$type: 'app.offprint.content'
			},
			{
				fallbackText: 'Fallback text only'
			}
		);

		expect(result).toEqual({
			vendor: 'offprint',
			contentType: 'app.offprint.content',
			blocks: [],
			warnings: [
				{
					code: 'invalid_items',
					message: 'Expected standard.site content items array',
					path: 'content.items'
				}
			],
			fallbackText: 'Fallback text only'
		});
	});

	test('getPublication defaults to self and normalizes icon blob url', async () => {
		let requestedUrl = '';

		const transport: CoreTransport = {
			request: async ({ url }) => {
				requestedUrl = String(url);
				return {
					status: 200,
					headers: new Headers(),
					text: ''
				};
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>() =>
				({
					uri: 'at://did:plc:alice/site.standard.publication/self',
					cid: 'cid-publication',
					value: {
						name: 'Example Publication',
						url: 'https://example.com',
						icon: { ref: { $link: 'icon-cid' } },
						preferences: { showInDiscover: false }
					}
				}) as T
		};

		const publicationRecord = await publication.get(transport, identity);

		expect(requestedUrl).toContain('collection=site.standard.publication');
		expect(requestedUrl).toContain('rkey=self');
		expect(publicationRecord).toEqual({
			uri: 'at://did:plc:alice/site.standard.publication/self',
			rkey: 'self',
			cid: 'cid-publication',
			name: 'Example Publication',
			url: 'https://example.com',
			description: undefined,
			icon: 'https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aalice&cid=icon-cid',
			showInDiscover: false,
			author: {
				did: 'did:plc:alice',
				handle: 'alice.test'
			}
		});
	});

	test('listDocuments normalizes cover image and refs', async () => {
		const transport: CoreTransport = {
			request: async () => {
				throw new Error('request should not be called directly');
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>() =>
				({
					cursor: 'next-cursor',
					records: [
						{
							uri: 'at://did:plc:alice/site.standard.document/hello',
							cid: 'cid-document',
							value: {
								title: 'Hello',
								publishedAt: '2025-01-01T00:00:00Z',
								site: 'at://did:plc:alice/site.standard.publication/self',
								path: '/hello',
								coverImage: { ref: { $link: 'cover-cid' } },
								bskyPostRef: {
									uri: 'at://did:plc:alice/app.bsky.feed.post/abc',
									cid: 'cid-post'
								},
								contributors: [{ did: 'did:plc:bob', displayName: 'Bob', role: 'Editor' }]
							}
						}
					]
				}) as T
		};

		const response = await document.list(transport, identity, { limit: 10 });

		expect(response).toEqual({
			cursor: 'next-cursor',
			documents: [
				{
					uri: 'at://did:plc:alice/site.standard.document/hello',
					rkey: 'hello',
					cid: 'cid-document',
					title: 'Hello',
					site: 'at://did:plc:alice/site.standard.publication/self',
					publishedAt: '2025-01-01T00:00:00Z',
					path: '/hello',
					description: undefined,
					tags: undefined,
					textContent: undefined,
					content: undefined,
					updatedAt: undefined,
					coverImage:
						'https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aalice&cid=cover-cid',
					bskyPostUri: 'at://did:plc:alice/app.bsky.feed.post/abc',
					contributors: [{ did: 'did:plc:bob', displayName: 'Bob', role: 'Editor' }],
					author: {
						did: 'did:plc:alice',
						handle: 'alice.test'
					}
				}
			]
		});
	});

	test('listDocuments exposes normalized shared content result', async () => {
		const transport: CoreTransport = {
			request: async () => {
				throw new Error('request should not be called directly');
			},
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
												},
												{
													$type: 'pub.leaflet.pages.linearDocument#block',
													block: {
														$type: 'pub.leaflet.blocks.image',
														image: {
															ref: { $link: 'bafk-leaflet-doc-image' },
															mimeType: 'image/png'
														},
														aspectRatio: { width: 800, height: 600 },
														alt: 'Leaflet image'
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

		expect(response.documents[0]?.content).toEqual({
			vendor: 'leaflet',
			contentType: 'pub.leaflet.content',
			blocks: [
				{ type: 'heading', level: 2, text: 'Leaflet Heading' },
				{
					type: 'image',
					layout: 'single',
					images: [
						{
							cid: 'bafk-leaflet-doc-image',
							src: 'https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aalice&cid=bafk-leaflet-doc-image',
							mimeType: 'image/png',
							width: 800,
							height: 600,
							alt: 'Leaflet image'
						}
					]
				}
			],
			warnings: [],
			fallbackText: 'Leaflet Heading'
		});
	});

	test('getDocument returns null when repo record is missing', async () => {
		const transport: CoreTransport = {
			request: async () => ({
				status: 404,
				headers: new Headers(),
				text: ''
			}),
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async () => {
				throw new Error('requestJson should not be called');
			}
		};

		expect(await document.get(transport, identity, { rkey: 'missing' })).toBeNull();
	});
});
