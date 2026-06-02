import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizePublication } from './normalization';
import { readStandardSiteRecord } from './record';

export const STANDARDSITE_PUBLICATION_COLLECTION = 'site.standard.publication';

export async function getPublication(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey?: string } = {}
) {
	return readStandardSiteRecord(transport, identity, {
		collection: STANDARDSITE_PUBLICATION_COLLECTION,
		rkey: params.rkey ?? 'self',
		normalize: normalizePublication
	});
}
