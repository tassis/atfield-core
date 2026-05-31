import { buildDidClient } from '#core/did';
import { DEFAULT_HANDLE_RESOLVER_URL, buildIdentityClient } from '#core/identity';
import { buildBskyProviderClient } from '#core/providers/bsky';
import { buildWhitewindProviderClient } from '#core/providers/whitewind';
import { buildRepoClient } from '#core/repo';
import { createTransport } from '#core/transport';
import type { AtfieldCore, AtfieldCoreProvidersClient, CoreServicesConfig } from '#core/core.types';
import type { FetchLike } from '#core/types';

export function createCore(options: {
	fetch?: FetchLike;
	services?: CoreServicesConfig;
} = {}): AtfieldCore {
	const transport = createTransport(options.fetch ?? globalThis.fetch);
	const services = {
		handleResolverUrl: options.services?.handleResolverUrl ?? DEFAULT_HANDLE_RESOLVER_URL,
		appViewUrl: options.services?.appViewUrl ?? 'https://public.api.bsky.app/xrpc'
	};

	return {
		transport,
		services,
		identity: buildIdentityClient(transport, services),
		did: buildDidClient(transport),
		repo: buildRepoClient(transport),
		providers: buildProvidersClient(transport, services)
	};
}

function buildProvidersClient(
	transport: ReturnType<typeof createTransport>,
	services: Required<CoreServicesConfig>
): AtfieldCoreProvidersClient {
	return {
		bsky: buildBskyProviderClient(transport, services),
		whitewind: buildWhitewindProviderClient(transport)
	};
}
