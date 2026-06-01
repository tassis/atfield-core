# atfield-core

`atfield-core` provides framework-agnostic AT Protocol data primitives for ATField.

It contains reusable identity, DID, repository, transport, schema, and provider logic that can be used by endpoint kits, static-site integrations, admin tools, CLIs, or other JavaScript/TypeScript applications.

For a deployable SvelteKit endpoint provider built on top of this package, see [`atfield-kit`](https://github.com/tassis/atfield-kit).

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

## Install

```sh
bun add atfield-core
```

Or with npm:

```sh
npm install atfield-core
```

## Basic usage

```ts
import { createCore } from 'atfield-core';

const core = createCore();

const identity = await core.identity.resolveIdentity({
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
console.log(documents);
```

## Subpath imports

`atfield-core` exposes subpath entrypoints for applications that only need part of the package:

```ts
import { createTransport } from 'atfield-core/transport';
import { resolveIdentity } from 'atfield-core/identity';
import { getDidDocument } from 'atfield-core/did';
import { listRecords } from 'atfield-core/repo';

import { listPosts } from 'atfield-core/providers/bsky';
import {
	content as standardSiteContent,
	document as standardSiteDocument,
	publication as standardSitePublication
} from 'atfield-core/providers/standardsite';
import { listArticles } from 'atfield-core/providers/whitewind';

const documents = await standardSiteDocument.list(transport, identity, { limit: 10 });
const publication = await standardSitePublication.get(transport, identity);

const markdown = documents.documents[0]?.content
	? standardSiteContent.renderMarkdown(documents.documents[0].content)
	: undefined;
```

`standardsite.document` outputs now include normalized shared `content` results when a document record carries vendor content. The normalized content result includes:

- `vendor` (for example `offprint`, `pckt`, or `leaflet`)
- `contentType` (the raw source NSID)
- `blocks`
- `warnings`
- `skipped` (recognized-but-intentionally-unparsed containers such as unsupported Leaflet page types)
- `fallbackText`

See `docs/standardsite-content-normalization.md` for consumer guidance on handling `unsupported`, `unknown`, and `skipped` states.

## Package role

`atfield-core` intentionally does not provide a web server, UI, admin console, CMS, editor, RSS generator, sitemap generator, or publishing frontend.

## Development

Install dependencies:

```sh
bun install
```

Run the full verification suite:

```sh
bun run verify
```

Commits automatically format staged files through `lint-staged` and then run `bun run check` via Husky.

### Release channels

- Stable releases publish with the `latest` dist-tag and use normal versions like `0.1.2`.
- Prerelease test builds publish with the `next` dist-tag and should use versions like `0.1.2-next.0`.
- Bump the next prerelease version locally with:

```sh
bun run version:next
```

- Install the prerelease channel with:

```sh
npm install atfield-core@next
```

## License

MIT
