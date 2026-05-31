import { getDidDocument, getDidDocumentUrl } from '#core/did/get-did-document';
import { getHandleFromDidDocument, getPdsUrlFromDidDocument } from '#core/did/parse-did-document';
import type { CoreTransport } from '#core/transport';
import type { DidDocument } from '#core/types';

export type AtfieldCoreDidClient = {
	getDocument(params: { did: string }): Promise<DidDocument>;
	getDocumentUrl: typeof getDidDocumentUrl;
	getHandleFromDocument: typeof getHandleFromDidDocument;
	getPdsUrlFromDocument: typeof getPdsUrlFromDidDocument;
};

export function buildDidClient(transport: CoreTransport): AtfieldCoreDidClient {
	return {
		getDocument: (params) => getDidDocument(transport, params),
		getDocumentUrl: getDidDocumentUrl,
		getHandleFromDocument: getHandleFromDidDocument,
		getPdsUrlFromDocument: getPdsUrlFromDidDocument
	};
}
