import { getRecord } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizePostRecord } from '#core/providers/bsky/normalize';

export async function getPost(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey: string }
) {
	const record = await getRecord(transport, identity, {
		collection: 'app.bsky.feed.post',
		rkey: params.rkey
	});

	return record ? normalizePostRecord(record, identity) : null;
}
