export type IdentityInput =
	| {
			did: string;
			handle?: string;
	  }
	| {
			handle: string;
			did?: string;
	  };

export type ResolvedIdentity = {
	did: string;
	handle?: string;
	pdsUrl: string;
};

export type DidDocument = {
	id: string;
	alsoKnownAs?: string[];
	service?: Array<{
		id?: string;
		type?: string;
		serviceEndpoint?: string;
	}>;
};

export type FetchLike = typeof fetch;
