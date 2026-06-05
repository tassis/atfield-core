import { buildClient } from './client';
import { content, markdown } from './content';
import { getDocument, listDocuments, STANDARDSITE_DOCUMENT_COLLECTION } from './document';
import { normalizeDocument, normalizePublication } from './normalization';
import { getPublication, STANDARDSITE_PUBLICATION_COLLECTION } from './publication';
import {
	getStandardSiteBlobCid,
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord,
	type StandardSiteContributor
} from './types';

export { buildClient };
export { content };
export { markdown };
export type { AtfieldCoreStandardSiteProviderClient } from './client';

export const document = {
	get: getDocument,
	list: listDocuments,
	normalize: normalizeDocument,
	parse: parseStandardSiteDocumentRecord,
	COLLECTION: STANDARDSITE_DOCUMENT_COLLECTION
};

export const publication = {
	get: getPublication,
	normalize: normalizePublication,
	parse: parseStandardSitePublicationRecord,
	COLLECTION: STANDARDSITE_PUBLICATION_COLLECTION
};

export const blob = {
	getCid: getStandardSiteBlobCid
};

export type {
	BlockNormalizeContext,
	ContentBlock,
	ContentBlockSemanticHandler,
	ContentBlockSemanticHandlerRegistry,
	ContentBundle,
	ContentNormalizerConfig,
	ContentNormalizer,
	ContentResult,
	MarkdownRenderOptions,
	MarkdownBlockKind,
	MarkdownBlockRenderer,
	MarkdownRenderContext,
	MarkdownRenderer,
	MarkdownRendererRegistry,
	Image as ContentImage,
	ListItem as ContentListItem,
	Options as ContentOptions,
	Skipped as ContentSkipped,
	Warning as ContentWarning
} from './content';

export type {
	StandardSiteDocument,
	StandardSiteDocumentRecord,
	StandardSitePublication,
	StandardSitePublicationRecord
} from './types';
export type { StandardSiteContributor as Contributor };
