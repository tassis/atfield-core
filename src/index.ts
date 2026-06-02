export { createCore } from '#core/core';
export type {
	AtfieldCore,
	AtfieldCoreDidClient,
	AtfieldCoreIdentityClient,
	AtfieldCoreRepoClient,
	CoreServicesConfig
} from '#core/core.types';
export {
	getDidDocument,
	getDidDocumentUrl,
	getHandleFromDidDocument,
	getPdsUrlFromDidDocument
} from '#core/did';
export { CoreError, HttpResponseError, SchemaParseError } from '#core/errors';
export { DEFAULT_HANDLE_RESOLVER_URL, resolveHandle, resolveIdentity } from '#core/identity';
export { buildBlobUrl, getRecord, listRecords } from '#core/repo';
export { defineSchema, unknownSchema, type Schema } from '#core/schema';
export {
	createJsonEndpoint,
	createTextEndpoint,
	createTransport,
	type CoreTransport
} from '#core/transport';
export type { ResolveIdentityOptions, ResolvedIdentityInput } from '#core/identity';
export type { RepoListRecordsResponse, RepoRecord } from '#core/repo';
export type { DidDocument, FetchLike, IdentityInput, ResolvedIdentity } from '#core/types';
