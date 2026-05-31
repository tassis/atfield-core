import type { RepoRecord } from '#core/repo';
import type { ResolvedIdentity } from '#core/types';
import type { BskyPost, BskyProfile } from '#core/providers/bsky/types';

type RepoProfileRecord = {
	displayName?: string;
	description?: string;
	avatar?: {
		ref?: {
			$link?: string;
		};
	};
};

type RepoPostRecord = {
	text?: string;
	createdAt?: string;
	langs?: string[];
};

export function normalizeProfileRecord(
	record: RepoRecord | null,
	identity: ResolvedIdentity,
	avatarUrl?: string
): BskyProfile {
	const value = record?.value as RepoProfileRecord | undefined;

	return {
		did: identity.did,
		handle: identity.handle ?? identity.did,
		displayName: value?.displayName,
		description: value?.description,
		avatar: avatarUrl
	};
}

export function normalizePostRecord(record: RepoRecord, identity: ResolvedIdentity): BskyPost {
	const value = record.value as RepoPostRecord;

	return {
		uri: record.uri,
		rkey: record.uri.split('/').at(-1) ?? record.uri,
		cid: record.cid,
		text: value.text ?? '',
		createdAt: value.createdAt,
		langs: value.langs,
		author: {
			did: identity.did,
			handle: identity.handle ?? identity.did
		}
	};
}

export function getAvatarCid(record: RepoRecord | null) {
	const value = record?.value as RepoProfileRecord | undefined;
	return value?.avatar?.ref?.$link;
}

export function mergeProfiles(repoProfile: BskyProfile, appViewProfile: BskyProfile): BskyProfile {
	return {
		...repoProfile,
		handle: appViewProfile.handle || repoProfile.handle,
		followersCount: appViewProfile.followersCount,
		followsCount: appViewProfile.followsCount,
		postsCount: appViewProfile.postsCount,
		displayName: repoProfile.displayName ?? appViewProfile.displayName,
		description: repoProfile.description ?? appViewProfile.description,
		avatar: repoProfile.avatar ?? appViewProfile.avatar
	};
}
