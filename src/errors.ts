export class CoreError extends Error {
	readonly cause?: unknown;

	constructor(message: string, options?: { cause?: unknown }) {
		super(message);
		this.name = 'CoreError';
		this.cause = options?.cause;
	}
}

export class HttpResponseError extends CoreError {
	readonly status: number;
	readonly body: string;

	constructor(message: string, status: number, body: string) {
		super(`${message}: ${status} ${body}`);
		this.name = 'HttpResponseError';
		this.status = status;
		this.body = body;
	}
}

export class SchemaParseError extends CoreError {
	readonly input: unknown;

	constructor(message: string, input: unknown, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'SchemaParseError';
		this.input = input;
	}
}
