export type WhitewindArticleVisibility = 'public' | 'all';

export type WhitewindArticleRecord = {
	$type?: 'com.whtwnd.blog.entry' | 'com.whtwnd.blog.entry#main';
	title?: string;
	content?: string;
	createdAt?: string;
	visibility?: string;
	blobs?: unknown[];
};

export type WhitewindArticle = {
	uri: string;
	rkey: string;
	cid: string;
	title?: string;
	content?: string;
	createdAt?: string;
	author: {
		did: string;
		handle?: string;
	};
};

export function parseWhitewindArticleRecord(input: unknown): WhitewindArticleRecord {
	if (typeof input !== 'object' || input === null) {
		throw new Error('Expected Whitewind article record object');
	}

	const record = input as Record<string, unknown>;

	if (
		record.$type !== undefined &&
		record.$type !== 'com.whtwnd.blog.entry' &&
		record.$type !== 'com.whtwnd.blog.entry#main'
	) {
		throw new Error('Invalid Whitewind article record type');
	}

	assertOptionalString(record.title, 'title');
	assertOptionalString(record.content, 'content');
	assertOptionalString(record.createdAt, 'createdAt');
	assertOptionalString(record.visibility, 'visibility');

	if (record.blobs !== undefined && !Array.isArray(record.blobs)) {
		throw new Error('Invalid Whitewind article blobs');
	}

	return record as WhitewindArticleRecord;
}

export function isVisibleWhitewindArticleRecord(
	record: WhitewindArticleRecord,
	visibility: WhitewindArticleVisibility = 'public'
) {
	if (visibility === 'all') {
		return true;
	}

	return record.visibility === undefined || record.visibility === 'public';
}

function assertOptionalString(value: unknown, field: string) {
	if (value !== undefined && typeof value !== 'string') {
		throw new Error(`Invalid Whitewind article field: ${field}`);
	}
}
