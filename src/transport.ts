import { HttpResponseError, SchemaParseError } from './errors';
import type { Schema } from './schema';
import type { FetchLike, RequestOptions, TransportResponse } from './types';

export type CoreTransport = {
	request(options: RequestOptions): Promise<TransportResponse>;
	requestText(options: RequestOptions & { fallbackMessage: string }): Promise<string>;
	requestJson<T>(options: RequestOptions & { fallbackMessage: string; schema: Schema<T> }): Promise<T>;
};

export function createTransport(fetch: FetchLike): CoreTransport {
	return {
		async request(options) {
			const response = await fetch(options.url, {
				...options.init,
				method: options.method,
				headers: options.headers,
				body: options.body
			});

			return {
				status: response.status,
				headers: response.headers,
				text: await response.text()
			};
		},

		async requestText(options) {
			const response = await this.request(options);

			if (response.status < 200 || response.status >= 300) {
				throw new HttpResponseError(options.fallbackMessage, response.status, response.text);
			}

			return response.text;
		},

		async requestJson<T>(options: RequestOptions & { fallbackMessage: string; schema: Schema<T> }) {
			const text = await this.requestText(options);
			const input = JSON.parse(text) as unknown;

			try {
				return options.schema.parse(input);
			} catch (error) {
				throw new SchemaParseError('Failed to parse response schema', input, { cause: error });
			}
		}
	};
}
