import { buildBlobUrl, type RepoRecord } from '#core/repo';
import type { ResolvedIdentity } from '#core/types';
import { normalizeContent } from './content';
import type { Block, Image, ListItem, ListItemBlock, Result as ContentResult } from './content';
import {
	getStandardSiteBlobCid,
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord,
	type StandardSiteDocument,
	type StandardSitePublication
} from './types';

export function normalizePublication(
	record: RepoRecord,
	identity: ResolvedIdentity
): StandardSitePublication {
	const value = parseStandardSitePublicationRecord(record.value);
	const iconCid = getStandardSiteBlobCid(value.icon);

	return {
		uri: record.uri,
		rkey: record.uri.split('/').at(-1) ?? record.uri,
		cid: record.cid,
		name: value.name,
		url: value.url,
		description: value.description,
		icon: iconCid ? buildBlobUrl(identity, iconCid) : undefined,
		showInDiscover: value.preferences?.showInDiscover,
		author: {
			did: identity.did,
			handle: identity.handle
		}
	};
}

export function normalizeDocument(
	record: RepoRecord,
	identity: ResolvedIdentity
): StandardSiteDocument {
	const value = parseStandardSiteDocumentRecord(record.value);
	const coverImageCid = getStandardSiteBlobCid(value.coverImage);
	const content = value.content
		? resolveContentImageUrls(
				normalizeContent(value.content, { fallbackText: value.textContent }),
				identity
			)
		: undefined;

	return {
		uri: record.uri,
		rkey: record.uri.split('/').at(-1) ?? record.uri,
		cid: record.cid,
		title: value.title,
		site: value.site,
		publishedAt: value.publishedAt,
		path: value.path,
		description: value.description,
		tags: value.tags,
		textContent: value.textContent,
		content,
		updatedAt: value.updatedAt,
		coverImage: coverImageCid ? buildBlobUrl(identity, coverImageCid) : undefined,
		bskyPostUri: value.bskyPostRef?.uri,
		contributors: value.contributors?.map((contributor) => ({
			did: contributor.did,
			displayName: contributor.displayName,
			role: contributor.role
		})),
		author: {
			did: identity.did,
			handle: identity.handle
		}
	};
}

function resolveContentImageUrls(
	content: ContentResult,
	identity: ResolvedIdentity
): ContentResult {
	return {
		...content,
		blocks: content.blocks.map((block) => resolveBlockImageUrls(block, identity))
	};
}

function resolveBlockImageUrls(block: Block, identity: ResolvedIdentity): Block {
	if (block.type === 'list') {
		return {
			...block,
			items: block.items.map((item) => resolveListItemImageUrls(item, identity))
		};
	}

	return resolveListItemBlockImageUrls(block, identity);
}

function resolveListItemImageUrls(item: ListItem, identity: ResolvedIdentity): ListItem {
	return {
		...item,
		blocks: item.blocks?.map((block) => resolveListItemBlockImageUrls(block, identity)),
		children: item.children?.map((child) => resolveListItemImageUrls(child, identity))
	};
}

function resolveListItemBlockImageUrls(
	block: ListItemBlock,
	identity: ResolvedIdentity
): ListItemBlock {
	if (block.type !== 'image') {
		return block;
	}

	return {
		...block,
		images: block.images.map((image) => resolveImageUrl(image, identity))
	};
}

function resolveImageUrl(image: Image, identity: ResolvedIdentity): Image {
	if (image.src || !image.cid) {
		return image;
	}

	return {
		...image,
		src: buildBlobUrl(identity, image.cid)
	};
}
