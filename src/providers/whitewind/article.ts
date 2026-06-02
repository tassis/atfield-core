import { getRecord, listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizeArticle } from './normalization';
import {
	isVisibleWhitewindArticleRecord,
	parseWhitewindArticleRecord,
	type WhitewindArticleVisibility
} from './types';

export const WHITEWIND_ARTICLE_COLLECTION = 'com.whtwnd.blog.entry';

export async function getArticle(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: { rkey: string; visibility?: WhitewindArticleVisibility }
) {
	const record = await getRecord(transport, identity, {
		collection: WHITEWIND_ARTICLE_COLLECTION,
		rkey: params.rkey
	});

	if (!record) {
		return null;
	}

	const visibility = params.visibility ?? 'public';
	const rawRecord = parseWhitewindArticleRecord(record.value);

	if (!isVisibleWhitewindArticleRecord(rawRecord, visibility)) {
		return null;
	}

	return normalizeArticle(record, identity);
}

export async function listArticles(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	options: { limit: number; cursor?: string; visibility?: WhitewindArticleVisibility }
) {
	const response = await listRecords(transport, identity, {
		collection: WHITEWIND_ARTICLE_COLLECTION,
		limit: options.limit,
		cursor: options.cursor
	});

	const visibility = options.visibility ?? 'public';
	const articles = response.records
		.filter((record) =>
			isVisibleWhitewindArticleRecord(parseWhitewindArticleRecord(record.value), visibility)
		)
		.map((record) => normalizeArticle(record, identity));

	return {
		cursor: response.cursor,
		articles
	};
}
