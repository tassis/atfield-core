import type { DidDocument, IdentityInput, ResolvedIdentity } from './types';

export const DEFAULT_HANDLE_RESOLVER_URL = 'https://bsky.social/xrpc';

export function getCanonicalDid(input: IdentityInput) {
	return input.did;
}

export function getHandleFromDidDocument(document: DidDocument) {
	const alsoKnownAs = document.alsoKnownAs?.find((entry) => entry.startsWith('at://'));
	return alsoKnownAs?.slice('at://'.length);
}

export function getPdsUrlFromDidDocument(document: DidDocument) {
	const service = document.service?.find(
		(entry) =>
			(entry.id === '#atproto_pds' || entry.id?.endsWith('#atproto_pds')) &&
			entry.type === 'AtprotoPersonalDataServer' &&
			typeof entry.serviceEndpoint === 'string'
	);

	if (!service?.serviceEndpoint) {
		throw new Error(`No atproto PDS service endpoint found for DID ${document.id}`);
	}

	return service.serviceEndpoint;
}

export function createResolvedIdentity(input: {
	did: string;
	handle?: string;
	pdsUrl: string;
}): ResolvedIdentity {
	return {
		did: input.did,
		handle: input.handle,
		pdsUrl: input.pdsUrl
	};
}
