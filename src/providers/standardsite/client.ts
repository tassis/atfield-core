import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getDocument, STANDARDSITE_DOCUMENT_COLLECTION } from '#core/providers/standardsite/get-document';
import {
	getPublication,
	STANDARDSITE_PUBLICATION_COLLECTION
} from '#core/providers/standardsite/get-publication';
import { listDocuments } from '#core/providers/standardsite/list-documents';
import { normalizeDocument, normalizePublication } from '#core/providers/standardsite/normalize';
import {
	getStandardSiteBlobCid,
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord
} from '#core/providers/standardsite/types';

export type AtfieldCoreStandardSiteProviderClient = {
	getPublication: (
		identity: ResolvedIdentity,
		params?: Parameters<typeof getPublication>[2]
	) => ReturnType<typeof getPublication>;
	getDocument: (
		identity: ResolvedIdentity,
		params: Parameters<typeof getDocument>[2]
	) => ReturnType<typeof getDocument>;
	listDocuments: (
		identity: ResolvedIdentity,
		options: Parameters<typeof listDocuments>[2]
	) => ReturnType<typeof listDocuments>;
	normalizePublication: typeof normalizePublication;
	normalizeDocument: typeof normalizeDocument;
	parsePublicationRecord: typeof parseStandardSitePublicationRecord;
	parseDocumentRecord: typeof parseStandardSiteDocumentRecord;
	getBlobCid: typeof getStandardSiteBlobCid;
	STANDARDSITE_PUBLICATION_COLLECTION: typeof STANDARDSITE_PUBLICATION_COLLECTION;
	STANDARDSITE_DOCUMENT_COLLECTION: typeof STANDARDSITE_DOCUMENT_COLLECTION;
};

export function buildStandardSiteProviderClient(
	transport: CoreTransport
): AtfieldCoreStandardSiteProviderClient {
	return {
		getPublication: (identity, params) => getPublication(transport, identity, params),
		getDocument: (identity, params) => getDocument(transport, identity, params),
		listDocuments: (identity, options) => listDocuments(transport, identity, options),
		normalizePublication,
		normalizeDocument,
		parsePublicationRecord: parseStandardSitePublicationRecord,
		parseDocumentRecord: parseStandardSiteDocumentRecord,
		getBlobCid: getStandardSiteBlobCid,
		STANDARDSITE_PUBLICATION_COLLECTION,
		STANDARDSITE_DOCUMENT_COLLECTION
	};
}
