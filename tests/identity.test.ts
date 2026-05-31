import { describe, expect, test } from 'bun:test';

import { resolveIdentity } from '#core/identity';
import type { CoreTransport } from '#core/transport';

describe('resolveIdentity', () => {
	test('uses provided did and resolves handle/pds from did document', async () => {
		const transport: CoreTransport = {
			request: async () => {
				throw new Error('request should not be called directly');
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>({ url }: Parameters<CoreTransport['requestJson']>[0]) => {
				expect(String(url)).toBe('https://plc.directory/did:plc:alice');

				return {
					id: 'did:plc:alice',
					alsoKnownAs: ['at://alice.test'],
					service: [
						{
							id: '#atproto_pds',
							type: 'AtprotoPersonalDataServer',
							serviceEndpoint: 'https://pds.example.com'
						}
					]
				} as T;
			}
		};

		const resolvedIdentity = await resolveIdentity(transport, { did: 'did:plc:alice' });

		expect(resolvedIdentity).toEqual({
			did: 'did:plc:alice',
			handle: 'alice.test',
			pdsUrl: 'https://pds.example.com'
		});
	});
});
