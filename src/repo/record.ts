import { defineSchema } from '#core/schema';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

export type RepoRecord = {
	uri: string;
	cid: string;
	value: Record<string, unknown>;
};

type RepoGetRecordResponse = RepoRecord;

const getRecordSchema = defineSchema<RepoGetRecordResponse>({
	parse(input) {
		if (!isRepoRecord(input)) {
			throw new Error('Expected repo record response');
		}

		return input;
	}
});

export async function getRecord(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	params: {
		collection: string;
		rkey: string;
	}
): Promise<RepoRecord | null> {
	const url = new URL('xrpc/com.atproto.repo.getRecord', appendSlash(identity.pdsUrl));
	url.searchParams.set('repo', identity.did);
	url.searchParams.set('collection', params.collection);
	url.searchParams.set('rkey', params.rkey);

	const response = await transport.request({ url });

	if (response.status === 400 || response.status === 404) {
		return null;
	}

	return transport.requestJson({
		url,
		fallbackMessage: 'Failed to fetch repo record',
		schema: getRecordSchema
	});
}

function appendSlash(url: string) {
	return url.endsWith('/') ? url : `${url}/`;
}

function isRepoRecord(input: unknown): input is RepoGetRecordResponse {
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
