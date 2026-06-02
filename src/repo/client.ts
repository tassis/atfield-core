import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { buildBlobUrl } from '#core/repo/blob';
import { getRecord } from '#core/repo/record';
import { listRecords } from '#core/repo/records';

// After transport and identity are bound, the client only forwards getRecord params.
type RepoGetRecordParams = Parameters<typeof getRecord>[2];

// After transport and identity are bound, the client only forwards listRecords params.
type RepoListRecordsParams = Parameters<typeof listRecords>[2];

export type AtfieldCoreRepoClient = {
	buildBlobUrl: typeof buildBlobUrl;
	getRecord: (
		identity: ResolvedIdentity,
		params: RepoGetRecordParams
	) => ReturnType<typeof getRecord>;
	listRecords: (
		identity: ResolvedIdentity,
		params: RepoListRecordsParams
	) => ReturnType<typeof listRecords>;
};

export function buildRepoClient(transport: CoreTransport): AtfieldCoreRepoClient {
	return {
		buildBlobUrl,
		getRecord: (identity, params) => getRecord(transport, identity, params),
		listRecords: (identity, params) => listRecords(transport, identity, params)
	};
}
