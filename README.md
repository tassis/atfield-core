# atfield-core

`atfield-core` provides framework-agnostic AT Protocol data primitives for atfield.

It contains reusable identity, DID, repository, transport, schema, and provider logic that can be used by endpoint kits, static-site integrations, admin tools, CLIs, or other JavaScript/TypeScript applications.

For a practical deployable example built on top of this package, see [`atfield-kit`](https://github.com/tassis/atfield-kit), a SvelteKit endpoint layer for exposing AT Protocol records as HTTP APIs.

## Install

```sh
npm install atfield-core
```

## What it provides

Current scope:

- DID-first identity resolution
- handle-to-DID resolution
- DID document fetching and parsing
- PDS endpoint discovery
- AT Protocol repo record reads
- generic XRPC / HTTP transport helpers
- lightweight schema decoding helpers
- provider helpers for supported AT Protocol applications

Supported provider modules:

- Bluesky profile and post helpers
- `site.standard.publication` and `site.standard.document` helpers
- WhiteWind article helpers

## Quick example

```ts
import { createCore } from 'atfield-core';

const core = createCore();

const identity = await core.identity.resolve({
	handle: 'example.bsky.social'
});

const profile = await core.providers.bsky.getProfile(identity);

const documents = await core.providers.standardsite.document.list(identity, {
	limit: 10
});

const firstDocument = documents.documents[0];

if (firstDocument?.content) {
	const markdown = core.providers.standardsite.content.renderMarkdown(firstDocument.content, {
		inlineStyle: 'markdown',
		mentionProfileBaseUrl: 'https://bsky.app/profile/'
	});
	console.log(markdown);
}

console.log(identity);
console.log(profile);
console.log(documents.documents[0]);
```

## Documentation

- [Getting started](./docs/getting-started.md)
- [Provider overview](./docs/providers.md)
- [Standard Site content normalization](./docs/standardsite-content-normalization.md)
- [Development and releases](./docs/development.md)

## Package role

`atfield-core` intentionally does not provide a web server, UI, admin console, CMS, editor, RSS generator, sitemap generator, or publishing frontend.

## License

MIT
