import { addMark, normalizeRichText } from '../rich-text';
import type { RichTextFeatureHandler } from '../rich-text';
import type {
	ContentBlockSemanticHandlerRegistry,
	BlockNormalizerRegistry,
	ContentTypeDefinition,
	Image,
	ListItem,
	Warning
} from '../types';

const offprintRichTextFeatureHandlers: Record<string, RichTextFeatureHandler> = {
	'app.offprint.richtext.facet#bold': (_feature, span) => addMark(span, 'bold'),
	'app.offprint.richtext.facet#italic': (_feature, span) => addMark(span, 'italic'),
	'app.offprint.richtext.facet#underline': (_feature, span) => addMark(span, 'underline'),
	'app.offprint.richtext.facet#strikethrough': (_feature, span) => addMark(span, 'strikethrough'),
	'app.offprint.richtext.facet#code': (_feature, span) => addMark(span, 'code'),
	'app.offprint.richtext.facet#highlight': (_feature, span) => addMark(span, 'highlight'),
	'app.offprint.richtext.facet#link': (feature, span) => {
		span.link = getString(feature.uri);
	},
	'app.offprint.richtext.facet#mention': (feature, span) => {
		span.mention = {
			did: getString(feature.did),
			handle: getString(feature.handle)
		};
	},
	'app.offprint.richtext.facet#webMention': (feature, span) => {
		span.link = getString(feature.uri);
	}
};

export const offprintContentTypeDefinition: ContentTypeDefinition = {
	vendor: 'offprint',
	extractBlocks: extractItemsBlocks
};

export const offprintBlockNormalizers = buildOffprintBlockNormalizers();

export const offprintSemanticHandlers: ContentBlockSemanticHandlerRegistry = {
	'app.offprint.block.heading': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.heading'](input, context);
		if (normalized.type !== 'heading') {
			return undefined;
		}

		return {
			type: 'heading',
			value: { level: normalized.level, text: normalized.text, richText: normalized.richText }
		};
	},
	'app.offprint.block.text': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.text'](input, context);
		if (normalized.type !== 'paragraph') {
			return undefined;
		}

		return {
			type: 'paragraph',
			value: { text: normalized.text, richText: normalized.richText }
		};
	},
	'app.offprint.block.blockquote': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.blockquote'](input, context);
		if (normalized.type !== 'blockquote') {
			return undefined;
		}

		return {
			type: 'blockquote',
			value: { text: normalized.text, richText: normalized.richText }
		};
	},
	'app.offprint.block.bulletList': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.bulletList'](input, context);
		if (normalized.type !== 'list') {
			return undefined;
		}

		return {
			type: 'list',
			value: { style: normalized.style, items: normalized.items }
		};
	},
	'app.offprint.block.orderedList': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.orderedList'](input, context);
		if (normalized.type !== 'list') {
			return undefined;
		}

		return {
			type: 'list',
			value: { style: normalized.style, items: normalized.items }
		};
	},
	'app.offprint.block.taskList': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.taskList'](input, context);
		if (normalized.type !== 'list') {
			return undefined;
		}

		return {
			type: 'list',
			value: { style: normalized.style, items: normalized.items }
		};
	},
	'app.offprint.block.codeBlock': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.codeBlock'](input, context);
		if (normalized.type !== 'code') {
			return undefined;
		}

		return {
			type: 'code',
			value: { code: normalized.code, language: normalized.language }
		};
	},
	'app.offprint.block.mathBlock': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.mathBlock'](input, context);
		if (normalized.type !== 'math') {
			return undefined;
		}

		return {
			type: 'math',
			value: { tex: normalized.tex }
		};
	},
	'app.offprint.block.horizontalRule': () => ({ type: 'divider', value: {} }),
	'app.offprint.block.image': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.image'](input, context);
		if (normalized.type !== 'image' || normalized.layout !== 'single') {
			return undefined;
		}

		return {
			type: 'image',
			value: { image: normalized.images[0] ?? {} }
		};
	},
	'app.offprint.block.imageGrid': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.imageGrid'](input, context);
		if (normalized.type !== 'image' || normalized.layout !== 'grid') {
			return undefined;
		}

		return {
			type: 'gallery-like',
			value: { items: normalized.images, layout: 'grid' }
		};
	},
	'app.offprint.block.imageCarousel': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.imageCarousel'](input, context);
		if (normalized.type !== 'image' || normalized.layout !== 'carousel') {
			return undefined;
		}

		return {
			type: 'gallery-like',
			value: { items: normalized.images, layout: 'carousel' }
		};
	},
	'app.offprint.block.button': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.button'](input, context);
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
	'app.offprint.block.blueskyPost': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.blueskyPost'](input, context);
		if (normalized.type !== 'embed' || normalized.embedType !== 'bluesky-post') {
			return undefined;
		}

		return {
			type: 'bluesky-post-like',
			value: {
				uri: getStringFromRecord(input.post, 'uri'),
				cid: getStringFromRecord(input.post, 'cid'),
				clientHost: getString(input.clientHost)
			}
		};
	},
	'app.offprint.block.webBookmark': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.webBookmark'](input, context);
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
	'app.offprint.block.webEmbed': (input, context) => {
		const normalized = offprintBlockNormalizers['app.offprint.block.webEmbed'](input, context);
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
	}
};

type BuildOffprintBlockNormalizersOptions = {
	normalizeImage?: (input: unknown, aspectRatio?: unknown) => Image;
	normalizeImages?: (input: unknown) => Image[];
	normalizeListItems?: (
		input: unknown,
		path: string,
		warn: (warning: Warning) => void
	) => ListItem[];
};

function buildOffprintBlockNormalizers(
	options: BuildOffprintBlockNormalizersOptions = {}
): BlockNormalizerRegistry {
	const normalizeImage = options.normalizeImage ?? defaultNormalizeImage;
	const normalizeImages =
		options.normalizeImages ?? ((input) => defaultNormalizeImages(input, normalizeImage));
	const normalizeListItems = options.normalizeListItems ?? defaultNormalizeListItems;

	return {
		'app.offprint.block.heading': (input, context) => {
			const richText = normalizeOffprintRichText(input, context.path, context.warn);
			return {
				type: 'heading',
				level: getNumber(input.level) ?? 1,
				text: getString(input.plaintext) ?? '',
				richText
			};
		},
		'app.offprint.block.text': (input, context) => {
			const richText = normalizeOffprintRichText(input, context.path, context.warn);
			return {
				type: 'paragraph',
				text: getString(input.plaintext) ?? '',
				richText
			};
		},
		'app.offprint.block.blockquote': (input) => ({
			type: 'blockquote',
			text: joinPlaintextBlocks(input.content)
		}),
		'app.offprint.block.callout': (input, context) => {
			const richText = normalizeOffprintRichText(input, context.path, context.warn);
			return {
				type: 'callout',
				text: getString(input.plaintext) ?? '',
				richText,
				emoji: getString(input.emoji)
			};
		},
		'app.offprint.block.bulletList': (input, context) => ({
			type: 'list',
			style: 'bullet',
			items: normalizeListItems(input.children, context.path, context.warn)
		}),
		'app.offprint.block.orderedList': (input, context) => ({
			type: 'list',
			style: 'ordered',
			items: normalizeListItems(input.children, context.path, context.warn)
		}),
		'app.offprint.block.taskList': (input, context) => ({
			type: 'list',
			style: 'task',
			items: normalizeListItems(input.children, context.path, context.warn)
		}),
		'app.offprint.block.image': (input) => ({
			type: 'image',
			layout: 'single',
			images: [normalizeImage(getRecordProperty(input, 'image', 'blob'), input.aspectRatio)]
		}),
		'app.offprint.block.imageGrid': (input) => ({
			type: 'image',
			layout: 'grid',
			images: normalizeImages(input.images)
		}),
		'app.offprint.block.imageCarousel': (input) => ({
			type: 'image',
			layout: 'carousel',
			images: normalizeImages(input.images)
		}),
		'app.offprint.block.imageDiff': (input) => ({
			type: 'image',
			layout: 'diff',
			images: normalizeImages(input.images)
		}),
		'app.offprint.block.webBookmark': (input) => ({
			type: 'embed',
			embedType: 'link',
			url: getString(input.href),
			title: getString(input.title)
		}),
		'app.offprint.block.webEmbed': (input) => ({
			type: 'embed',
			embedType: 'link',
			url: getString(input.href),
			title: getString(input.title)
		}),
		'app.offprint.block.button': (input) => ({
			type: 'embed',
			embedType: 'button',
			url: getString(input.href),
			text: getString(input.text)
		}),
		'app.offprint.block.blueskyPost': (input) => ({
			type: 'embed',
			embedType: 'bluesky-post',
			url: getStringFromRecord(input.post, 'uri')
		}),
		'app.offprint.block.codeBlock': (input) => ({
			type: 'code',
			code: getString(input.code) ?? '',
			language: getString(input.language)
		}),
		'app.offprint.block.mathBlock': (input) => ({
			type: 'math',
			tex: getString(input.tex) ?? ''
		}),
		'app.offprint.block.horizontalRule': () => ({ type: 'divider' })
	};
}

function defaultNormalizeListItems(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem[] {
	if (!Array.isArray(input)) {
		warn({
			code: 'invalid_block',
			message: 'Expected list children array',
			path: `${path}.children`
		});
		return [];
	}

	return input.map((entry, index) => normalizeListItem(entry, `${path}.children[${index}]`, warn));
}

function normalizeListItem(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem {
	if (!isRecord(input)) {
		warn({ code: 'invalid_block', message: 'Expected list item object', path });
		return { text: '' };
	}

	const text = normalizeListItemText(input.content);
	const richText = normalizeOffprintRichText(input.content, `${path}.content`, warn);
	const children = Array.isArray(input.children)
		? input.children.map((entry, index) =>
				normalizeListItem(entry, `${path}.children[${index}]`, warn)
			)
		: undefined;
	const checked = typeof input.checked === 'boolean' ? input.checked : undefined;

	return {
		text,
		blocks: text
			? [
					{
						type: 'paragraph',
						text,
						richText,
						rawType: getStringFromRecord(input.content, '$type')
					}
				]
			: undefined,
		richText,
		checked,
		children: children?.length ? children : undefined
	};
}

function normalizeOffprintRichText(input: unknown, path: string, warn: (warning: Warning) => void) {
	return normalizeRichText(input, {
		path,
		warn,
		featureHandlers: offprintRichTextFeatureHandlers
	});
}

function normalizeListItemText(input: unknown) {
	if (!isRecord(input)) {
		return '';
	}

	return getString(input.plaintext) ?? '';
}

function joinPlaintextBlocks(input: unknown) {
	if (!Array.isArray(input)) {
		return '';
	}

	return input
		.map((entry) => (isRecord(entry) ? (getString(entry.plaintext) ?? '') : ''))
		.filter(Boolean)
		.join('\n');
}

function defaultNormalizeImages(
	input: unknown,
	normalizeImage: (input: unknown, aspectRatio?: unknown) => Image
): Image[] {
	if (!Array.isArray(input)) {
		return [];
	}

	return input.map((entry) => {
		if (!isRecord(entry)) {
			return {};
		}

		return normalizeImage(getRecordProperty(entry, 'image', 'blob'), entry.aspectRatio);
	});
}

function defaultNormalizeImage(input: unknown, aspectRatio?: unknown): Image {
	const image = isRecord(input) ? input : undefined;
	const ratio = isRecord(aspectRatio) ? aspectRatio : undefined;

	return {
		cid: getStringFromRecord(image?.ref, '$link'),
		src: getString(image?.url),
		mimeType: getString(image?.mimeType),
		width: getNumber(ratio?.width),
		height: getNumber(ratio?.height)
	};
}

function extractItemsBlocks(
	content: Record<string, unknown>,
	warn: (warning: Warning) => void
): { blocks: Array<{ input: unknown; path: string }> } {
	if (!Array.isArray(content.items)) {
		warn({
			code: 'invalid_items',
			message: 'Expected standard.site content items array',
			path: 'content.items'
		});
		return { blocks: [] };
	}

	return {
		blocks: content.items.map((input, index) => ({ input, path: `content.items[${index}]` }))
	};
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function getAlign(input: unknown): Image['align'] {
	return input === 'left' || input === 'center' || input === 'right' ? input : undefined;
}

function getNumber(input: unknown) {
	return typeof input === 'number' ? input : undefined;
}

function getStringFromRecord(input: unknown, key: string) {
	if (!isRecord(input)) {
		return undefined;
	}

	return getString(input[key]);
}

function getRecordProperty(input: Record<string, unknown>, ...keys: string[]) {
	for (const key of keys) {
		const value = input[key];
		if (isRecord(value)) {
			return value;
		}
	}

	return undefined;
}

function isRecord(input: unknown): input is Record<string, unknown> {
	return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function normalizePreviewImage(source: Record<string, unknown>) {
	const preview = getRecordProperty(source, 'preview', 'previewImage');
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
