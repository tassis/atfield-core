import { describe, expect, test } from 'bun:test';

import { getProfile, mergeProfiles } from '#core/providers/bsky';
import type { CoreTransport } from '#core/transport';
import type { ResolvedIdentity } from '#core/types';

const identity: ResolvedIdentity = {
	did: 'did:plc:alice',
	handle: 'alice.test',
	pdsUrl: 'https://pds.example.com'
};

describe('bsky profile merge', () => {
	test('keeps repo presentation fields while taking appview counts', () => {
		expect(
			mergeProfiles(
				{
					did: 'did:plc:alice',
					handle: 'alice.test',
					displayName: 'Alice Repo',
					description: 'Repo bio',
					avatar: 'https://repo.example/avatar'
				},
				{
					did: 'did:plc:alice',
					handle: 'alice.bsky.social',
					displayName: 'Alice AppView',
					description: 'AppView bio',
					avatar: 'https://appview.example/avatar',
					followersCount: 10,
					followsCount: 5,
					postsCount: 3
				}
			)
		).toEqual({
			did: 'did:plc:alice',
			handle: 'alice.bsky.social',
			displayName: 'Alice Repo',
			description: 'Repo bio',
			avatar: 'https://repo.example/avatar',
			followersCount: 10,
			followsCount: 5,
			postsCount: 3
		});
	});

	test('getProfile falls back to repo profile when appview fails', async () => {
		const transport: CoreTransport = {
			request: async ({ url }) => {
				const value = String(url);

				if (value.includes('com.atproto.repo.getRecord')) {
					return { status: 200, headers: new Headers(), text: '' };
				}

				throw new Error(`Unexpected request: ${value}`);
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>({ url }: Parameters<CoreTransport['requestJson']>[0]) => {
				const value = String(url);

				if (value.includes('com.atproto.repo.getRecord')) {
					return {
						uri: 'at://did:plc:alice/app.bsky.actor.profile/self',
						cid: 'cid-profile',
						value: {
							displayName: 'Repo Alice',
							description: 'Repo bio',
							avatar: { ref: { $link: 'avatar-cid' } }
						}
					} as T;
				}

				if (value.includes('app.bsky.actor.getProfile')) {
					throw new Error('appview failed');
				}

				throw new Error(`Unexpected requestJson: ${value}`);
			}
		};

		const profile = await getProfile(transport, identity, {
			appViewUrl: 'https://public.api.bsky.app/xrpc'
		});

		expect(profile).toEqual({
			did: 'did:plc:alice',
			handle: 'alice.test',
			displayName: 'Repo Alice',
			description: 'Repo bio',
			avatar: 'https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aalice&cid=avatar-cid'
		});
	});

	test('getProfile merges appview profile when available', async () => {
		const transport: CoreTransport = {
			request: async ({ url }) => {
				const value = String(url);

				if (value.includes('com.atproto.repo.getRecord')) {
					return { status: 200, headers: new Headers(), text: '' };
				}

				throw new Error(`Unexpected request: ${value}`);
			},
			requestText: async () => {
				throw new Error('requestText should not be called');
			},
			requestJson: async <T>({ url }: Parameters<CoreTransport['requestJson']>[0]) => {
				const value = String(url);

				if (value.includes('com.atproto.repo.getRecord')) {
					return {
						uri: 'at://did:plc:alice/app.bsky.actor.profile/self',
						cid: 'cid-profile',
						value: {
							displayName: 'Repo Alice',
							description: 'Repo bio'
						}
					} as T;
				}

				if (value.includes('app.bsky.actor.getProfile')) {
					return {
						did: 'did:plc:alice',
						handle: 'alice.bsky.social',
						avatar: 'https://cdn.example/avatar',
						followersCount: 10,
						followsCount: 5,
						postsCount: 3
					} as T;
				}

				throw new Error(`Unexpected requestJson: ${value}`);
			}
		};

		const profile = await getProfile(transport, identity, {
			appViewUrl: 'https://public.api.bsky.app/xrpc'
		});

		expect(profile).toEqual({
			did: 'did:plc:alice',
			handle: 'alice.bsky.social',
			displayName: 'Repo Alice',
			description: 'Repo bio',
			avatar: 'https://cdn.example/avatar',
			followersCount: 10,
			followsCount: 5,
			postsCount: 3
		});
	});
});
