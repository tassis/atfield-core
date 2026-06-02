import type { Block, ListItem, ListItemBlock, RichText, RichTextSpan, Result } from './types';

export type MarkdownOptions = {
	preserveFallbackBlocksAsComments?: boolean;
	preferRichText?: boolean;
	inlineStyle?: 'markdown' | 'html';
	mentionProfileBaseUrl?: string;
};

const DEFAULT_MENTION_PROFILE_BASE_URL = 'https://bsky.app/profile/';

export function renderMarkdown(input: Result | Block[], options: MarkdownOptions = {}): string {
	const blocks = Array.isArray(input) ? input : input.blocks;
	return renderBlocks(blocks, options).trim();
}

function renderBlocks(blocks: Block[], options: MarkdownOptions, indent = ''): string {
	return blocks
		.map((block) => renderBlock(block, options, indent))
		.filter(Boolean)
		.join('\n\n');
}

function renderBlock(block: Block | ListItemBlock, options: MarkdownOptions, indent = ''): string {
	switch (block.type) {
		case 'heading':
			return `${indent}${'#'.repeat(clampHeadingLevel(block.level))} ${renderText(block.richText, block.text, options)}`;
		case 'paragraph':
			return `${indent}${renderText(block.richText, block.text, options)}`;
		case 'blockquote':
			return prefixLines(block.text, `${indent}> `);
		case 'callout': {
			const text = renderText(block.richText, block.text, options);
			const calloutText = [block.emoji, text].filter(Boolean).join(' ');
			return prefixLines(calloutText, `${indent}> `);
		}
		case 'list':
			return renderList(block.items, block.style, options, indent);
		case 'image':
			return renderImages(block.images, indent);
		case 'embed':
			return `${indent}${renderEmbed(block)}`;
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

function renderList(
	items: ListItem[],
	style: 'bullet' | 'ordered' | 'task',
	options: MarkdownOptions,
	indent = ''
): string {
	return items.map((item, index) => renderListItem(item, style, options, indent, index)).join('\n');
}

function renderListItem(
	item: ListItem,
	style: 'bullet' | 'ordered' | 'task',
	options: MarkdownOptions,
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
		const renderedBlocks = renderBlocks(nestedBlocks, options, childIndent);
		if (renderedBlocks) {
			lines.push(renderedBlocks);
		}
	}

	if (item.children?.length) {
		lines.push(renderList(item.children, style, options, childIndent));
	}

	return lines.join('\n\n');
}

function splitListItemContent(item: ListItem, options: MarkdownOptions) {
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

function renderImages(
	images: Array<{ alt?: string; src?: string; cid?: string }>,
	indent = ''
): string {
	return images
		.map(
			(image) =>
				`${indent}![${escapeMarkdownText(image.alt ?? '')}](${image.src ?? image.cid ?? ''})`
		)
		.join('\n\n');
}

function renderEmbed(block: Extract<Block | ListItemBlock, { type: 'embed' }>) {
	const label = block.text ?? block.title ?? block.url ?? '';
	if (!block.url) {
		return label;
	}

	if (!label || label === block.url) {
		return `<${block.url}>`;
	}

	return `[${escapeMarkdownText(label)}](${block.url})`;
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
	options: MarkdownOptions
) {
	if (!richText || options.preferRichText === false || !richText.spans?.length) {
		return escapeMarkdownText(fallbackText);
	}

	return renderRichText(richText, options);
}

function renderRichText(richText: RichText, options: MarkdownOptions) {
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

function renderRichTextAsHtml(richText: RichText, options: MarkdownOptions) {
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

function applySpanFormatting(text: string, spans: RichTextSpan[], options: MarkdownOptions) {
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

function applyHtmlSpanFormatting(text: string, spans: RichTextSpan[], options: MarkdownOptions) {
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

function getSpanHref(spans: RichTextSpan[], options: MarkdownOptions) {
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
