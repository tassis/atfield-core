import { HttpResponseError, SchemaParseError } from '#core/errors';
import type { Schema } from '#core/schema';
import type { FetchLike } from '#core/types';
import type { TransportRequestOptions, TransportResponse } from '#core/transport/types';

export type CoreTransport = {
	request(options: TransportRequestOptions): Promise<TransportResponse>;
	requestText(options: TransportRequestOptions & { fallbackMessage: string }): Promise<string>;
	requestJson<T>(
		options: TransportRequestOptions & { fallbackMessage: string; schema: Schema<T> }
	): Promise<T>;
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

		async requestJson<T>(
			options: TransportRequestOptions & { fallbackMessage: string; schema: Schema<T> }
		) {
			const text = await this.requestText(options);

			let input: unknown;

			try {
				input = JSON.parse(text) as unknown;
			} catch (error) {
				throw new SchemaParseError('Failed to parse JSON response', text, { cause: error });
			}

			try {
				return options.schema.parse(input);
			} catch (error) {
				throw new SchemaParseError('Failed to parse response schema', input, { cause: error });
			}
		}
	};
}
