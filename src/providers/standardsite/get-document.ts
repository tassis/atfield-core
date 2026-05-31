import { getRecord } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizeDocument } from '#core/providers/standardsite/normalize';

export const STANDARDSITE_DOCUMENT_COLLECTION = 'site.standard.document';

export async function getDocument(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey: string }
) {
	const record = await getRecord(transport, identity, {
		collection: STANDARDSITE_DOCUMENT_COLLECTION,
		rkey: params.rkey
	});

	return record ? normalizeDocument(record, identity) : null;
}
