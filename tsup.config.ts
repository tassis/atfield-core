import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		transport: 'src/transport/index.ts',
		identity: 'src/identity/index.ts',
		did: 'src/did/index.ts',
		repo: 'src/repo/index.ts',
		'providers/bsky': 'src/providers/bsky/index.ts',
		'providers/whitewind': 'src/providers/whitewind/index.ts'
	},
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	target: 'es2022'
});
