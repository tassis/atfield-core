import { defaultContentBundle } from './registry';
import type { ContentExtractor, ExtractedContent } from './internal-types';
import type { ContentBundle, ContentNormalizerConfig, ContentTypeRegistry, Options } from './types';

export const extractContent = createContentExtractor({
	bundles: [defaultContentBundle]
});

export function createContentExtractor(config: ContentNormalizerConfig): ContentExtractor {
	const contentTypes = mergeContentTypeBundles(config.bundles ?? [], config.contentTypes);

	return (input: unknown, options: Options = {}): ExtractedContent => {
		const warnings: ExtractedContent['warnings'] = [];
		const warn = (warning: ExtractedContent['warnings'][number]) => {
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
				contentType: undefined,
				blocks: [],
				warnings,
				fallbackText: options.fallbackText
			};
		}

		const contentType = getString(content.$type);
		const contentTypeDefinition = contentType ? contentTypes[contentType] : undefined;

		if (!contentTypeDefinition) {
			warn({
				code: contentType ? 'unsupported_content' : 'invalid_content',
				message: contentType
					? `Unsupported standard.site content type: ${contentType}`
					: 'Missing standard.site content type',
				path: 'content',
				rawType: contentType
			});
			return {
				contentType,
				blocks: [],
				warnings,
				fallbackText: options.fallbackText
			};
		}

		const extracted = contentTypeDefinition.extractBlocks(content, warn);

		return {
			contentType,
			blocks: extracted.blocks.flatMap(({ input: item, path }) => {
				const block = asRecord(item);
				if (!block) {
					warn({ code: 'invalid_block', message: 'Expected content block object', path });
					return [];
				}

				const rawType = getString(block.$type);
				if (!rawType) {
					warn({ code: 'invalid_block', message: 'Missing content block type', path });
					return [];
				}

				return [
					{
						rawType,
						path,
						source: omitType(block)
					}
				];
			}),
			warnings,
			fallbackText: options.fallbackText,
			skipped: extracted.skipped
		};
	};
}

function mergeContentTypeBundles(
	bundles: ContentBundle[],
	overrides?: ContentTypeRegistry
): ContentTypeRegistry {
	const contentTypes: ContentTypeRegistry = {};

	for (const bundle of bundles) {
		if (bundle.contentTypes) {
			Object.assign(contentTypes, bundle.contentTypes);
		}
	}

	if (overrides) {
		Object.assign(contentTypes, overrides);
	}

	return contentTypes;
}

function omitType(input: Record<string, unknown>) {
	const rest = { ...input };
	delete rest.$type;
	return rest;
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function asRecord(input: unknown): Record<string, unknown> | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: undefined;
}
