import { getDidDocument, getHandleFromDidDocument, getPdsUrlFromDidDocument } from '#core/did';
import type { CoreTransport } from '#core/transport';
import type { IdentityInput, ResolvedIdentity } from '#core/types';
import { resolveHandle } from '#core/identity/handle';
import type { ResolveIdentityOptions } from '#core/identity/types';

export async function resolveIdentity(
	transport: CoreTransport,
	input: IdentityInput,
	options: ResolveIdentityOptions = {}
): Promise<ResolvedIdentity> {
	const did =
		input.did ??
		(input.handle
			? await resolveHandle(transport, {
					handle: input.handle,
					baseUrl: options.handleResolverUrl
				})
			: undefined);

	if (!did) {
		throw new Error('Missing identity.handle or identity.did');
	}

	const didDocument = await getDidDocument(transport, { did });

	return {
		did,
		handle: input.handle ?? getHandleFromDidDocument(didDocument),
		pdsUrl: getPdsUrlFromDidDocument(didDocument)
	};
}
