import type { AtfieldCoreDidClient } from '#core/did';
import type { AtfieldCoreIdentityClient } from '#core/identity';
import type { AtfieldCoreBskyProviderClient } from '#core/providers/bsky';
import type { AtfieldCoreWhitewindProviderClient } from '#core/providers/whitewind';
import type { AtfieldCoreRepoClient } from '#core/repo';
import type { CoreTransport } from '#core/transport';

export type CoreServicesConfig = {
	handleResolverUrl?: string;
	appViewUrl?: string;
};

export type { AtfieldCoreDidClient } from '#core/did';
export type { AtfieldCoreIdentityClient } from '#core/identity';
export type { AtfieldCoreBskyProviderClient } from '#core/providers/bsky';
export type { AtfieldCoreWhitewindProviderClient } from '#core/providers/whitewind';
export type { AtfieldCoreRepoClient } from '#core/repo';

export type AtfieldCoreProvidersClient = {
	bsky: AtfieldCoreBskyProviderClient;
	whitewind: AtfieldCoreWhitewindProviderClient;
};

export type AtfieldCore = {
	transport: CoreTransport;
	services: Required<CoreServicesConfig>;
	identity: AtfieldCoreIdentityClient;
	did: AtfieldCoreDidClient;
	repo: AtfieldCoreRepoClient;
	providers: AtfieldCoreProvidersClient;
};
