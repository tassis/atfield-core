import type { RichText, RichTextMark, RichTextSpan, Warning } from './types';

type MutableRichTextSpan = {
	byteStart: number;
	byteEnd: number;
	marks?: Set<RichTextMark>;
	link?: string;
	mention?: {
		did?: string;
		handle?: string;
		atUri?: string;
	};
};

export type RichTextFeatureHandler = (
	feature: Record<string, unknown>,
	span: MutableRichTextSpan
) => void;

export type RichTextOptions = {
	path: string;
	warn: (warning: Warning) => void;
	featureHandlers: Record<string, RichTextFeatureHandler>;
};

export function normalizeRichText(input: unknown, options: RichTextOptions): RichText | undefined {
	const block = asRecord(input);
	const text = getString(block?.plaintext);

	if (text === undefined) {
		return undefined;
	}

	const spans = normalizeRichTextSpans(block?.facets, options);
	return spans.length ? { text, spans } : undefined;
}

export function joinRichText(
	parts: Array<RichText | undefined>,
	separator = '\n'
): RichText | undefined {
	const normalizedParts = parts.filter((part): part is RichText => Boolean(part));
	if (!normalizedParts.length) {
		return undefined;
	}

	const text = normalizedParts.map((part) => part.text).join(separator);
	const spans: RichTextSpan[] = [];
	let offset = 0;

	for (const [index, part] of normalizedParts.entries()) {
		for (const span of part.spans ?? []) {
			spans.push({
				...span,
				byteStart: span.byteStart + offset,
				byteEnd: span.byteEnd + offset
			});
		}

		offset += getUtf8ByteLength(part.text);
		if (index < normalizedParts.length - 1) {
			offset += getUtf8ByteLength(separator);
		}
	}

	return spans.length ? { text, spans } : { text };
}

export function addMark(span: MutableRichTextSpan, mark: RichTextMark) {
	span.marks ??= new Set<RichTextMark>();
	span.marks.add(mark);
}

function normalizeRichTextSpans(input: unknown, options: RichTextOptions): RichTextSpan[] {
	if (input === undefined) {
		return [];
	}

	if (!Array.isArray(input)) {
		options.warn({
			code: 'invalid_block',
			message: 'Expected rich text facets array',
			path: `${options.path}.facets`
		});
		return [];
	}

	const spans = new Map<string, MutableRichTextSpan>();

	for (const [index, entry] of input.entries()) {
		const facet = asRecord(entry);
		if (!facet) {
			options.warn({
				code: 'invalid_block',
				message: 'Expected rich text facet object',
				path: `${options.path}.facets[${index}]`
			});
			continue;
		}

		const byteSlice = asRecord(facet.index);
		const byteStart = getNumber(byteSlice?.byteStart);
		const byteEnd = getNumber(byteSlice?.byteEnd);

		if (byteStart === undefined || byteEnd === undefined || byteStart < 0 || byteEnd < byteStart) {
			options.warn({
				code: 'invalid_block',
				message: 'Expected valid rich text byte slice',
				path: `${options.path}.facets[${index}].index`
			});
			continue;
		}

		if (!Array.isArray(facet.features)) {
			options.warn({
				code: 'invalid_block',
				message: 'Expected rich text facet features array',
				path: `${options.path}.facets[${index}].features`
			});
			continue;
		}

		const key = `${byteStart}:${byteEnd}`;
		const span = spans.get(key) ?? { byteStart, byteEnd };
		let changed = false;

		for (const featureEntry of facet.features) {
			const feature = asRecord(featureEntry);
			const featureType = getString(feature?.$type);
			const handler = featureType ? options.featureHandlers[featureType] : undefined;

			if (feature && handler) {
				handler(feature, span);
				changed = true;
			}
		}

		if (changed) {
			spans.set(key, span);
		}
	}

	return Array.from(spans.values())
		.map(toRichTextSpan)
		.sort((left, right) => left.byteStart - right.byteStart || left.byteEnd - right.byteEnd);
}

function toRichTextSpan(span: MutableRichTextSpan): RichTextSpan {
	return {
		byteStart: span.byteStart,
		byteEnd: span.byteEnd,
		marks: span.marks?.size ? Array.from(span.marks) : undefined,
		link: span.link,
		mention: span.mention
	};
}

function getUtf8ByteLength(input: string) {
	return new TextEncoder().encode(input).length;
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function getNumber(input: unknown) {
	return typeof input === 'number' ? input : undefined;
}

function asRecord(input: unknown): Record<string, unknown> | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: undefined;
}
