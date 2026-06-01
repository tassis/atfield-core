import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getDocument, listDocuments, STANDARDSITE_DOCUMENT_COLLECTION } from './document';
import { getPublication, STANDARDSITE_PUBLICATION_COLLECTION } from './publication';
import {
	api as contentApi,
	type MarkdownOptions as ContentMarkdownOptions,
	type Options as ContentOptions,
	type Result as ContentResult
} from './content';
import { normalizeDocument, normalizePublication } from './normalization';
import {
	getStandardSiteBlobCid,
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord
} from './types';

// After transport and identity are bound, the client only forwards getPublication params.
type StandardSiteGetPublicationParams = Parameters<typeof getPublication>[2];

// After transport and identity are bound, the client only forwards getDocument params.
type StandardSiteGetDocumentParams = Parameters<typeof getDocument>[2];

// After transport and identity are bound, the client only forwards listDocuments params.
type StandardSiteListDocumentsOptions = Parameters<typeof listDocuments>[2];

export type AtfieldCoreStandardSiteProviderClient = {
	blob: {
		getCid: typeof getStandardSiteBlobCid;
	};
	content: {
		normalize: (content: unknown, options?: ContentOptions) => ContentResult;
		renderMarkdown: (
			content: ContentResult | ContentResult['blocks'],
			options?: ContentMarkdownOptions
		) => string;
	};
	document: {
		get: (
			identity: ResolvedIdentity,
			params: StandardSiteGetDocumentParams
		) => ReturnType<typeof getDocument>;
		list: (
			identity: ResolvedIdentity,
			options: StandardSiteListDocumentsOptions
		) => ReturnType<typeof listDocuments>;
		normalize: typeof normalizeDocument;
		parse: typeof parseStandardSiteDocumentRecord;
		COLLECTION: typeof STANDARDSITE_DOCUMENT_COLLECTION;
	};
	publication: {
		get: (
			identity: ResolvedIdentity,
			params?: StandardSiteGetPublicationParams
		) => ReturnType<typeof getPublication>;
		normalize: typeof normalizePublication;
		parse: typeof parseStandardSitePublicationRecord;
		COLLECTION: typeof STANDARDSITE_PUBLICATION_COLLECTION;
	};
};

export function buildStandardSiteProviderClient(
	transport: CoreTransport
): AtfieldCoreStandardSiteProviderClient {
	return {
		blob: {
			getCid: getStandardSiteBlobCid
		},
		content: contentApi,
		document: {
			get: (identity, params) => getDocument(transport, identity, params),
			list: (identity, options) => listDocuments(transport, identity, options),
			normalize: normalizeDocument,
			parse: parseStandardSiteDocumentRecord,
			COLLECTION: STANDARDSITE_DOCUMENT_COLLECTION
		},
		publication: {
			get: (identity, params) => getPublication(transport, identity, params),
			normalize: normalizePublication,
			parse: parseStandardSitePublicationRecord,
			COLLECTION: STANDARDSITE_PUBLICATION_COLLECTION
		}
	};
}
