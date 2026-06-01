import { getRecord, listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizePostRecord } from './normalization';

export const BSKY_POST_COLLECTION = 'app.bsky.feed.post';

export async function getPost(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey: string }
) {
	const record = await getRecord(transport, identity, {
		collection: BSKY_POST_COLLECTION,
		rkey: params.rkey
	});

	return record ? normalizePostRecord(record, identity) : null;
}

export async function listPosts(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	options: { limit: number; cursor?: string }
) {
	const response = await listRecords(transport, identity, {
		collection: BSKY_POST_COLLECTION,
		limit: options.limit,
		cursor: options.cursor
	});

	return {
		cursor: response.cursor,
		posts: response.records.map((record) => normalizePostRecord(record, identity))
	};
}
