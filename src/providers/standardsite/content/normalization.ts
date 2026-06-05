import { defaultContentBundle } from './registry';
import { createContentExtractor } from './extraction';
import { createContentProjector } from './content-projection';
import type {
	ContentBlockSemanticHandlerRegistry,
	ContentBundle,
	ContentResult,
	ContentNormalizer,
	ContentNormalizerConfig,
	Options
} from './types';

export const normalizeContent = createContentNormalizer({
	bundles: [defaultContentBundle]
});

export function createContentNormalizer(config: ContentNormalizerConfig): ContentNormalizer {
	const semanticHandlers = mergeSemanticHandlers(config.bundles ?? [], config.semanticHandlers);
	const contentExtractor = createContentExtractor(config);
	const projectResult = createContentProjector(semanticHandlers);

	return (input: unknown, options?: Options): ContentResult =>
		projectResult(contentExtractor(input, options));
}

function mergeSemanticHandlers(
	bundles: ContentBundle[],
	overrides?: ContentBlockSemanticHandlerRegistry
): ContentBlockSemanticHandlerRegistry {
	const semanticHandlers: ContentBlockSemanticHandlerRegistry = {};

	for (const bundle of bundles) {
		if (bundle.semanticHandlers) {
			Object.assign(semanticHandlers, bundle.semanticHandlers);
		}
	}

	if (overrides) {
		Object.assign(semanticHandlers, overrides);
	}

	return semanticHandlers;
}
