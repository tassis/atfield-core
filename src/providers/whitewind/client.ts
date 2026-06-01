import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getArticle, listArticles, WHITEWIND_ARTICLE_COLLECTION } from './article';
import { normalizeArticle } from './normalization';
import { isVisibleWhitewindArticleRecord, parseWhitewindArticleRecord } from './types';

// After transport and identity are bound, the client only forwards getArticle params.
type WhitewindGetArticleParams = Parameters<typeof getArticle>[2];

// After transport and identity are bound, the client only forwards listArticles params.
type WhitewindListArticlesOptions = Parameters<typeof listArticles>[2];

export type AtfieldCoreWhitewindProviderClient = {
	getArticle: (
		identity: ResolvedIdentity,
		params: WhitewindGetArticleParams
	) => ReturnType<typeof getArticle>;
	listArticles: (
		identity: ResolvedIdentity,
		options: WhitewindListArticlesOptions
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
