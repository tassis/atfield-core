import { defineSchema } from '#core/schema';
import { createJsonEndpoint, type CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import type { RepoRecord } from '#core/repo/get-record';

export type RepoListRecordsResponse = {
	cursor?: string;
	records: RepoRecord[];
};

const listRecordsSchema = defineSchema<RepoListRecordsResponse>({
	parse(input) {
		if (!isRepoListRecordsResponse(input)) {
			throw new Error('Expected repo listRecords response');
		}

		return input;
	}
});

const listRecordsEndpoint = createJsonEndpoint({
	buildRequest(params: {
		identity: ResolvedIdentity;
		collection: string;
		limit: number;
		cursor?: string;
	}) {
		const url = new URL('xrpc/com.atproto.repo.listRecords', appendSlash(params.identity.pdsUrl));
		url.searchParams.set('repo', params.identity.did);
		url.searchParams.set('collection', params.collection);
		url.searchParams.set('limit', String(params.limit));
		url.searchParams.set('reverse', 'true');

		if (params.cursor) {
			url.searchParams.set('cursor', params.cursor);
		}

		return { url };
	},
	schema: listRecordsSchema,
	fallbackMessage: 'Failed to list repo records'
});

export async function listRecords(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: {
		collection: string;
		limit: number;
		cursor?: string;
	}
) {
	return listRecordsEndpoint(transport, {
		identity,
		...params
	});
}

function appendSlash(url: string) {
	return url.endsWith('/') ? url : `${url}/`;
}

function isRepoListRecordsResponse(input: unknown): input is RepoListRecordsResponse {
	if (typeof input !== 'object' || input === null) {
		return false;
	}

	const response = input as { cursor?: unknown; records?: unknown };

	return (
		(response.cursor === undefined || typeof response.cursor === 'string') &&
		Array.isArray(response.records) &&
		response.records.every(isRepoRecord)
	);
}

function isRepoRecord(input: unknown): input is RepoRecord {
	if (typeof input !== 'object' || input === null) {
		return false;
	}

	const record = input as { uri?: unknown; cid?: unknown; value?: unknown };
	return (
		typeof record.uri === 'string' &&
		typeof record.cid === 'string' &&
		typeof record.value === 'object' &&
		record.value !== null
	);
	}
