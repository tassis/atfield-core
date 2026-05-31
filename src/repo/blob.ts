import type { ResolvedIdentity } from '#core/types';

export function buildBlobUrl(identity: ResolvedIdentity, cid: string) {
	const url = new URL('xrpc/com.atproto.sync.getBlob', appendSlash(identity.pdsUrl));
	url.searchParams.set('did', identity.did);
	url.searchParams.set('cid', cid);
	return url.toString();
}

function appendSlash(url: string) {
	return url.endsWith('/') ? url : `${url}/`;
}
