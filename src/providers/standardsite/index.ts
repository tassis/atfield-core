import { buildStandardSiteProviderClient } from './client';
import {
	normalizeContent,
	renderMarkdown,
	type Block as StandardSiteContentBlock,
	type Image as StandardSiteContentImage,
	type ListItem as StandardSiteContentListItem,
	type MarkdownOptions as StandardSiteContentMarkdownOptions,
	type Options as StandardSiteContentOptions,
	type Result as StandardSiteContentResult,
	type Skipped as StandardSiteContentSkipped,
	type Warning as StandardSiteContentWarning
} from './content';
import { getDocument, listDocuments, STANDARDSITE_DOCUMENT_COLLECTION } from './document';
import { normalizeDocument, normalizePublication } from './normalization';
import { getPublication, STANDARDSITE_PUBLICATION_COLLECTION } from './publication';
import {
	getStandardSiteBlobCid,
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord,
	type StandardSiteContributor,
	type StandardSiteDocument,
	type StandardSiteDocumentRecord,
	type StandardSitePublication,
	type StandardSitePublicationRecord
} from './types';

export { buildStandardSiteProviderClient };
export type { AtfieldCoreStandardSiteProviderClient } from './client';

export const content = {
	normalize: normalizeContent,
	renderMarkdown
};

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

export type ContentOptions = StandardSiteContentOptions;
export type ContentMarkdownOptions = StandardSiteContentMarkdownOptions;
export type ContentResult = StandardSiteContentResult;
export type ContentSkipped = StandardSiteContentSkipped;
export type ContentWarning = StandardSiteContentWarning;
export type ContentBlock = StandardSiteContentBlock;
export type ContentImage = StandardSiteContentImage;
export type ContentListItem = StandardSiteContentListItem;
export type StandardSiteDocumentOutput = StandardSiteDocument;
export type StandardSiteDocumentRecordShape = StandardSiteDocumentRecord;
export type StandardSitePublicationOutput = StandardSitePublication;
export type StandardSitePublicationRecordShape = StandardSitePublicationRecord;

export type Contributor = StandardSiteContributor;
