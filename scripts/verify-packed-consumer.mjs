import { mkdtemp, readdir, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const currentDir = dirname(fileURLToPath(import.meta.url));
const coreRoot = resolve(currentDir, '..');
const fixtureTemplateDir = resolve(coreRoot, 'fixtures/atfield-core-consumer');

const tempDir = await mkdtemp(join(tmpdir(), 'atfield-core-packed-consumer-'));

try {
	run('bun', ['run', 'build'], coreRoot);
	run('npm', ['pack', '--pack-destination', tempDir], coreRoot);

	const tarball = await findTarball(tempDir);
	const consumerDir = join(tempDir, 'consumer');

	await cp(fixtureTemplateDir, consumerDir, { recursive: true });

	run('bun', ['install'], consumerDir);
	run('bun', ['add', '--exact', tarball], consumerDir);
	run('bun', ['run', 'check'], consumerDir);
	run('bun', ['run', 'build'], consumerDir);
	run('bun', ['run', 'smoke'], consumerDir);
} finally {
	await rm(tempDir, { recursive: true, force: true });
}

function run(command, args, cwd) {
	execFileSync(command, args, {
		cwd,
		stdio: 'inherit',
		env: process.env
	});
}

async function findTarball(directory) {
	const entries = await readdir(directory);
	const tarball = entries.find((entry) => entry.endsWith('.tgz'));

	if (!tarball) {
		throw new Error('Packed tarball was not created');
	}

	return join(directory, tarball);
}
