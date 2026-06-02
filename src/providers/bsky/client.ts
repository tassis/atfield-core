import type { CoreServicesConfig } from '#core/core.types';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';
import { getAppViewProfile, getProfile } from './profile';
import { getPost, listPosts } from './post';
import {
	getAvatarCid,
	mergeProfiles,
	normalizePostRecord,
	normalizeProfileRecord
} from './normalization';

// After transport and identity are bound, the client only forwards getPost params.
type BskyGetPostParams = Parameters<typeof getPost>[2];

// After transport is bound, the client only forwards getAppViewProfile params.
type BskyGetAppViewProfileParams = Parameters<typeof getAppViewProfile>[1];

// After transport and identity are bound, the client only forwards listPosts params.
type BskyListPostsOptions = Parameters<typeof listPosts>[2];

export type AtfieldCoreBskyProviderClient = {
	getPost: (identity: ResolvedIdentity, params: BskyGetPostParams) => ReturnType<typeof getPost>;
	getProfile: (identity: ResolvedIdentity) => ReturnType<typeof getProfile>;
	getAppViewProfile: (params: BskyGetAppViewProfileParams) => ReturnType<typeof getAppViewProfile>;
	listPosts: (
		identity: ResolvedIdentity,
		options: BskyListPostsOptions
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
