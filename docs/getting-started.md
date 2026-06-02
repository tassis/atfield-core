# Getting Started

## Install

With Bun:

```sh
bun add atfield-core
```

With npm:

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

const transport = createTransport(fetch);
const identity = await resolveIdentity(transport, { handle: 'example.bsky.social' });

const documents = await standardSiteDocument.list(transport, identity, { limit: 10 });
const publication = await standardSitePublication.get(transport, identity);

const markdown = documents.documents[0]?.content
	? standardSiteContent.renderMarkdown(documents.documents[0].content)
	: undefined;
```

## Next reading

- [Provider overview](./providers.md)
- [Standard Site content normalization](./standardsite-content-normalization.md)
- [Development and releases](./development.md)
