# Changelog

## [0.2.0]

### Added

- Added vendor-aware `standardsite.content.normalize(...)` routing keyed by `content.$type`.
- Added shared normalized content metadata on `standardsite.document` outputs via `document.content`.
- Added `standardsite.content.renderMarkdown(...)` for rendering normalized shared content blocks to Markdown.
- Added `standardsite.content` rich text preservation for shared inline marks, links, and mentions.
- Added markdown render options such as `inlineStyle`, `mentionProfileBaseUrl`, and `preserveFallbackBlocksAsComments`.
- Added `skipped` metadata on normalized content results for recognized-but-intentionally-unparsed source containers.
- Added Leaflet content support for `pub.leaflet.content` linear-document extraction.
- Added normalized support for shared Leaflet block coverage including headings, paragraphs, blockquotes, lists, images, embeds, buttons, code, math, and dividers.
- Added markdown rendering tests covering UTF-8 byte-range handling, mixed-format degradation rules, mention links, and HTML inline mode.
- Added prerelease version helper via `bun run version:next`.
- Added CI verification through `bun run verify` and staged-file formatting via `lint-staged`.

### Changed

- Changed the `standardsite` provider surface to namespace-style module objects: `content`, `document`, `publication`, and `blob`.
- Changed `standardsite` content normalization from raw item-normalizer lookup to vendor-level extraction plus normalization.
- Changed `unsupported`, `unknown`, and `skipped` into distinct public result semantics with documented consumer guidance.
- Changed mention rendering in Markdown output to prefer handle-based profile links and fall back to DID-based profile links.
- Changed local and CI verification flow to consistently reference `bun run verify`.

### Removed

- Removed shared rich-text `anchorId` preservation from the normalized content model.

### Notes

- `pub.leaflet.blocks.page` and `pub.leaflet.blocks.poll` currently remain `type: 'unsupported'` and are intentionally preserved for client-side vendor-specific handling through `rawType`, `vendor`, and `raw`.
- Non-linear Leaflet pages such as `pub.leaflet.pages.canvas` are currently reported through `result.skipped` rather than normalized into shared content blocks.
