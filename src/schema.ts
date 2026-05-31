export type Schema<T> = {
	parse(input: unknown): T;
};

export function defineSchema<T>(schema: Schema<T>) {
	return schema;
}

export const unknownSchema = defineSchema<unknown>({
	parse(input) {
		return input;
	}
});
