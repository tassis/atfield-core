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

export type RequestOptions = {
	url: URL | string;
	method?: string;
	headers?: HeadersInit;
	body?: BodyInit | null;
	init?: Omit<RequestInit, 'method' | 'headers' | 'body'>;
};

export type TransportResponse = {
	status: number;
	headers: Headers;
	text: string;
};
