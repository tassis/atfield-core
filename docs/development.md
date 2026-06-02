# Development

## Install dependencies

```sh
bun install
```

## Verification

Run the full verification suite with:

```sh
bun run verify
```

Commits format staged files through `lint-staged` and then run `bun run check` via Husky.

## Release channels

- Stable releases publish with the `latest` dist-tag and use normal versions like `0.2.0`.
- Prerelease test builds publish with the `next` dist-tag and use versions like `0.2.0-next.0`.

## Prerelease versioning

Bump the next prerelease version locally with:

```sh
bun run version:next
```

Install the prerelease channel with:

```sh
npm install atfield-core@next
```
