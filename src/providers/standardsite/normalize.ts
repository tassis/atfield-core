import { buildBlobUrl, type RepoRecord } from '#core/repo';
import type { ResolvedIdentity } from '#core/types';
import {
	getStandardSiteBlobCid,
	parseStandardSiteDocumentRecord,
	parseStandardSitePublicationRecord,
	type StandardSiteDocument,
	type StandardSitePublication
} from '#core/providers/standardsite/types';

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

export function normalizeDocument(record: RepoRecord, identity: ResolvedIdentity): StandardSiteDocument {
	const value = parseStandardSiteDocumentRecord(record.value);
	const coverImageCid = getStandardSiteBlobCid(value.coverImage);

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
