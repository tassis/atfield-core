import { readFile, writeFile } from 'node:fs/promises';

const packageJsonPath = new URL('../package.json', import.meta.url);
const dryRun = process.argv.includes('--dry-run');

const source = await readFile(packageJsonPath, 'utf8');
const pkg = JSON.parse(source);

if (typeof pkg.version !== 'string') {
	throw new Error('package.json version must be a string');
}

const nextVersion = bumpNextVersion(pkg.version);

if (!dryRun) {
	pkg.version = nextVersion;
	await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, '\t')}\n`);
}

console.log(`${dryRun ? 'Would bump' : 'Bumped'} version: ${pkg.version} -> ${nextVersion}`);

function bumpNextVersion(version) {
	const nextMatch = version.match(/^(\d+)\.(\d+)\.(\d+)-next\.(\d+)$/);
	if (nextMatch) {
		const [, major, minor, patch, prerelease] = nextMatch;
		return `${major}.${minor}.${patch}-next.${Number(prerelease) + 1}`;
	}

	const stableMatch = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (stableMatch) {
		const [, major, minor, patch] = stableMatch;
		return `${major}.${minor}.${Number(patch) + 1}-next.0`;
	}

	throw new Error(`Unsupported version format: ${version}. Expected x.y.z or x.y.z-next.n.`);
}
