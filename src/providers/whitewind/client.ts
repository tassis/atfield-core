import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getArticle } from '#core/providers/whitewind/get-article';
import {
	listArticles,
	WHITEWIND_ARTICLE_COLLECTION
} from '#core/providers/whitewind/list-articles';
import { normalizeArticle } from '#core/providers/whitewind/normalize';
import {
	isVisibleWhitewindArticleRecord,
	parseWhitewindArticleRecord
} from '#core/providers/whitewind/types';

export type AtfieldCoreWhitewindProviderClient = {
	getArticle: (
		identity: ResolvedIdentity,
		params: Parameters<typeof getArticle>[2]
	) => ReturnType<typeof getArticle>;
	listArticles: (
		identity: ResolvedIdentity,
		options: Parameters<typeof listArticles>[2]
	) => ReturnType<typeof listArticles>;
	normalizeArticle: typeof normalizeArticle;
	parseArticleRecord: typeof parseWhitewindArticleRecord;
	isVisibleArticleRecord: typeof isVisibleWhitewindArticleRecord;
	WHITEWIND_ARTICLE_COLLECTION: typeof WHITEWIND_ARTICLE_COLLECTION;
};

export function buildWhitewindProviderClient(
	transport: CoreTransport
): AtfieldCoreWhitewindProviderClient {
	return {
		getArticle: (identity, params) => getArticle(transport, identity, params),
		listArticles: (identity, options) => listArticles(transport, identity, options),
		normalizeArticle,
		parseArticleRecord: parseWhitewindArticleRecord,
		isVisibleArticleRecord: isVisibleWhitewindArticleRecord,
		WHITEWIND_ARTICLE_COLLECTION
	};
}
