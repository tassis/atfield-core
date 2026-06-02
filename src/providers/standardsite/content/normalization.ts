import { vendorsByContentType } from './registry';
import type { Block, ItemNormalizers, Options, Result, Warning } from './types';

export function normalizeContent(input: unknown, options: Options = {}): Result {
	const warnings: Warning[] = [];
	const warn = (warning: Warning) => {
		warnings.push(warning);
		options.onWarning?.(warning);
	};
	const content = asRecord(input);

	if (!content) {
		warn({
			code: 'invalid_content',
			message: 'Expected standard.site content object',
			path: 'content'
		});
		return {
			vendor: undefined,
			contentType: undefined,
			blocks: [],
			warnings,
			fallbackText: options.fallbackText
		};
	}

	const contentType = getString(content.$type);
	const vendor = contentType ? vendorsByContentType[contentType] : undefined;

	if (!vendor) {
		warn({
			code: contentType ? 'unsupported_content' : 'invalid_content',
			message: contentType
				? `Unsupported standard.site content type: ${contentType}`
				: 'Missing standard.site content type',
			path: 'content',
			rawType: contentType
		});
		return {
			vendor: undefined,
			contentType,
			blocks: [],
			warnings,
			fallbackText: options.fallbackText
		};
	}

	const extracted = vendor.extractBlocks(content, warn);

	return {
		vendor: vendor.name,
		contentType,
		blocks: extracted.blocks.map(({ input: item, path }) =>
			normalizeBlock(item, path, warn, vendor.name, vendor.normalizers)
		),
		warnings,
		fallbackText: options.fallbackText,
		skipped: extracted.skipped
	};
}

function normalizeBlock(
	input: unknown,
	path: string,
	warn: (warning: Warning) => void,
	vendor: string,
	normalizers: ItemNormalizers
): Block {
	const block = asRecord(input);

	if (!block) {
		warn({ code: 'invalid_block', message: 'Expected content block object', path });
		return { type: 'unknown', raw: input };
	}

	const rawType = getString(block.$type);
	const normalizer = rawType ? normalizers[rawType] : undefined;

	if (normalizer) {
		return normalizer(block, { path, warn });
	}

	warn({
		code: rawType ? 'unsupported_block' : 'invalid_block',
		message: rawType
			? `Unsupported standard.site content block: ${rawType}`
			: 'Missing content block type',
		path,
		rawType
	});

	if (rawType) {
		return { type: 'unsupported', rawType, vendor, raw: input };
	}

	return { type: 'unknown', rawType, raw: input };
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function asRecord(input: unknown): Record<string, unknown> | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: undefined;
}
