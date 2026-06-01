import { buildBlobUrl, getRecord } from '#core/repo';
import { defineSchema } from '#core/schema';
import { createJsonEndpoint, type CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import type { BskyProfile } from './types';
import { getAvatarCid, mergeProfiles, normalizeProfileRecord } from './normalization';

type PublicProfileResponse = {
	did: string;
	handle: string;
	displayName?: string;
	description?: string;
	avatar?: string;
	followersCount?: number;
	followsCount?: number;
	postsCount?: number;
};

const publicProfileSchema = defineSchema<PublicProfileResponse>({
	parse(input) {
		if (!isPublicProfileResponse(input)) {
			throw new Error('Expected AppView profile response');
		}

		return input;
	}
});

const getAppViewProfileEndpoint = createJsonEndpoint({
	buildRequest(params: { actor: string; baseUrl: string }) {
		const url = new URL('app.bsky.actor.getProfile', `${params.baseUrl}/`);
		url.searchParams.set('actor', params.actor);

		return { url };
	},
	schema: publicProfileSchema,
	fallbackMessage: 'Failed to fetch profile from AppView'
});

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

export async function getAppViewProfile(
	transport: CoreTransport,
	params: { actor: string; baseUrl: string }
): Promise<BskyProfile> {
	const profile = await getAppViewProfileEndpoint(transport, params);

	return {
		did: profile.did,
		handle: profile.handle,
		displayName: profile.displayName,
		description: profile.description,
		avatar: profile.avatar,
		followersCount: profile.followersCount,
		followsCount: profile.followsCount,
		postsCount: profile.postsCount
	};
}

function isPublicProfileResponse(input: unknown): input is PublicProfileResponse {
	if (typeof input !== 'object' || input === null) {
		return false;
	}

	const profile = input as Record<string, unknown>;

	return typeof profile.did === 'string' && typeof profile.handle === 'string';
}
