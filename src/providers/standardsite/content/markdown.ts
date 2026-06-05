import type {
	ContentBlock,
	ContentResult,
	Image,
	ListItem,
	ListItemBlock,
	RichText,
	RichTextSpan,
	SemanticType
} from './types';

export type MarkdownRenderOptions = {
	preserveFallbackBlocksAsComments?: boolean;
	preserveDegradedSemanticsAsComments?: boolean;
	preferRichText?: boolean;
	inlineStyle?: 'markdown' | 'html';
	mentionProfileBaseUrl?: string;
	blueskyPostBaseUrl?: string;
};

export type MarkdownBlockKind = SemanticType | 'unsupported' | 'unknown';

type SemanticMarkdownBlock<TKind extends SemanticType = SemanticType> = ContentBlock & {
	semantic: {
		type: TKind;
		value: unknown;
	};
};

type MarkdownRenderableBlock<TKind extends MarkdownBlockKind = MarkdownBlockKind> =
	TKind extends SemanticType
		? SemanticMarkdownBlock<TKind>
		: TKind extends 'unknown'
			? ContentBlock & { semantic?: undefined }
			: ContentBlock;

export type MarkdownBlockRenderer<TKind extends MarkdownBlockKind = MarkdownBlockKind> = (
	block: MarkdownRenderableBlock<TKind>,
	context: MarkdownRenderContext
) => string;

export type MarkdownRendererRegistry = Partial<{
	[K in MarkdownBlockKind]: MarkdownBlockRenderer<K>;
}>;

export type MarkdownRenderContext = {
	options: MarkdownRenderOptions;
	indent: string;
	renderBlock: (block: ContentBlock, indent?: string) => string;
	renderBlocks: (blocks: ContentBlock[], indent?: string) => string;
	renderList: (items: ListItem[], style: 'bullet' | 'ordered' | 'task', indent?: string) => string;
	renderText: (richText: RichText | undefined, fallbackText: string) => string;
	defaultRender: (block: ContentBlock, indent?: string) => string;
};

type MarkdownSemanticInput = ContentResult | ContentBlock[];

export type MarkdownRenderer = (
	input: MarkdownSemanticInput,
	options?: MarkdownRenderOptions
) => string;

const DEFAULT_MENTION_PROFILE_BASE_URL = 'https://bsky.app/profile/';

// Keep the built-in markdown behavior as an explicit registry so custom renderers
// can fall back to the default block renderer through the same dispatch model.
const defaultMarkdownRendererRegistry: MarkdownRendererRegistry = {
	heading: (block, context) => {
		const value = asRecord(block.semantic.value);
		const level = getNumber(value?.level) ?? 1;
		const text = getString(value?.text) ?? '';
		const richText = value?.richText as RichText | undefined;
		return `${context.indent}${'#'.repeat(clampHeadingLevel(level))} ${context.renderText(richText, text)}`;
	},
	paragraph: (block, context) => {
		const value = asRecord(block.semantic.value);
		const text = getString(value?.text) ?? '';
		const richText = value?.richText as RichText | undefined;
		return `${context.indent}${context.renderText(richText, text)}`;
	},
	blockquote: (block, context) => {
		const value = asRecord(block.semantic.value);
		const text = getString(value?.text) ?? '';
		const richText = value?.richText as RichText | undefined;
		return prefixLines(context.renderText(richText, text), `${context.indent}> `);
	},
	list: (block, context) => {
		const value = asRecord(block.semantic.value);
		const style = normalizeListStyle(value?.style);
		const items = Array.isArray(value?.items) ? (value.items as ListItem[]) : [];
		const start = getNumber(value?.start);
		return withDegradedComment(
			context.renderList(items, style, context.indent),
			start !== undefined && style === 'ordered' ? `list start: ${start}` : undefined,
			context
		);
	},
	image: (block, context) => {
		const value = asRecord(block.semantic.value);
		const image = normalizeImage(asRecord(value?.image));
		if (!image) {
			return renderUnsupportedComment(block, context);
		}

		return withDegradedComment(
			renderImages([image], context.indent),
			formatImageMetadataComment(image, getString(value?.placeholder)),
			context
		);
	},
	'iframe-like': (block, context) => {
		const value = asRecord(block.semantic.value);
		const url = getString(value?.url);
		const title = getString(value?.title);
		const description = getString(value?.description);
		const aspectRatio = getString(value?.aspectRatio);
		const rendered = `${context.indent}${renderExplicitLink(url, title ?? url)}`;
		return withDegradedComment(
			rendered,
			joinCommentParts('iframe-like', [
				description ? `description: ${description}` : undefined,
				aspectRatio ? `aspectRatio: ${aspectRatio}` : undefined
			]),
			context
		);
	},
	'rich-link-like': (block, context) => {
		const value = asRecord(block.semantic.value);
		const url = getString(value?.url);
		const title = getString(value?.title);
		const description = getString(value?.description);
		const siteName = getString(value?.siteName);
		const previewImage = normalizeImage(asRecord(value?.previewImage));
		const rendered = `${context.indent}${renderLink(url, title ?? url)}`;
		return withDegradedComment(
			rendered,
			joinCommentParts('rich-link-like', [
				siteName ? `siteName: ${siteName}` : undefined,
				description ? `description: ${description}` : undefined,
				formatPreviewImageComment(previewImage)
			]),
			context
		);
	},
	'button-like': (block, context) => {
		const value = asRecord(block.semantic.value);
		const url = getString(value?.url);
		const text = getString(value?.text);
		const align = getAlign(value?.align);
		const rendered = `${context.indent}${renderLink(url, text ?? url)}`;
		return withDegradedComment(
			rendered,
			align ? `button-like align: ${align}` : undefined,
			context
		);
	},
	'bluesky-post-like': (block, context) => {
		const value = asRecord(block.semantic.value);
		const uri = getString(value?.uri);
		const cid = getString(value?.cid);
		const clientHost = getString(value?.clientHost);
		const postUrl = resolveBlueskyPostUrl(uri, context.options, clientHost);
		const rendered = `${context.indent}${renderExplicitLink(postUrl ?? uri, postUrl ?? uri)}`;
		return withDegradedComment(
			rendered,
			joinCommentParts('bluesky-post-like', [
				cid ? `cid: ${cid}` : undefined,
				clientHost ? `clientHost: ${clientHost}` : undefined
			]),
			context
		);
	},
	'gallery-like': (block, context) => {
		const value = asRecord(block.semantic.value);
		const items = Array.isArray(value?.items)
			? value.items.flatMap((item) => {
					const image = normalizeImage(asRecord(item));
					return image ? [image] : [];
				})
			: [];
		const ref = getString(value?.ref);
		const layout = getGalleryLayout(value?.layout);
		const rendered = items.length
			? renderImages(items, context.indent)
			: ref
				? `${context.indent}${renderLink(ref, ref)}`
				: '';

		if (!rendered) {
			return renderUnsupportedComment(block, context);
		}

		return withDegradedComment(
			rendered,
			joinCommentParts('gallery-like', [
				layout ? `layout: ${layout}` : undefined,
				ref && items.length ? `ref: ${ref}` : undefined
			]),
			context
		);
	},
	code: (block, context) => {
		const value = asRecord(block.semantic.value);
		return renderCodeBlock(
			getString(value?.code) ?? '',
			getString(value?.language),
			context.indent
		);
	},
	math: (block, context) => {
		const value = asRecord(block.semantic.value);
		return `${context.indent}$$\n${getString(value?.tex) ?? ''}\n${context.indent}$$`;
	},
	divider: (_block, context) => `${context.indent}---`,
	unsupported: (block, context) => renderUnsupportedComment(block, context),
	unknown: (block, context) => renderUnsupportedComment(block, context)
};

export const renderMarkdown: MarkdownRenderer = createMarkdownRenderer(
	defaultMarkdownRendererRegistry
);

export const markdown = {
	render: renderMarkdown,
	createRenderer: createMarkdownRenderer
};

export function createMarkdownRenderer(registry: MarkdownRendererRegistry = {}): MarkdownRenderer {
	return (input, options = {}) => {
		const engine = createMarkdownRenderEngine(options, {
			...defaultMarkdownRendererRegistry,
			...registry
		});
		const blocks = Array.isArray(input) ? input : input.blocks;
		return engine.renderBlocks(blocks).trim();
	};
}

function normalizeListStyle(input: unknown): 'bullet' | 'ordered' | 'task' {
	return input === 'ordered' || input === 'task' ? input : 'bullet';
}

function getGalleryLayout(input: unknown) {
	return input === 'grid' || input === 'carousel' || input === 'gallery' ? input : undefined;
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function getNumber(input: unknown) {
	return typeof input === 'number' ? input : undefined;
}

function getAlign(input: unknown) {
	return input === 'left' || input === 'center' || input === 'right' ? input : undefined;
}

function asRecord(input: unknown): Record<string, unknown> | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: undefined;
}

function createMarkdownRenderEngine(
	options: MarkdownRenderOptions,
	registry: MarkdownRendererRegistry
) {
	const engine = {
		renderBlocks(blocks: ContentBlock[], indent = '') {
			return blocks
				.map((block) => engine.renderBlock(block, indent))
				.filter(Boolean)
				.join('\n\n');
		},
		renderBlock(block: ContentBlock, indent = '') {
			const kind = getMarkdownBlockKind(block);
			const renderer = registry[kind] as MarkdownBlockRenderer<typeof kind> | undefined;
			return renderer
				? renderer(block as never, createRenderContext(engine, options, indent))
				: engine.defaultRender(block, indent);
		},
		// Custom renderers can call context.defaultRender(...) to delegate back to the
		// built-in block renderer from defaultMarkdownRendererRegistry.
		defaultRender(block: ContentBlock, indent = '') {
			const kind = getMarkdownBlockKind(block);
			const renderer = defaultMarkdownRendererRegistry[kind] as
				| MarkdownBlockRenderer<typeof kind>
				| undefined;
			return renderer ? renderer(block as never, createRenderContext(engine, options, indent)) : '';
		},
		renderNestedBlocks(blocks: ListItemBlock[], indent = '') {
			return blocks
				.map((block) => engine.renderNestedBlock(block, indent))
				.filter(Boolean)
				.join('\n\n');
		},
		renderNestedBlock(block: ListItemBlock, indent = '') {
			return renderNestedListItemBlock(block, indent, options);
		},
		renderList(items: ListItem[], style: 'bullet' | 'ordered' | 'task', indent = '') {
			return items
				.map((item, index) => renderListItem(item, style, options, engine, indent, index))
				.join('\n');
		},
		renderText(richText: RichText | undefined, fallbackText: string) {
			return renderText(richText, fallbackText, options);
		}
	};

	return engine;
}

function createRenderContext(
	engine: ReturnType<typeof createMarkdownRenderEngine>,
	options: MarkdownRenderOptions,
	indent: string
): MarkdownRenderContext {
	return {
		options,
		indent,
		renderBlock: (block, nextIndent = indent) => engine.renderBlock(block, nextIndent),
		renderBlocks: (blocks, nextIndent = indent) => engine.renderBlocks(blocks, nextIndent),
		renderList: (items, style, nextIndent = indent) => engine.renderList(items, style, nextIndent),
		renderText: (richText, fallbackText) => engine.renderText(richText, fallbackText),
		defaultRender: (block, nextIndent = indent) => engine.defaultRender(block, nextIndent)
	};
}

function getMarkdownBlockKind(block: ContentBlock): MarkdownBlockKind {
	return block.semantic?.type ?? 'unknown';
}

function renderListItem(
	item: ListItem,
	style: 'bullet' | 'ordered' | 'task',
	options: MarkdownRenderOptions,
	engine: ReturnType<typeof createMarkdownRenderEngine>,
	indent: string,
	index: number
): string {
	const marker =
		style === 'ordered'
			? `${index + 1}.`
			: style === 'task'
				? `- [${item.checked ? 'x' : ' '}]`
				: '-';
	const { markerText, nestedBlocks } = splitListItemContent(item, options);
	const text = markerText;
	const lines = [`${indent}${marker}${text ? ` ${text}` : ''}`];
	const childIndent = `${indent}    `;

	if (nestedBlocks.length) {
		const renderedBlocks = engine.renderNestedBlocks(nestedBlocks, childIndent);
		if (renderedBlocks) {
			lines.push(renderedBlocks);
		}
	}

	if (item.children?.length) {
		lines.push(engine.renderList(item.children, style, childIndent));
	}

	return lines.join('\n\n');
}

function splitListItemContent(item: ListItem, options: MarkdownRenderOptions) {
	const markerText = renderText(item.richText, item.text, options);
	const blocks = item.blocks ?? [];
	if (!blocks.length) {
		return { markerText, nestedBlocks: [] as ListItemBlock[] };
	}

	const [firstBlock, ...restBlocks] = blocks;
	if (
		firstBlock?.type === 'paragraph' &&
		firstBlock.text === item.text &&
		!firstBlock.richText === !item.richText
	) {
		return {
			markerText,
			nestedBlocks: restBlocks
		};
	}

	return {
		markerText: '',
		nestedBlocks: blocks
	};
}

function renderImages(images: Image[], indent = ''): string {
	return images
		.map(
			(image) =>
				`${indent}![${escapeMarkdownText(image.alt ?? '')}](${image.src ?? image.cid ?? ''})`
		)
		.join('\n\n');
}

function renderLink(url: string | undefined, label: string | undefined) {
	const fallback = label ?? url ?? '';
	if (!url) {
		return fallback;
	}

	if (!fallback || fallback === url) {
		return `<${url}>`;
	}

	return `[${escapeMarkdownText(fallback)}](${url})`;
}

function renderExplicitLink(url: string | undefined, label: string | undefined) {
	const fallback = label ?? url ?? '';
	if (!url) {
		return fallback;
	}

	return `[${escapeMarkdownText(fallback)}](${url})`;
}

function resolveBlueskyPostUrl(
	uri: string | undefined,
	options: MarkdownRenderOptions,
	clientHost: string | undefined
) {
	const parsed = parseAtUri(uri);
	if (!parsed || parsed.collection !== 'app.bsky.feed.post') {
		return undefined;
	}

	const baseUrl =
		normalizeHttpBaseUrl(options.blueskyPostBaseUrl) ??
		deriveBlueskyPostBaseUrl(options.mentionProfileBaseUrl) ??
		deriveBlueskyPostBaseUrl(clientHost) ??
		deriveBlueskyPostBaseUrl(DEFAULT_MENTION_PROFILE_BASE_URL);

	return `${baseUrl}/profile/${parsed.authority}/post/${parsed.rkey}`;
}

function deriveBlueskyPostBaseUrl(input: string | undefined) {
	const normalized = normalizeHttpBaseUrl(input);
	if (!normalized) {
		return undefined;
	}

	return normalized.replace(/\/profile(?:\/.*)?$/, '');
}

function normalizeHttpBaseUrl(input: string | undefined) {
	if (!input) {
		return undefined;
	}

	const withProtocol = /^https?:\/\//.test(input) ? input : `https://${input}`;
	try {
		const url = new URL(withProtocol);
		return url.toString().replace(/\/+$/, '');
	} catch {
		return undefined;
	}
}

function parseAtUri(uri: string | undefined) {
	if (!uri?.startsWith('at://')) {
		return undefined;
	}

	const [authority, collection, rkey] = uri.slice('at://'.length).split('/');
	if (!authority || !collection || !rkey) {
		return undefined;
	}

	return { authority, collection, rkey };
}

function renderUnsupportedComment(block: ContentBlock, context: MarkdownRenderContext) {
	if (context.options.preserveFallbackBlocksAsComments === false) {
		return '';
	}

	return `${context.indent}<!-- unsupported block${block.rawType ? `: ${block.rawType}` : ''} -->`;
}

function withDegradedComment(
	body: string,
	comment: string | undefined,
	context: MarkdownRenderContext
) {
	if (!body || !comment || context.options.preserveDegradedSemanticsAsComments !== true) {
		return body;
	}

	return `${body}\n${context.indent}<!-- ${comment} -->`;
}

function formatImageMetadataComment(image: Image, placeholder: string | undefined) {
	return joinCommentParts('image', [
		image.title ? `title: ${image.title}` : undefined,
		image.align ? `align: ${image.align}` : undefined,
		image.width !== undefined ? `width: ${image.width}` : undefined,
		image.height !== undefined ? `height: ${image.height}` : undefined,
		placeholder ? `placeholder: ${placeholder}` : undefined
	]);
}

function formatPreviewImageComment(image: Image | undefined) {
	const previewRef = image?.src ?? image?.cid;
	return previewRef ? `previewImage: ${previewRef}` : undefined;
}

function joinCommentParts(label: string, parts: Array<string | undefined>) {
	const filtered = parts.filter(Boolean);
	return filtered.length ? `${label} ${filtered.join('; ')}` : undefined;
}

function normalizeImage(input: Record<string, unknown> | undefined): Image | undefined {
	if (!input) {
		return undefined;
	}

	return {
		cid: getString(input.cid),
		src: getString(input.src),
		mimeType: getString(input.mimeType),
		width: getNumber(input.width),
		height: getNumber(input.height),
		alt: getString(input.alt),
		title: getString(input.title),
		align: getAlign(input.align)
	};
}

function renderNestedListItemBlock(
	block: ListItemBlock,
	indent: string,
	options: MarkdownRenderOptions
) {
	switch (block.type) {
		case 'heading':
			return `${indent}${'#'.repeat(clampHeadingLevel(block.level))} ${renderText(block.richText, block.text, options)}`;
		case 'paragraph':
			return `${indent}${renderText(block.richText, block.text, options)}`;
		case 'blockquote':
			return prefixLines(renderText(block.richText, block.text, options), `${indent}> `);
		case 'callout': {
			const text = renderText(block.richText, block.text, options);
			const calloutText = [block.emoji, text].filter(Boolean).join(' ');
			return prefixLines(calloutText, `${indent}> `);
		}
		case 'image':
			return renderImages(block.images, indent);
		case 'embed':
			return `${indent}${renderLink(block.url, block.text ?? block.title ?? block.url)}`;
		case 'code':
			return renderCodeBlock(block.code, block.language, indent);
		case 'math':
			return `${indent}$$\n${block.tex}\n${indent}$$`;
		case 'divider':
			return `${indent}---`;
		case 'table':
			return renderTable(block.rows, indent);
		case 'unsupported':
			return options.preserveFallbackBlocksAsComments === false
				? ''
				: `${indent}<!-- unsupported block: ${block.rawType} -->`;
		case 'unknown':
			return options.preserveFallbackBlocksAsComments === false
				? ''
				: `${indent}<!-- unsupported block${block.rawType ? `: ${block.rawType}` : ''} -->`;
	}
}

function renderTable(
	rows: Array<{ cells: Array<{ text: string; header?: boolean }> }>,
	indent = ''
): string {
	if (!rows.length) {
		return `${indent}| |\n${indent}| --- |`;
	}

	const headerRow = rows[0];
	const headerCells = headerRow?.cells.map((cell) => escapeMarkdownTableText(cell.text)) ?? [];
	const bodyRows = rows.slice(1);
	const hasHeader = headerRow?.cells.some((cell) => cell.header) ?? false;
	const header = hasHeader ? headerCells : headerCells.map((_, index) => `Column ${index + 1}`);
	const firstBodyRow = hasHeader ? bodyRows : rows;

	const tableLines = [
		`${indent}| ${header.join(' | ')} |`,
		`${indent}| ${header.map(() => '---').join(' | ')} |`
	];

	for (const row of firstBodyRow) {
		tableLines.push(
			`${indent}| ${row.cells.map((cell) => escapeMarkdownTableText(cell.text)).join(' | ')} |`
		);
	}

	return tableLines.join('\n');
}

function renderCodeBlock(code: string, language: string | undefined, indent = '') {
	const fence = '```';
	return `${indent}${fence}${language ?? ''}\n${code}\n${indent}${fence}`;
}

function renderText(
	richText: RichText | undefined,
	fallbackText: string,
	options: MarkdownRenderOptions
) {
	if (!richText || options.preferRichText === false || !richText.spans?.length) {
		return escapeMarkdownText(fallbackText);
	}

	return renderRichText(richText, options);
}

function renderRichText(richText: RichText, options: MarkdownRenderOptions) {
	if (options.inlineStyle === 'html') {
		return renderRichTextAsHtml(richText, options);
	}

	const segments = splitRichTextIntoSegments(richText.text, richText.spans ?? []);
	const hasComplexFormatting = hasComplexRichTextFormatting(richText.spans ?? []);
	if (hasComplexFormatting) {
		return escapeMarkdownText(richText.text);
	}

	return segments.map(({ text, spans }) => applySpanFormatting(text, spans, options)).join('');
}

function renderRichTextAsHtml(richText: RichText, options: MarkdownRenderOptions) {
	const segments = splitRichTextIntoSegments(richText.text, richText.spans ?? []);
	return cleanupHtmlInline(
		segments.map(({ text, spans }) => applyHtmlSpanFormatting(text, spans, options)).join('')
	);
}

function splitRichTextIntoSegments(text: string, spans: RichTextSpan[]) {
	const boundaries = new Set<number>([0, getUtf8ByteLength(text)]);
	for (const span of spans) {
		boundaries.add(span.byteStart);
		boundaries.add(span.byteEnd);
	}

	const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
	return sortedBoundaries.slice(0, -1).flatMap((start, index) => {
		const end = sortedBoundaries[index + 1];
		if (end === undefined || end <= start) {
			return [];
		}

		const segmentText = sliceUtf8ByBytes(text, start, end);
		if (!segmentText) {
			return [];
		}

		return [
			{
				text: segmentText,
				spans: spans.filter((span) => span.byteStart <= start && span.byteEnd >= end)
			}
		];
	});
}

function applySpanFormatting(text: string, spans: RichTextSpan[], options: MarkdownRenderOptions) {
	const escapedText = escapeMarkdownText(text);
	if (!spans.length) {
		return escapedText;
	}

	const activeMarks = new Set(spans.flatMap((span) => span.marks ?? []));
	let result = escapedText;

	if (activeMarks.has('code')) {
		result = `\`${result.replace(/`/g, '\\`')}\``;
	}
	if (activeMarks.has('bold')) {
		result = `**${result}**`;
	}
	if (activeMarks.has('italic')) {
		result = `*${result}*`;
	}
	if (activeMarks.has('strikethrough')) {
		result = `~~${result}~~`;
	}
	if (options.inlineStyle === 'html' && activeMarks.has('underline')) {
		result = `<u>${result}</u>`;
	}
	if (options.inlineStyle === 'html' && activeMarks.has('highlight')) {
		result = `<mark>${result}</mark>`;
	}

	const link = getSpanHref(spans, options);
	if (link) {
		result = wrapMarkdownLink(result, link);
	}

	return result;
}

function applyHtmlSpanFormatting(
	text: string,
	spans: RichTextSpan[],
	options: MarkdownRenderOptions
) {
	const escapedText = escapeHtmlText(text);
	if (!spans.length) {
		return escapedText;
	}

	const activeMarks = new Set(spans.flatMap((span) => span.marks ?? []));
	let result = escapedText;

	if (activeMarks.has('code')) {
		result = `<code>${result}</code>`;
	}
	if (activeMarks.has('bold')) {
		result = `<strong>${result}</strong>`;
	}
	if (activeMarks.has('italic')) {
		result = `<em>${result}</em>`;
	}
	if (activeMarks.has('strikethrough')) {
		result = `<s>${result}</s>`;
	}
	if (options.inlineStyle === 'html' && activeMarks.has('underline')) {
		result = `<u>${result}</u>`;
	}
	if (options.inlineStyle === 'html' && activeMarks.has('highlight')) {
		result = `<mark>${result}</mark>`;
	}

	const link = getSpanHref(spans, options);
	if (link) {
		result = wrapHtmlLink(result, link);
	}

	return result;
}

function getSpanHref(spans: RichTextSpan[], options: MarkdownRenderOptions) {
	const explicitLink = spans.find((span) => span.link)?.link;
	if (explicitLink) {
		return explicitLink;
	}

	const mention = spans.find((span) => span.mention)?.mention;
	const mentionProfileBaseUrl = options.mentionProfileBaseUrl ?? DEFAULT_MENTION_PROFILE_BASE_URL;
	if (mention?.handle) {
		return joinProfileBaseUrl(mentionProfileBaseUrl, mention.handle);
	}

	if (mention?.did) {
		return joinProfileBaseUrl(mentionProfileBaseUrl, mention.did);
	}

	return undefined;
}

function joinProfileBaseUrl(baseUrl: string, target: string) {
	return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${target}`;
}

function wrapMarkdownLink(text: string, href: string) {
	const { leadingWhitespace, content, trailingWhitespace } = splitOuterWhitespace(text);
	if (!content) {
		return text;
	}

	return `${leadingWhitespace}[${content}](${href})${trailingWhitespace}`;
}

function wrapHtmlLink(text: string, href: string) {
	const { leadingWhitespace, content, trailingWhitespace } = splitOuterWhitespace(text);
	if (!content) {
		return text;
	}

	return `${leadingWhitespace}<a href="${escapeHtmlAttribute(href)}">${content}</a>${trailingWhitespace}`;
}

function splitOuterWhitespace(text: string) {
	const leadingWhitespace = text.match(/^\s*/)?.[0] ?? '';
	const trailingWhitespace = text.match(/\s*$/)?.[0] ?? '';
	return {
		leadingWhitespace,
		content: text.slice(leadingWhitespace.length, text.length - trailingWhitespace.length),
		trailingWhitespace
	};
}

function cleanupHtmlInline(input: string) {
	let output = input;

	for (;;) {
		const next = output
			.replace(
				/<a href="([^"]+)">([\s\S]*?)<\/a><a href="\1">([\s\S]*?)<\/a>/g,
				'<a href="$1">$2$3</a>'
			)
			.replace(/<(strong|em|s|u|mark|code)>(\s*)<\/\1>/g, '$2');

		if (next === output) {
			return output;
		}

		output = next;
	}
}

function hasComplexRichTextFormatting(spans: RichTextSpan[]) {
	for (let index = 0; index < spans.length; index += 1) {
		const current = spans[index];
		if (!current) {
			continue;
		}

		const currentMarks = current.marks ?? [];
		if (currentMarks.includes('underline') || currentMarks.includes('highlight')) {
			continue;
		}

		for (let nestedIndex = index + 1; nestedIndex < spans.length; nestedIndex += 1) {
			const other = spans[nestedIndex];
			if (!other) {
				continue;
			}

			const overlaps = current.byteStart < other.byteEnd && other.byteStart < current.byteEnd;
			const currentSignature = JSON.stringify({
				marks: [...(current.marks ?? [])].sort(),
				link: current.link
			});
			const otherSignature = JSON.stringify({
				marks: [...(other.marks ?? [])].sort(),
				link: other.link
			});

			if (overlaps && currentSignature !== otherSignature) {
				return true;
			}
		}
	}

	const segmentList = splitRichTextIntoSegmentsFromSpans(spans);
	for (let index = 0; index < segmentList.length - 1; index += 1) {
		const current = segmentList[index];
		const next = segmentList[index + 1];
		if (!current || !next) {
			continue;
		}

		const currentSignature = getFormattingSignature(current.spans);
		const nextSignature = getFormattingSignature(next.spans);
		if (!currentSignature || !nextSignature) {
			continue;
		}

		if (current.end === next.start && currentSignature !== nextSignature) {
			return true;
		}
	}

	return false;
}

function splitRichTextIntoSegmentsFromSpans(spans: RichTextSpan[]) {
	const boundaries = new Set<number>();
	for (const span of spans) {
		boundaries.add(span.byteStart);
		boundaries.add(span.byteEnd);
	}

	const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
	return sortedBoundaries.slice(0, -1).flatMap((start, index) => {
		const end = sortedBoundaries[index + 1];
		if (end === undefined || end <= start) {
			return [];
		}

		const activeSpans = spans.filter((span) => span.byteStart <= start && span.byteEnd >= end);
		if (!activeSpans.length) {
			return [];
		}

		return [{ start, end, spans: activeSpans }];
	});
}

function getFormattingSignature(spans: RichTextSpan[]) {
	if (!spans.length) {
		return undefined;
	}

	return JSON.stringify(
		spans.map((span) => ({
			marks: [...(span.marks ?? [])].sort(),
			link: span.link
		}))
	);
}

function prefixLines(input: string, prefix: string) {
	return input
		.split('\n')
		.map((line) => `${prefix}${line}`)
		.join('\n');
}

function clampHeadingLevel(level: number) {
	return Math.max(1, Math.min(6, level));
}

function escapeMarkdownText(input: string) {
	return input.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

function escapeHtmlText(input: string) {
	return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeHtmlAttribute(input: string) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

function escapeMarkdownTableText(input: string) {
	return escapeMarkdownText(input).replace(/\|/g, '\\|');
}

function getUtf8ByteLength(input: string) {
	return new TextEncoder().encode(input).length;
}

function sliceUtf8ByBytes(input: string, byteStart: number, byteEnd: number) {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	return decoder.decode(encoder.encode(input).slice(byteStart, byteEnd));
}
