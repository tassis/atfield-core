import type { ContentResult, Options, Skipped, Warning } from './types';

export type ExtractedBlock = {
	rawType: string;
	// Raw block payload after extraction, without its $type field.
	source: unknown;
	path?: string;
};

export type ExtractedContent = {
	contentType?: string;
	blocks: ExtractedBlock[];
	warnings: Warning[];
	fallbackText?: string;
	skipped?: Skipped[];
};

export type ContentExtractor = (input: unknown, options?: Options) => ExtractedContent;

export type ContentProjector = (input: ExtractedContent) => ContentResult;

export type SourcePayload = Record<string, unknown>;

export type ExtractedBlockInput = {
	input: unknown;
	path: string;
};
