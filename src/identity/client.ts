import type { CoreServicesConfig } from '#core/core.types';
import type { CoreTransport } from '#core/transport';
import type { IdentityInput, ResolvedIdentity } from '#core/types';
import { DEFAULT_HANDLE_RESOLVER_URL, resolveHandle } from '#core/identity/handle';
import { resolveIdentity } from '#core/identity/resolve-identity';
import type { ResolveIdentityOptions } from '#core/identity/types';

export type AtfieldCoreIdentityClient = {
	resolve(input: IdentityInput, options?: ResolveIdentityOptions): Promise<ResolvedIdentity>;
	resolveHandle(params: { handle: string; baseUrl?: string }): Promise<string>;
};

export function buildIdentityClient(
	transport: CoreTransport,
	services: Required<CoreServicesConfig>
): AtfieldCoreIdentityClient {
	return {
		resolve: (input, options) =>
			resolveIdentity(transport, input, {
				handleResolverUrl: options?.handleResolverUrl ?? services.handleResolverUrl
			}),
		resolveHandle: (params) =>
			resolveHandle(transport, {
				handle: params.handle,
				baseUrl: params.baseUrl ?? services.handleResolverUrl ?? DEFAULT_HANDLE_RESOLVER_URL
			})
	};
}
