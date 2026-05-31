import { describe, expect, test } from 'bun:test';

import { getRecord, listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

const identity: ResolvedIdentity = {
	did: 'did:plc:alice',
	handle: 'alice.test',
	pdsUrl: 'https://pds.example.com'
};

describe('repo access', () => {
	test('getRecord returns null on 404', async () => {
		const transport: CoreTransport = {
			request: async ({ url }) => {
				expect(String(url)).toBe(
					'https://pds.example.com/xrpc/com.atproto.repo.getRecord?repo=did%3Aplc%3Aalice&collection=app.bsky.feed.post&rkey=missing'
				);

				return {
					status: 404,
					headers: new Headers(),
					text: 'not found'
				};
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async () => {
				throw new Error('requestJson should not be called');
			}
		};

		const record = await getRecord(transport, identity, {
			collection: 'app.bsky.feed.post',
			rkey: 'missing'
		});

		expect(record).toBeNull();
	});

	test('listRecords builds expected URL and returns payload', async () => {
		const transport: CoreTransport = {
			request: async () => {
				throw new Error('request should not be called directly');
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>({ url }: Parameters<CoreTransport['requestJson']>[0]) => {
				expect(String(url)).toBe(
					'https://pds.example.com/xrpc/com.atproto.repo.listRecords?repo=did%3Aplc%3Aalice&collection=com.whtwnd.blog.entry&limit=10&cursor=cursor-1'
				);

				return {
					cursor: 'cursor-2',
					records: [
						{
							uri: 'at://did:plc:alice/com.whtwnd.blog.entry/entry-1',
							cid: 'cid-1',
							value: { title: 'Hello' }
						}
					]
				} as T;
			}
		};

		const response = await listRecords(transport, identity, {
			collection: 'com.whtwnd.blog.entry',
			limit: 10,
			cursor: 'cursor-1'
		});

		expect(response).toEqual({
			cursor: 'cursor-2',
			records: [
				{
					uri: 'at://did:plc:alice/com.whtwnd.blog.entry/entry-1',
					cid: 'cid-1',
					value: { title: 'Hello' }
				}
			]
		});
	});
});
