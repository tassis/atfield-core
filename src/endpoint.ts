import type { Schema } from './schema';
import type { CoreTransport } from './transport';
import type { RequestOptions } from './types';

export function createJsonEndpoint<TParams, TResult>(options: {
	buildRequest(params: TParams): RequestOptions;
	schema: Schema<TResult>;
	fallbackMessage: string;
}) {
	return async (transport: CoreTransport, params: TParams): Promise<TResult> => {
		return transport.requestJson({
			...options.buildRequest(params),
			fallbackMessage: options.fallbackMessage,
			schema: options.schema
		});
	};
}

export function createTextEndpoint<TParams>(options: {
	buildRequest(params: TParams): RequestOptions;
	fallbackMessage: string;
}) {
	return async (transport: CoreTransport, params: TParams): Promise<string> => {
		return transport.requestText({
			...options.buildRequest(params),
			fallbackMessage: options.fallbackMessage
		});
	};
}
