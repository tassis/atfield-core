import { listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizePostRecord } from '#core/providers/bsky/normalize';

export async function listPosts(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	options: { limit: number; cursor?: string }
) {
	const response = await listRecords(transport, identity, {
		collection: 'app.bsky.feed.post',
		limit: options.limit,
		cursor: options.cursor
	});

	return {
		cursor: response.cursor,
		posts: response.records.map((record) => normalizePostRecord(record, identity))
	};
}
