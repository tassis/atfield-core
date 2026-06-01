# Standard Site Content Normalization

This document describes how `atfield-core` normalizes `site.standard.document` content into the shared `standardsite.content` block model.

## Scope

Normalization lives under `src/providers/standardsite/content/`.

The top-level flow is:

1. Read `content.$type`
2. Select a vendor definition from `content/registry.ts`
3. Let the vendor extract its logical block list from the content container
4. Normalize each extracted block through the vendor's block normalizers
5. Return shared blocks plus warnings, optional skipped metadata, and optional fallback text

The current supported content vendors are:

- `app.offprint.content`
- `blog.pckt.content`
- `pub.leaflet.content`

## Shared Block Model

The shared model is defined in `src/providers/standardsite/content/types.ts`.

Current top-level block types:

- `heading`
- `paragraph`
- `blockquote`
- `callout`
- `list`
- `image`
- `embed`
- `code`
- `math`
- `divider`
- `table`
- `unsupported`
- `unknown`

Top-level result metadata:

- `vendor?`
- `contentType?`
- `blocks`
- `warnings`
- `skipped?`
- `fallbackText?`

Shared supporting shapes:

- `ListItem`
  - `text`
  - `blocks?`
  - `richText?`
  - `checked?`
  - `children?`
- `ListItemBlock`
  - a non-list shared block shape preserved inside a list item
  - currently used to retain richer vendor list-item content without promoting nested list blocks into the inline `blocks` field
- `RichText`
  - `text`
  - `spans?`
- `RichTextSpan`
  - `byteStart`
  - `byteEnd`
  - `marks?`
  - `link?`
  - `mention?`
- `Image`
  - `cid?`
  - `src?`
  - `mimeType?`
  - `width?`
  - `height?`
  - `alt?`
  - `title?`
  - `align?`
- `TableCell`
  - `text`
  - `header?`
  - `colspan?`
  - `rowspan?`
- `Vendor`
  - `extractBlocks(...)`
  - `normalizers`

Shared embed types are intentionally normalized across vendors:

- `link`
- `gallery`
- `bluesky-post`
- `button`

Shared rich text is intentionally thin and plaintext-first:

- `text` remains the stable fallback for all text-bearing blocks
- `richText` is optional and only included when inline semantics are preserved
- span offsets currently use UTF-8 byte offsets to match AT Protocol facet indexes
- the current shared inline model preserves common marks, links, and mentions

## Markdown Rendering

`standardsite.content.renderMarkdown(...)` renders shared content blocks into a Markdown document string.

The renderer stays markdown-first by default:

- `preserveFallbackBlocksAsComments` controls whether `unsupported` and `unknown` blocks emit HTML comments instead of disappearing from rendered Markdown
- `inlineStyle: 'markdown'` preserves markdown-safe inline formatting when possible
- complex overlapping or directly touching mixed rich-text spans may degrade to escaped plaintext for stability

When richer inline preservation is preferred, use:

```ts
standardsite.content.renderMarkdown(result, {
	inlineStyle: 'html',
	mentionProfileBaseUrl: 'https://bsky.app/profile/'
});
```

In `inlineStyle: 'html'` mode, rich-text inline segments render as inline HTML inside the Markdown document.

Current renderer boundary notes:

- `result.skipped` is diagnostic metadata and does not render into Markdown output
- shared rich-text `mention` metadata renders to profile links in Markdown output, preferring `mention.handle` and falling back to `mention.did`
- `mentionProfileBaseUrl` defaults to `https://bsky.app/profile/` and controls the rendered mention destination base URL

## Warning Model

Normalization is best-effort and should not fail the whole document for a single unsupported block.

Warnings may use these codes:

- `invalid_content`
- `invalid_items`
- `invalid_block`
- `unsupported_block`
- `unsupported_content`

When normalization intentionally skips a higher-level source container instead of a block, the result may include:

```ts
{
  skipped: [
    {
      kind: string,
      vendor?: string,
      reason: string,
      rawType?: string,
      path: string,
      raw: unknown
    }
  ]
}
```

This is used when the source shape is recognized but intentionally outside the currently normalized shared model. It lets consumers detect content that was deliberately not parsed.

When a block cannot be normalized, the result falls back to:

```ts
{
  type: 'unknown',
  rawType?: string,
  raw: unknown
}
```

## Consumer Decision Guide

Consumers should treat `unsupported`, `unknown`, and `skipped` as different signals:

### `type: 'unsupported'`

Meaning:

- the source block shape was recognized
- the block had a concrete `rawType`
- `atfield-core` intentionally does not map it into the current shared block model yet

Recommended consumer behavior:

- keep rendering the rest of the document normally
- optionally log or surface the `rawType` for observability
- if your application has vendor-specific knowledge, you may inspect `raw` and apply a local fallback
- treat `unsupported` as the intended extension point when you want to layer vendor-specific parsing on top of the shared model
- do not treat this as malformed data

`unsupported` is intentionally not a dead end. The preserved `rawType`, `vendor`, and `raw` payload let downstream clients recover the original vendor block and apply their own richer parsing when needed.

Typical examples:

- `pub.leaflet.blocks.page`
- `pub.leaflet.blocks.poll`

### `type: 'unknown'`

Meaning:

- the block could not be parsed into a valid typed shape
- the block may be malformed, missing `$type`, or structurally invalid for the current normalizer

Recommended consumer behavior:

- treat this as lower-confidence data than `unsupported`
- keep rendering the rest of the document normally
- log it as unexpected input if your application needs ingestion diagnostics
- avoid assuming vendor-specific semantics from `raw`

### `result.skipped[]`

Meaning:

- the content container was recognized
- a higher-level source container was intentionally not traversed into shared blocks
- this is not a block-level parse failure

Recommended consumer behavior:

- treat `skipped` as diagnostic coverage metadata
- use it to explain why some source content is not present in `blocks`
- do not confuse it with a malformed record or a block-level unsupported case
- if you present coverage/debug info to users or editors, `skipped` is the right place to point to intentionally unparsed sections

Typical example:

- `pub.leaflet.pages.canvas` skipped because only `pub.leaflet.pages.linearDocument` currently normalizes into shared blocks

## Offprint Rules

Source content type:

- `app.offprint.content`

Vendor implementation:

- `src/providers/standardsite/content/vendors/offprint.ts`

Current block mappings:

- `app.offprint.block.heading` -> `heading`
- `app.offprint.block.text` -> `paragraph`
- `app.offprint.block.blockquote` -> `blockquote`
- `app.offprint.block.callout` -> `callout`
- `app.offprint.block.bulletList` -> `list(style: 'bullet')`
- `app.offprint.block.orderedList` -> `list(style: 'ordered')`
- `app.offprint.block.taskList` -> `list(style: 'task')`
- `app.offprint.block.image` -> `image(layout: 'single')`
- `app.offprint.block.imageGrid` -> `image(layout: 'grid')`
- `app.offprint.block.imageCarousel` -> `image(layout: 'carousel')`
- `app.offprint.block.imageDiff` -> `image(layout: 'diff')`
- `app.offprint.block.webBookmark` -> `embed(embedType: 'link')`
- `app.offprint.block.webEmbed` -> `embed(embedType: 'link')`
- `app.offprint.block.button` -> `embed(embedType: 'button')`
- `app.offprint.block.blueskyPost` -> `embed(embedType: 'bluesky-post')`
- `app.offprint.block.codeBlock` -> `code`
- `app.offprint.block.mathBlock` -> `math`
- `app.offprint.block.horizontalRule` -> `divider`

Offprint-specific notes:

- List items are normalized from the vendor's nested list structure into shared `ListItem.text`, optional `blocks`, and optional `children`.
- Images accept both live `image`-shaped records and lexicon-style `blob`-shaped records, plus aspect ratio values when present.
- Offprint text-bearing blocks now attach optional shared `richText` when inline facets are present.
- Offprint `webMention` currently collapses to a shared link span.
- Offprint uses the default `content.items[]` vendor extraction path.

## pckt Rules

Source content type:

- `blog.pckt.content`

Vendor implementation:

- `src/providers/standardsite/content/vendors/pckt.ts`

Current block mappings:

- `blog.pckt.block.heading` -> `heading`
- `blog.pckt.block.text` -> `paragraph`
- `blog.pckt.block.blockquote` -> `blockquote`
- `blog.pckt.block.bulletList` -> `list(style: 'bullet')`
- `blog.pckt.block.orderedList` -> `list(style: 'ordered')`
- `blog.pckt.block.taskList` -> `list(style: 'task')`
- `blog.pckt.block.image` -> `image(layout: 'single')`
- `blog.pckt.block.website` -> `embed(embedType: 'link')`
- `blog.pckt.block.iframe` -> `embed(embedType: 'link')`
- `blog.pckt.block.gallery` -> `embed(embedType: 'gallery')`
- `blog.pckt.block.blueskyEmbed` -> `embed(embedType: 'bluesky-post')`
- `blog.pckt.block.codeBlock` -> `code`
- `blog.pckt.block.horizontalRule` -> `divider`
- `blog.pckt.block.table` -> `table`

pckt-specific notes:

- `website` and `iframe` are intentionally collapsed into the shared `link` embed type.
- `gallery` is intentionally kept as an embed reference instead of being expanded into image blocks.
- Table rows and cells are preserved in the shared `table.rows[].cells[]` structure.
- Image data is read from `attrs`, including URL, blob metadata, aspect ratio, alt text, title, and alignment.
- List and task content may contain richer nested block arrays. The shared model now preserves non-list item content blocks in `ListItem.blocks` while still keeping `ListItem.text` as the plaintext fallback.
- pckt text-bearing blocks now attach optional shared `richText` when inline facets are present.
- pckt `didMention` and `atMention` facets normalize to shared mention span fields.
- pckt currently uses the default `content.items[]` vendor extraction path.

## Leaflet Rules

Source content type:

- `pub.leaflet.content`

Vendor implementation:

- `src/providers/standardsite/content/vendors/leaflet.ts`

Container extraction notes:

- Leaflet content is extracted from `content.pages[]`, not `content.items[]`.
- Only `pub.leaflet.pages.linearDocument` pages are normalized into shared blocks.
- For linear documents, the logical content blocks are read from `pages[].blocks[].block`.
- Non-linear page types such as `pub.leaflet.pages.canvas` are currently skipped and recorded in `result.skipped`.

Current block mappings:

- `pub.leaflet.blocks.header` -> `heading`
- `pub.leaflet.blocks.text` -> `paragraph`
- `pub.leaflet.blocks.blockquote` -> `blockquote`
- `pub.leaflet.blocks.unorderedList` -> `list(style: 'bullet')`
- `pub.leaflet.blocks.orderedList` -> `list(style: 'ordered')`
- `pub.leaflet.blocks.image` -> `image(layout: 'single')`
- `pub.leaflet.blocks.website` -> `embed(embedType: 'link')`
- `pub.leaflet.blocks.button` -> `embed(embedType: 'button')`
- `pub.leaflet.blocks.iframe` -> `embed(embedType: 'link')`
- `pub.leaflet.blocks.bskyPost` -> `embed(embedType: 'bluesky-post')`
- `pub.leaflet.blocks.code` -> `code`
- `pub.leaflet.blocks.math` -> `math`
- `pub.leaflet.blocks.horizontalRule` -> `divider`

Leaflet-specific notes:

- `page` and `poll` style blocks are currently treated as unsupported blocks and normalize to `type: 'unsupported'`.
- Leaflet list items can carry richer block content such as headings and images. The shared model now preserves those non-list blocks in `ListItem.blocks`, while nested lists continue to normalize through `ListItem.children`.

## Intentional Gaps

The shared normalization layer is intentionally conservative.

Not yet fully normalized into shared structures:

- vendor-specific inline features beyond the shared marks/link/mention subset
- mention-specific inline nodes
- content blob dereferencing for external large-content modes
- vendor-specific gallery expansion
- vendor-specific iframe semantics beyond shared `link`

These can be added later if the shared consumer needs become clear.
