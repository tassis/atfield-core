import { offprintBlockNormalizers } from './vendors/offprint';
import { pcktBlockNormalizers } from './vendors/pckt';
import { leafletBlockNormalizers } from './vendors/leaflet';
import type { ExtractedBlock, Skipped, Vendor, Warning } from './types';

export const vendorsByContentType: Record<string, Vendor> = {
	'app.offprint.content': {
		name: 'offprint',
		extractBlocks: extractItemsBlocks,
		normalizers: offprintBlockNormalizers
	},
	'blog.pckt.content': {
		name: 'pckt',
		extractBlocks: extractItemsBlocks,
		normalizers: pcktBlockNormalizers
	},
	'pub.leaflet.content': {
		name: 'leaflet',
		extractBlocks: extractLeafletBlocks,
		normalizers: leafletBlockNormalizers
	}
};

function extractItemsBlocks(
	content: Record<string, unknown>,
	warn: (warning: Warning) => void
): { blocks: ExtractedBlock[]; skipped?: Skipped[] } {
	if (!Array.isArray(content.items)) {
		warn({
			code: 'invalid_items',
			message: 'Expected standard.site content items array',
			path: 'content.items'
		});
		return { blocks: [] };
	}

	return {
		blocks: content.items.map((input, index) => ({ input, path: `content.items[${index}]` }))
	};
}

function extractLeafletBlocks(
	content: Record<string, unknown>,
	warn: (warning: Warning) => void
): { blocks: ExtractedBlock[]; skipped?: Skipped[] } {
	if (!Array.isArray(content.pages)) {
		warn({
			code: 'invalid_items',
			message: 'Expected Leaflet content pages array',
			path: 'content.pages'
		});
		return { blocks: [] };
	}

	const extracted: ExtractedBlock[] = [];
	const skipped: Skipped[] = [];

	for (const [pageIndex, pageEntry] of content.pages.entries()) {
		const page = asRecord(pageEntry);
		const pageType = getString(page?.$type);
		const pageBlocks = page?.blocks;

		if (pageType !== 'pub.leaflet.pages.linearDocument') {
			skipped.push({
				kind: 'container',
				vendor: 'leaflet',
				reason: 'unsupported_page_type',
				rawType: pageType,
				path: `content.pages[${pageIndex}]`,
				raw: pageEntry
			});
			continue;
		}

		if (!Array.isArray(pageBlocks)) {
			warn({
				code: 'invalid_items',
				message: 'Expected Leaflet linear document blocks array',
				path: `content.pages[${pageIndex}].blocks`
			});
			continue;
		}

		for (const [blockIndex, blockEntry] of pageBlocks.entries()) {
			const blockWrapper = asRecord(blockEntry);
			extracted.push({
				input: blockWrapper?.block,
				path: `content.pages[${pageIndex}].blocks[${blockIndex}].block`
			});
		}
	}

	return {
		blocks: extracted,
		skipped: skipped.length ? skipped : undefined
	};
}

function getString(input: unknown) {
	return typeof input === 'string' ? input : undefined;
}

function asRecord(input: unknown): Record<string, unknown> | undefined {
	return typeof input === 'object' && input !== null && !Array.isArray(input)
		? (input as Record<string, unknown>)
		: undefined;
}
