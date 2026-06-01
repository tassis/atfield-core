## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Project Type**: framework-agnostic library

## Working Rules

- Prioritize project initialization and package boundaries before feature work.
- Avoid reading or scanning `node_modules/` unless the user explicitly asks.
- Keep `atfield-core` protocol-focused and framework-agnostic.
- Prefer DID-based internal APIs; accept handles only at identity-resolution boundaries.
- Prefer the package-internal `#core/*` alias over deep relative imports.
- Preserve bundled public entry outputs and public subpath API unless explicitly changing package surface.
- Pull requests should pass the CI verification suite before merge. Stable npm releases use `latest`, while prerelease test publishes should use `next` with versions shaped like `x.y.z-next.n`.

## Project Understanding

- `atfield-core` is a framework-agnostic AT Protocol data library, not an app/server/UI layer.
- The package is organized around a small set of reusable primitives: `transport`, `identity`, `did`, `repo`, and `providers`.
- `createCore()` is the main composition point. It wires a fetch-backed transport, service configuration, identity client, DID client, repo client, and provider clients.
- The intended internal data flow is DID-first: handle input is accepted at the identity boundary, then resolved into DID, DID document, and PDS URL before repo/provider access.
- `transport` is intentionally thin. It standardizes raw HTTP requests, text/JSON decoding, and error normalization through `HttpResponseError` and `SchemaParseError`.
- `did` is responsible for DID document fetching and parsing, including handle extraction from `alsoKnownAs` and PDS discovery from the `#atproto_pds` service entry.
- `repo` is a generic AT Protocol repo-read layer over XRPC endpoints like `com.atproto.repo.getRecord` and `com.atproto.repo.listRecords`.
- `providers` sit above `repo` and translate app-specific records into normalized library-friendly objects.
- Current provider coverage is:
  - Bluesky profile/post helpers
  - `site.standard.publication` and `site.standard.document` helpers
  - WhiteWind article helpers
- Bluesky profile reads combine repo-backed profile presentation fields with optional AppView-derived counts and metadata.
- Standard Site helpers validate record structure and normalize blobs, contributors, and refs into easier-to-consume output shapes.
- WhiteWind helpers add a visibility filter, defaulting to public-only reads unless explicitly widened to `all`.
- The package strongly values explicit package boundaries: public root exports, public subpath exports, and package-internal `#core/*` aliases are part of the intended architecture.
- Tests focus on contract behavior, URL construction, normalization, filtering, and fallback behavior more than broad end-to-end integration.

## Current Design Notes

- `standardsite` is moving toward a namespace-oriented API surface where the top-level module should mainly expose shared abstractions and composition points.
- `standardsite` currently groups public capabilities under namespaces such as `content`, `document`, `publication`, and `blob` to avoid long exported function names.
- Inside `standardsite`, files should prefer noun-oriented names. Thin sibling files that represent the same resource should usually be merged rather than split across verb-oriented filenames.
- `standardsite/content/` is the vendor-aware normalization subsystem. The top-level `standardsite` module should stay vendor-agnostic, while vendor-specific logic lives under `content/vendors/`.
- Content normalization is keyed by `content.$type`, not by guessing from individual blocks. This keeps vendor routing explicit and easier to extend.
- `standardsite.content` is now organized around vendor-level adapters rather than raw block-normalizer registries. A vendor is responsible for extracting logical blocks from its content container, then delegating per-block normalization.
- Supported `standardsite` content vendors currently include `app.offprint.content`, `blog.pckt.content`, and `pub.leaflet.content`.
- The shared `standardsite.content` block model is intentionally normalized across vendors. It should preserve structural meaning over vendor-specific naming.
- The current shared content model prioritizes block-level structure first: headings, paragraphs, blockquotes, callouts, lists, images, embeds, code, math, dividers, tables, and unknown blocks.
- `ListItem` is no longer text-only. It remains plaintext-first through `text`, but may also preserve richer non-list child structure through `blocks`, plus optional child items through `children`.
- `Image` has been widened to support cross-vendor fields such as blob-derived CID, direct source URL, dimensions, alt text, title, and alignment.
- Overlapping vendor embed concepts should be collapsed into shared semantic categories instead of preserving vendor-specific names. For example, bookmark/website/web-style blocks normalize to `embedType: 'link'`.
- `gallery` is currently normalized as `embedType: 'gallery'` rather than expanded into image blocks.
- `table` is part of the shared content abstraction because flattening tables into plaintext loses critical structure.
- `standardsite.content` now has a thin shared rich text layer for text-bearing blocks. It is plaintext-first and optional, preserving shared facet semantics through UTF-8 byte-range spans instead of a full inline AST.
- The current shared rich text model preserves common inline marks, links, and mentions across vendors while still deferring more vendor-specific inline semantics.
- When lexicon dumps and live records disagree, prefer compatibility with observed live record shapes. Treat lexicon JSON as guidance, not ground truth, and support both shapes when the compatibility cost is low.
- Known live-record drift examples include Offprint image-family blocks using `image` where lexicon snapshots may show `blob`, and pckt code blocks using `attrs.language` where schema snapshots may suggest top-level `language`.
- Content normalization is best-effort and warning-driven. Unsupported or invalid content should not fail the whole document; unknown blocks should fall back to `type: 'unknown'` with warnings.
- `pckt` is expected to be the most demanding `standardsite` content vendor and should be treated as the pressure test for whether the shared abstraction is complete enough.
- `leaflet` is the last planned `standardsite` content vendor and is the current pressure test for whether vendor-level extraction is the right abstraction boundary.
- `leaflet` currently confirms that vendor extraction must live above raw block normalizers because its content shape is `pages[].blocks[].block`, not `items[]`.
- `ListItem` remains a known future expansion point. `leaflet` in particular confirms that list items may need to preserve richer non-list child blocks such as headings and images, and may still need further expansion beyond the current `blocks` plus `children` model.
