import { describe, expect, test } from 'bun:test';

import { getDocument, getPublication, listDocuments } from '#core/providers/standardsite';
import {
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord
} from '#core/providers/standardsite';
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
			parseStandardSitePublicationRecord({
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
			parseStandardSiteDocumentRecord({
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
		expect(() => parseStandardSitePublicationRecord({ $type: 'app.bsky.actor.profile' })).toThrow(
			'Invalid Standard Site publication record type'
		);
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

		const publication = await getPublication(transport, identity);

		expect(requestedUrl).toContain('collection=site.standard.publication');
		expect(requestedUrl).toContain('rkey=self');
		expect(publication).toEqual({
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
								contributors: [
									{ did: 'did:plc:bob', displayName: 'Bob', role: 'Editor' }
								]
							}
						}
					]
				}) as T
		};

		const response = await listDocuments(transport, identity, { limit: 10 });

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
					updatedAt: undefined,
					coverImage:
						'https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aalice&cid=cover-cid',
					bskyPostUri: 'at://did:plc:alice/app.bsky.feed.post/abc',
					contributors: [
						{ did: 'did:plc:bob', displayName: 'Bob', role: 'Editor' }
					],
					author: {
						did: 'did:plc:alice',
						handle: 'alice.test'
					}
				}
			]
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

		expect(await getDocument(transport, identity, { rkey: 'missing' })).toBeNull();
	});
});
