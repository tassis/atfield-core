import { getRecord, type RepoRecord } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

export async function readStandardSiteRecord<T>(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	options: {
		collection: string;
		rkey: string;
		normalize: (record: RepoRecord, identity: ResolvedIdentity) => T;
	}
) {
	const record = await getRecord(transport, identity, {
		collection: options.collection,
		rkey: options.rkey
	});

	return record ? options.normalize(record, identity) : null;
}
