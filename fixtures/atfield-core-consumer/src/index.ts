import {
	createCore,
	defineSchema,
	getDidDocumentUrl,
	getHandleFromDidDocument
} from 'atfield-core';
import type { IdentityInput } from 'atfield-core';
import { getPdsUrlFromDidDocument } from 'atfield-core/did';
import { resolveIdentity } from 'atfield-core/identity';
import { getProfile } from 'atfield-core/providers/bsky';
import { publication as standardSitePublication } from 'atfield-core/providers/standardsite';
import { listArticles } from 'atfield-core/providers/whitewind';
import { listRecords } from 'atfield-core/repo';

const identityInput: IdentityInput = { did: 'did:plc:alice' };

void resolveIdentity;
void listRecords;
void getProfile;
void standardSitePublication;
void listArticles;
void identityInput;

const schema = defineSchema<string>({
	parse(input: unknown) {
		if (typeof input !== 'string') {
			throw new Error('Expected string');
		}

		return input;
	}
});

if (schema.parse('ok') !== 'ok') {
	throw new Error('Schema smoke test failed');
}

if (getDidDocumentUrl('did:plc:alice') !== 'https://plc.directory/did:plc:alice') {
	throw new Error('DID URL export is not working');
}

if (
	getHandleFromDidDocument({
		id: 'did:plc:alice',
		alsoKnownAs: ['at://alice.test']
	}) !== 'alice.test'
) {
	throw new Error('DID helper export is not working');
}

if (
	getPdsUrlFromDidDocument({
		id: 'did:plc:alice',
		service: [
			{
				id: '#atproto_pds',
				type: 'AtprotoPersonalDataServer',
				serviceEndpoint: 'https://pds.example.com'
			}
		]
	}) !== 'https://pds.example.com'
) {
	throw new Error('PDS helper export is not working');
}

const core = createCore();

if (typeof core.identity.resolve !== 'function') {
	throw new Error('Core identity client is not available');
}

if (typeof core.providers.bsky.getProfile !== 'function') {
	throw new Error('Bsky provider client is not available');
}

if (typeof core.providers.standardsite.publication.get !== 'function') {
	throw new Error('Standard Site provider client is not available');
}

if (typeof core.providers.whitewind.listArticles !== 'function') {
	throw new Error('Whitewind provider client is not available');
}

console.log('atfield-core packed consumer smoke test passed');
