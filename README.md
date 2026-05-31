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
- `site.standard.document` helpers
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

const documents = await core.providers.standardsite.listDocuments(identity, {
	limit: 10
});

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
import { listDocuments } from 'atfield-core/providers/standardsite';
import { listArticles } from 'atfield-core/providers/whitewind';
```

## Package role

`atfield-core` intentionally does not provide a web server, UI, admin console, CMS, editor, RSS generator, sitemap generator, or publishing frontend.

## Development

Install dependencies:

```sh
bun install
```

Run checks:

```sh
bun run check
bun run lint
bun test
bun run build
```

Verify packed package consumption:

```sh
bun run verify:packed-consumer
```

## License

MIT

