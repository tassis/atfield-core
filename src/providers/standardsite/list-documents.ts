import { listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { STANDARDSITE_DOCUMENT_COLLECTION } from '#core/providers/standardsite/get-document';
import { normalizeDocument } from '#core/providers/standardsite/normalize';

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
