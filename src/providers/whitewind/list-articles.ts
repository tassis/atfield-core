import { listRecords } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { normalizeArticle } from '#core/providers/whitewind/normalize';
import {
	isVisibleWhitewindArticleRecord,
	parseWhitewindArticleRecord,
	type WhitewindArticleVisibility
} from '#core/providers/whitewind/types';

export const WHITEWIND_ARTICLE_COLLECTION = 'com.whtwnd.blog.entry';

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
		.filter((record) => isVisibleWhitewindArticleRecord(parseWhitewindArticleRecord(record.value), visibility))
		.map((record) => normalizeArticle(record, identity));

	return {
		cursor: response.cursor,
		articles
	};
}
