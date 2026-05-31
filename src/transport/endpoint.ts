import type { Schema } from '#core/schema';
import type { CoreTransport } from '#core/transport/create-transport';
import type { TransportRequestOptions } from '#core/transport/types';

export function createJsonEndpoint<TParams, TResult>(options: {
	buildRequest(params: TParams): TransportRequestOptions;
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
	buildRequest(params: TParams): TransportRequestOptions;
	fallbackMessage: string;
}) {
	return async (transport: CoreTransport, params: TParams): Promise<string> => {
		return transport.requestText({
			...options.buildRequest(params),
			fallbackMessage: options.fallbackMessage
		});
	};
}
