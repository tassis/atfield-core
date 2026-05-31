## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Project Type**: framework-agnostic library

## Working Rules

- Treat this package as independent from the kit app in `../atfield-kit/` and as the package project under `../atfield-core/`.
- Prioritize project initialization and package boundaries before feature work.
- Avoid reading or scanning `node_modules/` unless the user explicitly asks.
- Keep `atfield-core` protocol-focused and framework-agnostic.
- Prefer DID-based internal APIs; accept handles only at identity-resolution boundaries.
- Prefer the package-internal `#core/*` alias over deep relative imports.
- Preserve bundled public entry outputs and public subpath API unless explicitly changing package surface.
