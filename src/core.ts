import { createTransport, type CoreTransport } from './transport';
import { DEFAULT_HANDLE_RESOLVER_URL } from './identity';
import type { FetchLike } from './types';

export type CoreServicesConfig = {
	handleResolverUrl?: string;
	appViewUrl?: string;
};

export type AtfieldCore = {
	transport: CoreTransport;
	services: Required<CoreServicesConfig>;
};

export function createCore(options: {
	fetch?: FetchLike;
	services?: CoreServicesConfig;
} = {}): AtfieldCore {
	const transport = createTransport(options.fetch ?? globalThis.fetch);

	return {
		transport,
		services: {
			handleResolverUrl: options.services?.handleResolverUrl ?? DEFAULT_HANDLE_RESOLVER_URL,
			appViewUrl: options.services?.appViewUrl ?? 'https://public.api.bsky.app/xrpc'
		}
	};
}
