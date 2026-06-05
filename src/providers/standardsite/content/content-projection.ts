import { defaultContentBundle } from './registry';
import type {
	ContentProjector,
	ExtractedBlock,
	ExtractedContent,
	SourcePayload
} from './internal-types';
import type { ContentBlock, ContentBlockSemanticHandlerRegistry, ContentResult } from './types';

export function projectContentBlock(block: ExtractedBlock): ContentBlock {
	return createContentBlockProjector(defaultContentBundle.semanticHandlers ?? {})(block);
}

export function createContentBlockProjector(semanticHandlers: ContentBlockSemanticHandlerRegistry) {
	return (block: ExtractedBlock): ContentBlock => {
		const source = asRecord(block.source);
		const semanticHandler = semanticHandlers[block.rawType];

		if (!source || !semanticHandler) {
			return block;
		}

		return {
			...block,
			semantic:
				semanticHandler(source, {
					rawType: block.rawType,
					path: block.path ?? 'content',
					warn: () => undefined
				}) ?? undefined
		};
	};
}

export const projectContent: ContentProjector = createContentProjector(
	defaultContentBundle.semanticHandlers ?? {}
);

export function createContentProjector(semanticHandlers: ContentBlockSemanticHandlerRegistry) {
	const projectBlock = createContentBlockProjector(semanticHandlers);
	return (input: ExtractedContent): ContentResult => ({
		contentType: input.contentType,
		blocks: input.blocks.map((block) => projectBlock(block)),
		warnings: input.warnings,
		fallbackText: input.fallbackText,
		skipped: input.skipped
	});
}

function asRecord(input: unknown): SourcePayload | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as SourcePayload)
		: undefined;
}
