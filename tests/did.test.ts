import { describe, expect, test } from 'bun:test';

import { getHandleFromDidDocument, getPdsUrlFromDidDocument } from '#core/did';

describe('did document parsing', () => {
	test('extracts handle from alsoKnownAs', () => {
		expect(
			getHandleFromDidDocument({
				id: 'did:plc:alice',
				alsoKnownAs: ['at://alice.test']
			})
		).toBe('alice.test');
	});

	test('extracts pds url from atproto service entry', () => {
		expect(
			getPdsUrlFromDidDocument({
				id: 'did:plc:alice',
				service: [
					{
						id: '#atproto_pds',
						type: 'AtprotoPersonalDataServer',
						serviceEndpoint: 'https://pds.example.com'
					}
				]
			})
		).toBe('https://pds.example.com');
	});

	test('throws when pds service entry is missing', () => {
		expect(() => getPdsUrlFromDidDocument({ id: 'did:plc:alice' })).toThrow(
			'No atproto PDS service endpoint found'
		);
	});
});
