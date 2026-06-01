import { normalizeContent } from './normalization';
import { renderMarkdown } from './markdown';

export { normalizeContent, renderMarkdown };
export type { MarkdownOptions } from './markdown';
export type {
	Block,
	ExtractedBlock,
	Image,
	ItemNormalizeContext,
	ItemNormalizer,
	ItemNormalizers,
	ListItem,
	ListItemBlock,
	Options,
	RichText,
	RichTextMark,
	RichTextSpan,
	Result,
	Skipped,
	Vendor,
	Warning
} from './types';

export const api = {
	normalize: normalizeContent,
	renderMarkdown
};
