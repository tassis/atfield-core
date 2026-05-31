export type BskyProfile = {
	did: string;
	handle: string;
	displayName?: string;
	description?: string;
	avatar?: string;
	followersCount?: number;
	followsCount?: number;
	postsCount?: number;
};

export type BskyPost = {
	uri: string;
	rkey: string;
	cid: string;
	text: string;
	createdAt?: string;
	langs?: string[];
	author: {
		did: string;
		handle: string;
		displayName?: string;
		avatar?: string;
	};
};
