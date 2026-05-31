type StandardSiteBlob = {
	ref?: {
		$link?: string;
	};
	mimeType?: string;
	size?: number;
};

export type StandardSitePublicationRecord = {
	$type?: 'site.standard.publication' | 'site.standard.publication#main';
	name: string;
	url: string;
	description?: string;
	icon?: StandardSiteBlob;
	preferences?: {
		$type?: 'site.standard.publication#preferences';
		showInDiscover?: boolean;
	};
	basicTheme?: Record<string, unknown>;
};

export type StandardSiteContributor = {
	did: string;
	displayName?: string;
	role?: string;
};

export type StandardSiteDocumentRecord = {
	$type?: 'site.standard.document' | 'site.standard.document#main';
	title: string;
	publishedAt: string;
	site: string;
	path?: string;
	description?: string;
	tags?: string[];
	textContent?: string;
	updatedAt?: string;
	coverImage?: StandardSiteBlob;
	bskyPostRef?: {
		uri: string;
		cid: string;
	};
	contributors?: Array<{
		$type?: 'site.standard.document#contributor';
		did: string;
		displayName?: string;
		role?: string;
	}>;
	content?: unknown;
	links?: unknown[];
};

export type StandardSitePublication = {
	uri: string;
	rkey: string;
	cid: string;
	name: string;
	url: string;
	description?: string;
	icon?: string;
	showInDiscover?: boolean;
	author: {
		did: string;
		handle?: string;
	};
};

export type StandardSiteDocument = {
	uri: string;
	rkey: string;
	cid: string;
	title: string;
	site: string;
	publishedAt: string;
	path?: string;
	description?: string;
	tags?: string[];
	textContent?: string;
	updatedAt?: string;
	coverImage?: string;
	bskyPostUri?: string;
	contributors?: StandardSiteContributor[];
	author: {
		did: string;
		handle?: string;
	};
};

export function parseStandardSitePublicationRecord(input: unknown): StandardSitePublicationRecord {
	if (typeof input !== 'object' || input === null) {
		throw new Error('Expected Standard Site publication record object');
	}

	const record = input as Record<string, unknown>;

	if (
		record.$type !== undefined &&
		record.$type !== 'site.standard.publication' &&
		record.$type !== 'site.standard.publication#main'
	) {
		throw new Error('Invalid Standard Site publication record type');
	}

	assertString(record.name, 'name');
	assertString(record.url, 'url');
	assertOptionalString(record.description, 'description');
	assertOptionalBlob(record.icon, 'icon');
	assertOptionalPublicationPreferences(record.preferences);

	if (
		record.basicTheme !== undefined &&
		(typeof record.basicTheme !== 'object' || record.basicTheme === null || Array.isArray(record.basicTheme))
	) {
		throw new Error('Invalid Standard Site publication field: basicTheme');
	}

	return record as StandardSitePublicationRecord;
}

export function parseStandardSiteDocumentRecord(input: unknown): StandardSiteDocumentRecord {
	if (typeof input !== 'object' || input === null) {
		throw new Error('Expected Standard Site document record object');
	}

	const record = input as Record<string, unknown>;

	if (
		record.$type !== undefined &&
		record.$type !== 'site.standard.document' &&
		record.$type !== 'site.standard.document#main'
	) {
		throw new Error('Invalid Standard Site document record type');
	}

	assertString(record.title, 'title');
	assertString(record.publishedAt, 'publishedAt');
	assertString(record.site, 'site');
	assertOptionalString(record.path, 'path');
	assertOptionalString(record.description, 'description');
	assertOptionalString(record.textContent, 'textContent');
	assertOptionalString(record.updatedAt, 'updatedAt');
	assertOptionalBlob(record.coverImage, 'coverImage');
	assertOptionalStringArray(record.tags, 'tags');
	assertOptionalStrongRef(record.bskyPostRef, 'bskyPostRef');
	assertOptionalContributors(record.contributors);

	if (record.links !== undefined && !Array.isArray(record.links)) {
		throw new Error('Invalid Standard Site document field: links');
	}

	return record as StandardSiteDocumentRecord;
}

export function getStandardSiteBlobCid(blob: StandardSiteBlob | undefined) {
	return blob?.ref?.$link;
}

function assertString(value: unknown, field: string) {
	if (typeof value !== 'string') {
		throw new Error(`Invalid Standard Site field: ${field}`);
	}
}

function assertOptionalString(value: unknown, field: string) {
	if (value !== undefined && typeof value !== 'string') {
		throw new Error(`Invalid Standard Site field: ${field}`);
	}
}

function assertOptionalStringArray(value: unknown, field: string) {
	if (value !== undefined && (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string'))) {
		throw new Error(`Invalid Standard Site field: ${field}`);
	}
}

function assertOptionalBlob(value: unknown, field: string) {
	if (value === undefined) {
		return;
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`Invalid Standard Site field: ${field}`);
	}

	const blob = value as Record<string, unknown>;

	if (blob.ref !== undefined) {
		if (typeof blob.ref !== 'object' || blob.ref === null || Array.isArray(blob.ref)) {
			throw new Error(`Invalid Standard Site field: ${field}.ref`);
		}

		const ref = blob.ref as Record<string, unknown>;
		if (ref.$link !== undefined && typeof ref.$link !== 'string') {
			throw new Error(`Invalid Standard Site field: ${field}.ref.$link`);
		}
	}

	if (blob.mimeType !== undefined && typeof blob.mimeType !== 'string') {
		throw new Error(`Invalid Standard Site field: ${field}.mimeType`);
	}

	if (blob.size !== undefined && typeof blob.size !== 'number') {
		throw new Error(`Invalid Standard Site field: ${field}.size`);
	}
}

function assertOptionalPublicationPreferences(value: unknown) {
	if (value === undefined) {
		return;
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('Invalid Standard Site publication field: preferences');
	}

	const preferences = value as Record<string, unknown>;

	if (
		preferences.$type !== undefined &&
		preferences.$type !== 'site.standard.publication#preferences'
	) {
		throw new Error('Invalid Standard Site publication preferences type');
	}

	if (
		preferences.showInDiscover !== undefined &&
		typeof preferences.showInDiscover !== 'boolean'
	) {
		throw new Error('Invalid Standard Site publication field: preferences.showInDiscover');
	}
}

function assertOptionalStrongRef(value: unknown, field: string) {
	if (value === undefined) {
		return;
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`Invalid Standard Site field: ${field}`);
	}

	const ref = value as Record<string, unknown>;
	assertString(ref.uri, `${field}.uri`);
	assertString(ref.cid, `${field}.cid`);
}

function assertOptionalContributors(value: unknown) {
	if (value === undefined) {
		return;
	}

	if (!Array.isArray(value)) {
		throw new Error('Invalid Standard Site document field: contributors');
	}

	for (const contributor of value) {
		if (typeof contributor !== 'object' || contributor === null || Array.isArray(contributor)) {
			throw new Error('Invalid Standard Site document contributor');
		}

		const record = contributor as Record<string, unknown>;
		if (
			record.$type !== undefined &&
			record.$type !== 'site.standard.document#contributor'
		) {
			throw new Error('Invalid Standard Site document contributor type');
		}

		assertString(record.did, 'contributors.did');
		assertOptionalString(record.displayName, 'contributors.displayName');
		assertOptionalString(record.role, 'contributors.role');
	}
}
