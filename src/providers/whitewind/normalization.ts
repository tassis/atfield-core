import type { RepoRecord } from '#core/repo';
import type { ResolvedIdentity } from '#core/types';
import {
	parseWhitewindArticleRecord,
	type WhitewindArticle,
	type WhitewindArticleRecord
} from './types';

export function normalizeArticle(record: RepoRecord, identity: ResolvedIdentity): WhitewindArticle {
	const value: WhitewindArticleRecord = parseWhitewindArticleRecord(record.value);

	return {
		uri: record.uri,
		rkey: record.uri.split('/').at(-1) ?? record.uri,
		cid: record.cid,
		title: value.title,
		content: value.content,
		createdAt: value.createdAt,
		author: {
			did: identity.did,
			handle: identity.handle
		}
	};
}
