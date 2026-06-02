import { listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizeDocument } from './normalization';
import { readStandardSiteRecord } from './record';

export const STANDARDSITE_DOCUMENT_COLLECTION = 'site.standard.document';

export async function getDocument(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey: string }
) {
	return readStandardSiteRecord(transport, identity, {
		collection: STANDARDSITE_DOCUMENT_COLLECTION,
		rkey: params.rkey,
		normalize: normalizeDocument
	});
}

export async function listDocuments(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	options: { limit: number; cursor?: string }
) {
	const response = await listRecords(transport, identity, {
		collection: STANDARDSITE_DOCUMENT_COLLECTION,
		limit: options.limit,
		cursor: options.cursor
	});

	return {
		cursor: response.cursor,
		documents: response.records.map((record) => normalizeDocument(record, identity))
	};
}
