export { createCore, type AtfieldCore, type CoreServicesConfig } from './core';
export { createJsonEndpoint, createTextEndpoint } from './endpoint';
export {
	createResolvedIdentity,
	DEFAULT_HANDLE_RESOLVER_URL,
	getCanonicalDid,
	getHandleFromDidDocument,
	getPdsUrlFromDidDocument
} from './identity';
export { CoreError, HttpResponseError, SchemaParseError } from './errors';
export { defineSchema, unknownSchema, type Schema } from './schema';
export { createTransport, type CoreTransport } from './transport';
export type {
	DidDocument,
	FetchLike,
	IdentityInput,
	RequestOptions,
	ResolvedIdentity,
	TransportResponse
} from './types';
