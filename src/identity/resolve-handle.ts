import { defineSchema } from '#core/schema';
import { createJsonEndpoint, type CoreTransport } from '#core/transport';

export const DEFAULT_HANDLE_RESOLVER_URL = 'https://bsky.social/xrpc';

type ResolveHandleResponse = {
	did: string;
};

const resolveHandleSchema = defineSchema<ResolveHandleResponse>({
	parse(input) {
		if (
			typeof input !== 'object' ||
			input === null ||
			typeof (input as { did?: unknown }).did !== 'string'
		) {
			throw new Error('Expected resolveHandle response with did');
		}

		return input as ResolveHandleResponse;
	}
});

const resolveHandleEndpoint = createJsonEndpoint({
	buildRequest(params: { handle: string; baseUrl?: string }) {
		const url = new URL('com.atproto.identity.resolveHandle', `${params.baseUrl ?? DEFAULT_HANDLE_RESOLVER_URL}/`);
		url.searchParams.set('handle', params.handle);

		return { url };
	},
	schema: resolveHandleSchema,
	fallbackMessage: 'Failed to resolve handle'
});

export async function resolveHandle(
	transport: CoreTransport,
	params: { handle: string; baseUrl?: string }
) {
	const response = await resolveHandleEndpoint(transport, params);
	return response.did;
}
