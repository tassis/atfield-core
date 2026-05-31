import { buildBlobUrl, getRecord } from '#core/repo';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getAppViewProfile } from '#core/providers/bsky/get-appview-profile';
import {
	getAvatarCid,
	mergeProfiles,
	normalizeProfileRecord
} from '#core/providers/bsky/normalize';

export async function getProfile(
	transport: CoreTransport,
	identity: ResolvedIdentity,
	options?: { appViewUrl?: string }
) {
	const record = await getRecord(transport, identity, {
		collection: 'app.bsky.actor.profile',
		rkey: 'self'
	});

	const avatarCid = getAvatarCid(record);
	const avatarUrl = avatarCid ? buildBlobUrl(identity, avatarCid) : undefined;
	const repoProfile = normalizeProfileRecord(record, identity, avatarUrl);

	if (!options?.appViewUrl) {
		return repoProfile;
	}

	try {
		const appViewProfile = await getAppViewProfile(transport, {
			actor: identity.did,
			baseUrl: options.appViewUrl
		});

		return mergeProfiles(repoProfile, appViewProfile);
	} catch {
		return repoProfile;
	}
}
