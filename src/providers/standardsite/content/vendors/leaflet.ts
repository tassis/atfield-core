import type { Image, ItemNormalizers, ListItem, ListItemBlock, Warning } from '../types';

export const leafletBlockNormalizers: ItemNormalizers = {
	'pub.leaflet.blocks.header': (input) => ({
		type: 'heading',
		level: getNumber(input.level) ?? 1,
		text: getString(input.plaintext) ?? ''
	}),
	'pub.leaflet.blocks.text': (input) => ({
		type: 'paragraph',
		text: getString(input.plaintext) ?? ''
	}),
	'pub.leaflet.blocks.blockquote': (input) => ({
		type: 'blockquote',
		text: getString(input.plaintext) ?? ''
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
		return [{ type: 'paragraph', text: getString(content?.plaintext) ?? '' }];
	}

	if (contentType === 'pub.leaflet.blocks.header') {
		return [
			{
				type: 'heading',
				level: getNumber(content?.level) ?? 1,
				text: getString(content?.plaintext) ?? ''
			}
		];
	}

	if (contentType === 'pub.leaflet.blocks.blockquote') {
		return [{ type: 'blockquote', text: getString(content?.plaintext) ?? '' }];
	}

	if (contentType === 'pub.leaflet.blocks.image') {
		return [
			{
				type: 'image',
				layout: 'single',
				images: [normalizeImage(content?.image, content?.aspectRatio, content?.alt)]
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
