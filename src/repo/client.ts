import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { buildBlobUrl } from '#core/repo/blob';
import { getRecord } from '#core/repo/get-record';
import { listRecords } from '#core/repo/list-records';

export type AtfieldCoreRepoClient = {
	buildBlobUrl: typeof buildBlobUrl;
	getRecord: (
		identity: ResolvedIdentity,
		params: Parameters<typeof getRecord>[2]
	) => ReturnType<typeof getRecord>;
	listRecords: (
		identity: ResolvedIdentity,
		params: Parameters<typeof listRecords>[2]
	) => ReturnType<typeof listRecords>;
};

export function buildRepoClient(transport: CoreTransport): AtfieldCoreRepoClient {
	return {
		buildBlobUrl,
		getRecord: (identity, params) => getRecord(transport, identity, params),
		listRecords: (identity, params) => listRecords(transport, identity, params)
	};
}
