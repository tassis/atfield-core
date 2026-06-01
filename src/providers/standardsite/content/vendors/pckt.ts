import { addMark, joinRichText, normalizeRichText } from '../rich-text';
import type { RichTextFeatureHandler } from '../rich-text';
import type { Image, ItemNormalizers, ListItem, TableCell, TableRow, Warning } from '../types';

const pcktRichTextFeatureHandlers: Record<string, RichTextFeatureHandler> = {
	'blog.pckt.richtext.facet#bold': (_feature, span) => addMark(span, 'bold'),
	'blog.pckt.richtext.facet#italic': (_feature, span) => addMark(span, 'italic'),
	'blog.pckt.richtext.facet#underline': (_feature, span) => addMark(span, 'underline'),
	'blog.pckt.richtext.facet#strikethrough': (_feature, span) => addMark(span, 'strikethrough'),
	'blog.pckt.richtext.facet#code': (_feature, span) => addMark(span, 'code'),
	'blog.pckt.richtext.facet#highlight': (_feature, span) => addMark(span, 'highlight'),
	'blog.pckt.richtext.facet#link': (feature, span) => {
		span.link = getString(feature.uri);
	},
	'blog.pckt.richtext.facet#didMention': (feature, span) => {
		span.mention = {
			...span.mention,
			did: getString(feature.did)
		};
	},
	'blog.pckt.richtext.facet#atMention': (feature, span) => {
		span.mention = {
			...span.mention,
			atUri: getString(feature.atURI)
		};
	}
};

export const pcktBlockNormalizers: ItemNormalizers = {
	'blog.pckt.block.heading': (input, context) => {
		const richText = normalizePcktRichText(input, context.path, context.warn);
		return {
			type: 'heading',
			level: getNumber(input.level) ?? 1,
			text: getString(input.plaintext) ?? '',
			richText
		};
	},
	'blog.pckt.block.text': (input, context) => {
		const richText = normalizePcktRichText(input, context.path, context.warn);
		return {
			type: 'paragraph',
			text: getString(input.plaintext) ?? '',
			richText
		};
	},
	'blog.pckt.block.blockquote': (input) => ({
		type: 'blockquote',
		text: joinPlaintextBlocks(input.content)
	}),
	'blog.pckt.block.bulletList': (input, context) => ({
		type: 'list',
		style: 'bullet',
		items: normalizeListItems(input.content, context.path, context.warn)
	}),
	'blog.pckt.block.orderedList': (input, context) => ({
		type: 'list',
		style: 'ordered',
		items: normalizeListItems(input.content, context.path, context.warn)
	}),
	'blog.pckt.block.taskList': (input, context) => ({
		type: 'list',
		style: 'task',
		items: normalizeTaskItems(input.content, context.path, context.warn)
	}),
	'blog.pckt.block.image': (input) => ({
		type: 'image',
		layout: 'single',
		images: [normalizeImageFromAttrs(getRecord(input.attrs))]
	}),
	'blog.pckt.block.website': (input) => ({
		type: 'embed',
		embedType: 'link',
		url: getString(input.src),
		title: getString(input.title),
		text: getString(input.description)
	}),
	'blog.pckt.block.iframe': (input) => ({
		type: 'embed',
		embedType: 'link',
		url: getString(input.url)
	}),
	'blog.pckt.block.gallery': (input) => ({
		type: 'embed',
		embedType: 'gallery',
		url: getString(input.ref)
	}),
	'blog.pckt.block.blueskyEmbed': (input) => ({
		type: 'embed',
		embedType: 'bluesky-post',
		url: getStringFromRecord(input.postRef, 'uri')
	}),
	'blog.pckt.block.codeBlock': (input) => ({
		type: 'code',
		code: getString(input.plaintext) ?? '',
		language: getString(input.language) ?? getString(getRecord(input.attrs)?.language)
	}),
	'blog.pckt.block.horizontalRule': () => ({ type: 'divider' }),
	'blog.pckt.block.table': (input) => ({
		type: 'table',
		rows: normalizeTableRows(input.content)
	})
};

function normalizeListItems(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem[] {
	if (!Array.isArray(input)) {
		warn({
			code: 'invalid_block',
			message: 'Expected list content array',
			path: `${path}.content`
		});
		return [];
	}

	return input.map((entry, index) => normalizeListItem(entry, `${path}.content[${index}]`, warn));
}

function normalizeListItem(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem {
	const item = getRecord(input);

	if (!item) {
		warn({ code: 'invalid_block', message: 'Expected list item object', path });
		return { text: '' };
	}

	const content = Array.isArray(item.content) ? item.content : [];
	const text = joinPlaintextBlocks(content);
	const richText = normalizePcktRichTextBlocks(content, `${path}.content`, warn);
	const children = content.flatMap((entry, index) =>
		normalizeNestedLists(entry, `${path}.content[${index}]`, warn)
	);

	return {
		text,
		blocks: normalizeListItemContentBlocks(content, `${path}.content`, warn),
		richText,
		children: children.length ? children : undefined
	};
}

function normalizeTaskItems(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem[] {
	if (!Array.isArray(input)) {
		warn({
			code: 'invalid_block',
			message: 'Expected task list content array',
			path: `${path}.content`
		});
		return [];
	}

	return input.map((entry, index) => normalizeTaskItem(entry, `${path}.content[${index}]`, warn));
}

function normalizeTaskItem(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem {
	const item = getRecord(input);

	if (!item) {
		warn({ code: 'invalid_block', message: 'Expected task item object', path });
		return { text: '' };
	}

	return {
		text: joinPlaintextBlocks(item.content),
		blocks: normalizeListItemContentBlocks(item.content, `${path}.content`, warn),
		richText: normalizePcktRichTextBlocks(item.content, `${path}.content`, warn),
		checked: typeof item.checked === 'boolean' ? item.checked : undefined
	};
}

function normalizeListItemContentBlocks(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
) {
	if (!Array.isArray(input)) {
		return undefined;
	}

	const blocks = input.flatMap((entry, index) => {
		const block = getRecord(entry);
		const blockType = getString(block?.$type);
		const blockPath = `${path}[${index}]`;

		if (
			!block ||
			!blockType ||
			blockType === 'blog.pckt.block.bulletList' ||
			blockType === 'blog.pckt.block.orderedList'
		) {
			return [];
		}

		const normalizer = pcktBlockNormalizers[blockType];
		if (!normalizer) {
			return [];
		}

		const normalized = normalizer(block, { path: blockPath, warn });
		return normalized.type === 'list' ? [] : [normalized];
	});

	return blocks.length ? blocks : undefined;
}

function normalizePcktRichText(input: unknown, path: string, warn: (warning: Warning) => void) {
	return normalizeRichText(input, {
		path,
		warn,
		featureHandlers: pcktRichTextFeatureHandlers
	});
}

function normalizePcktRichTextBlocks(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
) {
	if (!Array.isArray(input)) {
		return undefined;
	}

	return joinRichText(
		input.map((entry, index) => normalizePcktRichText(entry, `${path}[${index}]`, warn))
	);
}

function normalizeNestedLists(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void
): ListItem[] {
	const block = getRecord(input);
	const blockType = getString(block?.$type);

	if (blockType === 'blog.pckt.block.bulletList' || blockType === 'blog.pckt.block.orderedList') {
		return normalizeListItems(block?.content, path, warn);
	}

	return [];
}

function normalizeImageFromAttrs(attrs: Record<string, unknown> | undefined): Image {
	const aspectRatio = getRecord(attrs?.aspectRatio);
	const blob = getRecord(attrs?.blob);

	return {
		cid: getStringFromRecord(blob?.ref, '$link'),
		src: getString(attrs?.src),
		mimeType: getString(blob?.mimeType),
		width: getNumber(aspectRatio?.width),
		height: getNumber(aspectRatio?.height),
		alt: getString(attrs?.alt),
		title: getString(attrs?.title),
		align: getAlign(attrs?.align)
	};
}

function normalizeTableRows(input: unknown): TableRow[] {
	if (!Array.isArray(input)) {
		return [];
	}

	return input.map((entry) => ({
		cells: normalizeTableCells(getRecord(entry)?.content)
	}));
}

function normalizeTableCells(input: unknown): TableCell[] {
	if (!Array.isArray(input)) {
		return [];
	}

	return input.map((entry) => {
		const cell = getRecord(entry);
		const cellType = getString(cell?.$type);

		return {
			text: joinPlaintextBlocks(cell?.content),
			header: cellType === 'blog.pckt.block.tableHeader',
			colspan: getNumber(cell?.colspan),
			rowspan: getNumber(cell?.rowspan)
		};
	});
}

function joinPlaintextBlocks(input: unknown) {
	if (!Array.isArray(input)) {
		return '';
	}

	return input
		.map((entry) => {
			const block = getRecord(entry);
			return getString(block?.plaintext) ?? '';
		})
		.filter(Boolean)
		.join('\n');
}

function getAlign(input: unknown): Image['align'] {
	return input === 'left' || input === 'center' || input === 'right' ? input : undefined;
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function getNumber(input: unknown) {
	return typeof input === 'number' ? input : undefined;
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
