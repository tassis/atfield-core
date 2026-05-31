import { getRecord } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import {
	normalizePublication
} from '#core/providers/standardsite/normalize';

export const STANDARDSITE_PUBLICATION_COLLECTION = 'site.standard.publication';

export async function getPublication(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey?: string } = {}
) {
	const record = await getRecord(transport, identity, {
		collection: STANDARDSITE_PUBLICATION_COLLECTION,
		rkey: params.rkey ?? 'self'
	});

	return record ? normalizePublication(record, identity) : null;
}
