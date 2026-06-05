import { createContentNormalizer, normalizeContent } from './normalization';
import { createMarkdownRenderer, markdown, renderMarkdown } from './markdown';
import { leafletBundle, offprintBundle, pcktBundle } from './registry';

export {
	createContentNormalizer,
	createMarkdownRenderer,
	markdown,
	normalizeContent,
	renderMarkdown,
	leafletBundle,
	offprintBundle,
	pcktBundle
};

export type {
	MarkdownBlockKind,
	MarkdownBlockRenderer,
	MarkdownRenderOptions,
	MarkdownRenderContext,
	MarkdownRenderer,
	MarkdownRendererRegistry
} from './markdown';

export type {
	ContentBlock,
	ContentBlockSemanticHandler,
	ContentBlockSemanticHandlerRegistry,
	ContentResult,
	SemanticType,
	BlockNormalizeContext,
	ContentBundle,
	ContentNormalizerConfig,
	ContentNormalizer,
	ContentTypeDefinition,
	ContentTypeRegistry,
	ImageSemanticValue,
	Image,
	ListItem,
	ListItemBlock,
	Options,
	RichText,
	RichTextMark,
	RichTextSpan,
	Skipped,
	Warning
} from './types';

export const content = {
	normalize: normalizeContent,
	createNormalizer: createContentNormalizer,
	offprintBundle,
	pcktBundle,
	leafletBundle
};
