export type TransportRequestOptions = {
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
