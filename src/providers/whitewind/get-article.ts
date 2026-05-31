import { getRecord } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { WHITEWIND_ARTICLE_COLLECTION } from '#core/providers/whitewind/list-articles';
import { normalizeArticle } from '#core/providers/whitewind/normalize';
import {
	isVisibleWhitewindArticleRecord,
	parseWhitewindArticleRecord,
	type WhitewindArticleVisibility
} from '#core/providers/whitewind/types';

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
