import { addMark, normalizeRichText } from '../rich-text';
import type { ExtractedBlockInput } from '../internal-types';
import type { RichTextFeatureHandler } from '../rich-text';
import type {
	BlockNormalizerRegistry,
	ContentBlockSemanticHandlerRegistry,
	ContentTypeDefinition,
	Image,
	ListItem,
	ListItemBlock,
	Skipped,
	Warning
} from '../types';

const leafletRichTextFeatureHandlers: Record<string, RichTextFeatureHandler> = {
	'pub.leaflet.richtext.facet#bold': (_feature, span) => addMark(span, 'bold'),
	'pub.leaflet.richtext.facet#italic': (_feature, span) => addMark(span, 'italic'),
	'pub.leaflet.richtext.facet#underline': (_feature, span) => addMark(span, 'underline'),
	'pub.leaflet.richtext.facet#strikethrough': (_feature, span) => addMark(span, 'strikethrough'),
	'pub.leaflet.richtext.facet#code': (_feature, span) => addMark(span, 'code'),
	'pub.leaflet.richtext.facet#highlight': (_feature, span) => addMark(span, 'highlight'),
	'pub.leaflet.richtext.facet#link': (feature, span) => {
		span.link = getString(feature.uri);
	},
	'pub.leaflet.richtext.facet#didMention': (feature, span) => {
		span.mention = {
			...span.mention,
			did: getString(feature.did),
			handle: getString(feature.handle)
		};
	},
	'pub.leaflet.richtext.facet#atMention': (feature, span) => {
		span.mention = {
			...span.mention,
			atUri: getString(feature.atURI) ?? getString(feature.atUri)
		};
	}
};

const ignoreLeafletRichTextWarning = () => undefined;

export const leafletContentTypeDefinition: ContentTypeDefinition = {
	vendor: 'leaflet',
	extractBlocks: extractLeafletBlocks
};

export const leafletBlockNormalizers: BlockNormalizerRegistry = {
	'pub.leaflet.blocks.header': (input, context) => ({
		type: 'heading',
		level: getNumber(input.level) ?? 1,
		text: getString(input.plaintext) ?? '',
		richText: normalizeLeafletRichText(input, context.path, context.warn)
	}),
	'pub.leaflet.blocks.text': (input, context) => ({
		type: 'paragraph',
		text: getString(input.plaintext) ?? '',
		richText: normalizeLeafletRichText(input, context.path, context.warn)
	}),
	'pub.leaflet.blocks.blockquote': (input, context) => ({
		type: 'blockquote',
		text: getString(input.plaintext) ?? '',
		richText: normalizeLeafletRichText(input, context.path, context.warn)
	}),
	'pub.leaflet.blocks.unorderedList': (input, context) => ({
		type: 'list',
		style: 'bullet',
		items: normalizeUnorderedListItems(input.children, context.path, context.warn)
	}),
	'pub.leaflet.blocks.orderedList': (input, context) => ({
		type: 'list',
		style: 'ordered',
		items: normalizeOrderedListItems(input.children, context.path, context.warn)
	}),
	'pub.leaflet.blocks.image': (input) => ({
		type: 'image',
		layout: 'single',
		images: [normalizeImage(input.image, input.aspectRatio, input.alt)]
	}),
	'pub.leaflet.blocks.website': (input) => ({
		type: 'embed',
		embedType: 'link',
		url: getString(input.src),
		title: getString(input.title),
		text: getString(input.description)
	}),
	'pub.leaflet.blocks.button': (input) => ({
		type: 'embed',
		embedType: 'button',
		url: getString(input.url),
		text: getString(input.text)
	}),
	'pub.leaflet.blocks.iframe': (input) => ({
		type: 'embed',
		embedType: 'link',
		url: getString(input.url)
	}),
	'pub.leaflet.blocks.bskyPost': (input) => ({
		type: 'embed',
		embedType: 'bluesky-post',
		url: getStringFromRecord(input.postRef, 'uri')
	}),
	'pub.leaflet.blocks.code': (input) => ({
		type: 'code',
		code: getString(input.plaintext) ?? '',
		language: getString(input.language)
	}),
	'pub.leaflet.blocks.math': (input) => ({
		type: 'math',
		tex: getString(input.tex) ?? ''
	}),
	'pub.leaflet.blocks.horizontalRule': () => ({ type: 'divider' })
};

export const leafletSemanticHandlers: ContentBlockSemanticHandlerRegistry = {
	'pub.leaflet.blocks.header': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.header'](input, context);
		if (normalized.type !== 'heading') {
			return undefined;
		}

		return {
			type: 'heading',
			value: { level: normalized.level, text: normalized.text, richText: normalized.richText }
		};
	},
	'pub.leaflet.blocks.text': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.text'](input, context);
		if (normalized.type !== 'paragraph') {
			return undefined;
		}

		return {
			type: 'paragraph',
			value: { text: normalized.text, richText: normalized.richText }
		};
	},
	'pub.leaflet.blocks.blockquote': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.blockquote'](input, context);
		if (normalized.type !== 'blockquote') {
			return undefined;
		}

		return {
			type: 'blockquote',
			value: { text: normalized.text, richText: normalized.richText }
		};
	},
	'pub.leaflet.blocks.unorderedList': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.unorderedList'](input, context);
		if (normalized.type !== 'list') {
			return undefined;
		}

		return {
			type: 'list',
			value: {
				style: normalized.style,
				start: getNumber(getRecord(input.attrs)?.start) ?? getNumber(input.startIndex),
				items: normalized.items
			}
		};
	},
	'pub.leaflet.blocks.orderedList': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.orderedList'](input, context);
		if (normalized.type !== 'list') {
			return undefined;
		}

		return {
			type: 'list',
			value: {
				style: normalized.style,
				start: getNumber(getRecord(input.attrs)?.start) ?? getNumber(input.startIndex),
				items: normalized.items
			}
		};
	},
	'pub.leaflet.blocks.code': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.code'](input, context);
		if (normalized.type !== 'code') {
			return undefined;
		}

		return {
			type: 'code',
			value: { code: normalized.code, language: normalized.language }
		};
	},
	'pub.leaflet.blocks.math': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.math'](input, context);
		if (normalized.type !== 'math') {
			return undefined;
		}

		return {
			type: 'math',
			value: { tex: normalized.tex }
		};
	},
	'pub.leaflet.blocks.horizontalRule': () => ({ type: 'divider', value: {} }),
	'pub.leaflet.blocks.image': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.image'](input, context);
		if (normalized.type !== 'image' || normalized.layout !== 'single') {
			return undefined;
		}

		return {
			type: 'image',
			value: { image: normalized.images[0] ?? {} }
		};
	},
	'pub.leaflet.blocks.website': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.website'](input, context);
		if (normalized.type !== 'embed' || normalized.embedType !== 'link') {
			return undefined;
		}

		return {
			type: 'rich-link-like',
			value: {
				url: normalized.url,
				title: normalized.title,
				description: getString(input.description),
				siteName: getString(input.siteName),
				previewImage: normalizePreviewImage(input)
			}
		};
	},
	'pub.leaflet.blocks.button': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.button'](input, context);
		if (normalized.type !== 'embed' || normalized.embedType !== 'button') {
			return undefined;
		}

		return {
			type: 'button-like',
			value: {
				url: normalized.url,
				text: normalized.text,
				align: getAlign(input.alignment) ?? getAlign(input.align)
			}
		};
	},
	'pub.leaflet.blocks.iframe': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.iframe'](input, context);
		if (normalized.type !== 'embed' || normalized.embedType !== 'link') {
			return undefined;
		}

		return {
			type: 'iframe-like',
			value: {
				url: normalized.url,
				title: normalized.title,
				description: getString(input.description),
				aspectRatio: getString(input.aspectRatio)
			}
		};
	},
	'pub.leaflet.blocks.bskyPost': (input, context) => {
		const normalized = leafletBlockNormalizers['pub.leaflet.blocks.bskyPost'](input, context);
		if (normalized.type !== 'embed' || normalized.embedType !== 'bluesky-post') {
			return undefined;
		}

		const postRef = getRecord(input.postRef);
		return {
			type: 'bluesky-post-like',
			value: {
				uri: getString(postRef?.uri),
				cid: getString(postRef?.cid),
				clientHost: getString(input.clientHost)
			}
		};
	}
};

function normalizeUnorderedListItems(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem[] {
	if (!Array.isArray(input)) {
		warn({
			code: 'invalid_block',
			message: 'Expected unordered list children array',
			path: `${path}.children`
		});
		return [];
	}

	return input.map((entry, index) =>
		normalizeListItem(entry, `${path}.children[${index}]`, 'unordered', warn)
	);
}

function normalizeOrderedListItems(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem[] {
	if (!Array.isArray(input)) {
		warn({
			code: 'invalid_block',
			message: 'Expected ordered list children array',
			path: `${path}.children`
		});
		return [];
	}

	return input.map((entry, index) =>
		normalizeListItem(entry, `${path}.children[${index}]`, 'ordered', warn)
	);
}

function normalizeListItem(
	input: unknown,
	path: string,
	style: 'ordered' | 'unordered',
	warn: (warning: Warning) => void
): ListItem {
	const item = getRecord(input);
	if (!item) {
		warn({ code: 'invalid_block', message: 'Expected list item object', path });
		return { text: '' };
	}

	const childPath = style === 'ordered' ? 'children' : 'children';
	const alternatePath = style === 'ordered' ? 'unorderedListChildren' : 'orderedListChildren';
	const nestedChildren = Array.isArray(item[childPath])
		? normalizeNestedListItems(item[childPath], `${path}.${childPath}`, style, warn)
		: normalizeAlternateNestedList(item[alternatePath], `${path}.${alternatePath}`, style, warn);

	return {
		text: normalizeListItemContentText(item.content),
		blocks: normalizeListItemContentBlocks(item.content),
		checked: typeof item.checked === 'boolean' ? item.checked : undefined,
		children: nestedChildren.length ? nestedChildren : undefined
	};
}

function normalizeNestedListItems(
	input: unknown,
	path: string,
	style: 'ordered' | 'unordered',
	warn: (warning: Warning) => void
): ListItem[] {
	if (!Array.isArray(input)) {
		warn({ code: 'invalid_block', message: 'Expected nested list items array', path });
		return [];
	}

	return input.map((entry, index) => normalizeListItem(entry, `${path}[${index}]`, style, warn));
}

function normalizeAlternateNestedList(
	input: unknown,
	path: string,
	parentStyle: 'ordered' | 'unordered',
	warn: (warning: Warning) => void
): ListItem[] {
	const block = getRecord(input);
	if (!block) {
		return [];
	}

	if (parentStyle === 'ordered') {
		return normalizeUnorderedListItems(block.children, path, warn);
	}

	return normalizeOrderedListItems(block.children, path, warn);
}

function normalizeListItemContentText(input: unknown) {
	const blocks = normalizeListItemContentBlocks(input);
	if (!blocks?.length) {
		return '';
	}

	return blocks
		.map((block) => getBlockText(block))
		.filter(Boolean)
		.join('\n');
}

function normalizeListItemContentBlocks(input: unknown): ListItemBlock[] | undefined {
	const content = getRecord(input);
	const contentType = getString(content?.$type);

	if (contentType === 'pub.leaflet.blocks.text') {
		return [
			{
				type: 'paragraph',
				text: getString(content?.plaintext) ?? '',
				richText: normalizeLeafletRichText(content, 'content', ignoreLeafletRichTextWarning),
				rawType: contentType
			}
		];
	}

	if (contentType === 'pub.leaflet.blocks.header') {
		return [
			{
				type: 'heading',
				level: getNumber(content?.level) ?? 1,
				text: getString(content?.plaintext) ?? '',
				richText: normalizeLeafletRichText(content, 'content', ignoreLeafletRichTextWarning),
				rawType: contentType
			}
		];
	}

	if (contentType === 'pub.leaflet.blocks.blockquote') {
		return [
			{
				type: 'blockquote',
				text: getString(content?.plaintext) ?? '',
				richText: normalizeLeafletRichText(content, 'content', ignoreLeafletRichTextWarning),
				rawType: contentType
			}
		];
	}

	if (contentType === 'pub.leaflet.blocks.image') {
		return [
			{
				type: 'image',
				layout: 'single',
				images: [normalizeImage(content?.image, content?.aspectRatio, content?.alt)],
				rawType: contentType
			}
		];
	}

	return undefined;
}

function getBlockText(block: ListItemBlock) {
	if (
		block.type === 'heading' ||
		block.type === 'paragraph' ||
		block.type === 'blockquote' ||
		block.type === 'callout'
	) {
		return block.text;
	}

	return '';
}

function normalizeImage(input: unknown, aspectRatio: unknown, alt: unknown): Image {
	const image = getRecord(input);
	const ratio = getRecord(aspectRatio);

	return {
		cid: getStringFromRecord(image?.ref, '$link'),
		src: getString(image?.url),
		mimeType: getString(image?.mimeType),
		width: getNumber(ratio?.width),
		height: getNumber(ratio?.height),
		alt: getString(alt)
	};
}

function normalizeLeafletRichText(input: unknown, path: string, warn: (warning: Warning) => void) {
	return normalizeRichText(input, {
		path,
		warn,
		featureHandlers: leafletRichTextFeatureHandlers
	});
}

function extractLeafletBlocks(
	content: Record<string, unknown>,
	warn: (warning: Warning) => void
): { blocks: ExtractedBlockInput[]; skipped?: Skipped[] } {
	if (!Array.isArray(content.pages)) {
		warn({
			code: 'invalid_items',
			message: 'Expected Leaflet content pages array',
			path: 'content.pages'
		});
		return { blocks: [] };
	}

	const extracted: ExtractedBlockInput[] = [];
	const skipped: Skipped[] = [];

	for (const [pageIndex, pageEntry] of content.pages.entries()) {
		const page = getRecord(pageEntry);
		const pageType = getString(page?.$type);
		const pageBlocks = page?.blocks;

		if (pageType !== 'pub.leaflet.pages.linearDocument') {
			skipped.push({
				kind: 'container',
				vendor: 'leaflet',
				reason: 'unsupported_page_type',
				rawType: pageType,
				path: `content.pages[${pageIndex}]`,
				raw: pageEntry
			});
			continue;
		}

		if (!Array.isArray(pageBlocks)) {
			warn({
				code: 'invalid_items',
				message: 'Expected Leaflet linear document blocks array',
				path: `content.pages[${pageIndex}].blocks`
			});
			continue;
		}

		for (const [blockIndex, blockEntry] of pageBlocks.entries()) {
			const blockWrapper = getRecord(blockEntry);
			extracted.push({
				input: blockWrapper?.block,
				path: `content.pages[${pageIndex}].blocks[${blockIndex}].block`
			});
		}
	}

	return {
		blocks: extracted,
		skipped: skipped.length ? skipped : undefined
	};
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function getNumber(input: unknown) {
	return typeof input === 'number' ? input : undefined;
}

function getAlign(input: unknown): Image['align'] {
	return input === 'left' || input === 'center' || input === 'right' ? input : undefined;
}

function getStringFromRecord(input: unknown, key: string) {
	const record = getRecord(input);
	return record ? getString(record[key]) : undefined;
}

function getRecord(input: unknown): Record<string, unknown> | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: undefined;
}

function normalizePreviewImage(source: Record<string, unknown>) {
	const preview = getRecord(source.preview) ?? getRecord(source.previewImage);
	if (!preview) {
		return undefined;
	}

	return {
		cid: getStringFromRecord(preview.ref, '$link'),
		src: getString(preview.url),
		mimeType: getString(preview.mimeType),
		width: getNumber(preview.width),
		height: getNumber(preview.height),
		alt: getString(preview.alt),
		title: getString(preview.title)
	};
}
