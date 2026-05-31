import { defineSchema } from '#core/schema';
import { createJsonEndpoint, type CoreTransport } from '#core/transport';
import type { DidDocument } from '#core/types';

const didDocumentSchema = defineSchema<DidDocument>({
	parse(input) {
		if (!isDidDocument(input)) {
			throw new Error('Expected DID document');
		}

		return input;
	}
});

const getDidDocumentEndpoint = createJsonEndpoint({
	buildRequest(params: { did: string }) {
		return {
			url: getDidDocumentUrl(params.did)
		};
	},
	schema: didDocumentSchema,
	fallbackMessage: 'Failed to resolve DID document'
});

export async function getDidDocument(transport: CoreTransport, params: { did: string }) {
	return getDidDocumentEndpoint(transport, params);
}

export function getDidDocumentUrl(did: string) {
	if (did.startsWith('did:plc:')) {
		return `https://plc.directory/${did}`;
	}

	if (did.startsWith('did:web:')) {
		const hostname = did.slice('did:web:'.length);
		return `https://${hostname}/.well-known/did.json`;
	}

	throw new Error(`Unsupported DID method: ${did}`);
}

function isDidDocument(input: unknown): input is DidDocument {
	if (typeof input !== 'object' || input === null) {
		return false;
	}

	return typeof (input as { id?: unknown }).id === 'string';
}
