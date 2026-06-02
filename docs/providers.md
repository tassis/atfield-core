# Provider Overview

`atfield-core` currently ships provider helpers for:

- Bluesky profile and post reads
- `site.standard.publication` and `site.standard.document`
- WhiteWind article reads

## Bluesky

Bluesky helpers provide normalized profile and post reads on top of DID-resolved repo access, with optional AppView-derived profile metadata.

## Standard Site

Standard Site helpers provide:

- publication reads
- document reads
- document normalization
- shared content normalization through `standardsite.content.normalize(...)`
- Markdown rendering through `standardsite.content.renderMarkdown(...)`

`standardsite.document` outputs may include normalized `content` when a document record carries vendor content.

Normalized content results include:

- `vendor`
- `contentType`
- `blocks`
- `warnings`
- `skipped`
- `fallbackText`

For the full content model, renderer behavior, and consumer guidance, see [Standard Site content normalization](./standardsite-content-normalization.md).

## WhiteWind

WhiteWind helpers provide normalized article reads, with visibility filtering that defaults to public-only records unless widened explicitly.
