import { describe, expect, test } from 'bun:test';

import { getArticle, listArticles } from '#core/providers/whitewind';
import {
	isVisibleWhitewindArticleRecord,
	parseWhitewindArticleRecord
} from '#core/providers/whitewind';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

const identity: ResolvedIdentity = {
	did: 'did:plc:alice',
	handle: 'alice.test',
	pdsUrl: 'https://pds.example.com'
};

describe('whitewind article helpers', () => {
	test('parses a valid record shape', () => {
		expect(
			parseWhitewindArticleRecord({
				$type: 'com.whtwnd.blog.entry',
				title: 'Hello',
				content: 'World',
				createdAt: '2025-01-01T00:00:00Z',
				visibility: 'public',
				blobs: []
			})
		).toEqual({
			$type: 'com.whtwnd.blog.entry',
			title: 'Hello',
			content: 'World',
			createdAt: '2025-01-01T00:00:00Z',
			visibility: 'public',
			blobs: []
		});
	});

	test('rejects invalid record type', () => {
		expect(() => parseWhitewindArticleRecord({ $type: 'app.bsky.feed.post' })).toThrow(
			'Invalid Whitewind article record type'
		);
	});

	test('defaults visibility filter to public', () => {
		expect(isVisibleWhitewindArticleRecord({ visibility: 'public' })).toBe(true);
		expect(isVisibleWhitewindArticleRecord({ visibility: 'private' })).toBe(false);
		expect(isVisibleWhitewindArticleRecord({})).toBe(true);
	});

	test('allows all records when visibility is all', () => {
		expect(isVisibleWhitewindArticleRecord({ visibility: 'private' }, 'all')).toBe(true);
	});

	test('listArticles filters non-public records by default', async () => {
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
							uri: 'at://did:plc:alice/com.whtwnd.blog.entry/public-one',
							cid: 'cid-1',
							value: { title: 'Public', content: 'A', visibility: 'public' }
						},
						{
							uri: 'at://did:plc:alice/com.whtwnd.blog.entry/private-one',
							cid: 'cid-2',
							value: { title: 'Private', content: 'B', visibility: 'private' }
						}
					]
				}) as T
		};

		const response = await listArticles(transport, identity, { limit: 10 });

		expect(response).toEqual({
			cursor: 'next-cursor',
			articles: [
				{
					uri: 'at://did:plc:alice/com.whtwnd.blog.entry/public-one',
					rkey: 'public-one',
					cid: 'cid-1',
					title: 'Public',
					content: 'A',
					createdAt: undefined,
					author: {
						did: 'did:plc:alice',
						handle: 'alice.test'
					}
				}
			]
		});
	});

	test('getArticle returns null for non-public record by default', async () => {
		const transport: CoreTransport = {
			request: async ({ url }) => ({
				status: 200,
				headers: new Headers(),
				text: String(url)
			}),
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>() =>
				({
					uri: 'at://did:plc:alice/com.whtwnd.blog.entry/private-one',
					cid: 'cid-2',
					value: { title: 'Private', content: 'B', visibility: 'private' }
				}) as T
		};

		const article = await getArticle(transport, identity, { rkey: 'private-one' });

		expect(article).toBeNull();
	});

	test('getArticle returns private record when visibility is all', async () => {
		const transport: CoreTransport = {
			request: async ({ url }) => ({
				status: 200,
				headers: new Headers(),
				text: String(url)
			}),
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>() =>
				({
					uri: 'at://did:plc:alice/com.whtwnd.blog.entry/private-one',
					cid: 'cid-2',
					value: { title: 'Private', content: 'B', visibility: 'private' }
				}) as T
		};

		const article = await getArticle(transport, identity, {
			rkey: 'private-one',
			visibility: 'all'
		});

		expect(article).toEqual({
			uri: 'at://did:plc:alice/com.whtwnd.blog.entry/private-one',
			rkey: 'private-one',
			cid: 'cid-2',
			title: 'Private',
			content: 'B',
			createdAt: undefined,
			author: {
				did: 'did:plc:alice',
				handle: 'alice.test'
			}
		});
	});
});
