import type { CoreServicesConfig } from '#core/core.types';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getAppViewProfile } from '#core/providers/bsky/get-appview-profile';
import { getPost } from '#core/providers/bsky/get-post';
import { getProfile } from '#core/providers/bsky/get-profile';
import { listPosts } from '#core/providers/bsky/list-posts';
import {
	getAvatarCid,
	mergeProfiles,
	normalizePostRecord,
	normalizeProfileRecord
} from '#core/providers/bsky/normalize';

export type AtfieldCoreBskyProviderClient = {
	getPost: (
		identity: ResolvedIdentity,
		params: Parameters<typeof getPost>[2]
	) => ReturnType<typeof getPost>;
	getProfile: (identity: ResolvedIdentity) => ReturnType<typeof getProfile>;
	getAppViewProfile: (
		params: Parameters<typeof getAppViewProfile>[1]
	) => ReturnType<typeof getAppViewProfile>;
	listPosts: (
		identity: ResolvedIdentity,
		options: Parameters<typeof listPosts>[2]
	) => ReturnType<typeof listPosts>;
	getAvatarCid: typeof getAvatarCid;
	mergeProfiles: typeof mergeProfiles;
	normalizePostRecord: typeof normalizePostRecord;
	normalizeProfileRecord: typeof normalizeProfileRecord;
};

export function buildBskyProviderClient(
	transport: CoreTransport,
	services: Required<CoreServicesConfig>
): AtfieldCoreBskyProviderClient {
	return {
		getPost: (identity, params) => getPost(transport, identity, params),
		getProfile: (identity) => getProfile(transport, identity, { appViewUrl: services.appViewUrl }),
		getAppViewProfile: (params) =>
			getAppViewProfile(transport, {
				...params,
				baseUrl: params.baseUrl ?? services.appViewUrl
			}),
		listPosts: (identity, options) => listPosts(transport, identity, options),
		getAvatarCid,
		mergeProfiles,
		normalizePostRecord,
		normalizeProfileRecord
	};
}
