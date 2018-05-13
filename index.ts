/**
 * Created by user on 2018/5/14/014.
 */

import * as findYarnWorkspaceRoot from 'find-yarn-workspace-root';
import * as yargs from 'yargs';
import * as crossSpawn from 'cross-spawn';
import * as fs from 'fs-extra';
import * as path from 'path';
import { sortPackageJson } from 'sort-package-json2';
import getConfig, { parseStaticPackagesPaths } from 'workspaces-config';

let cli = yargs
	.default({
		//input: process.cwd(),
	})
	.option('npmClient', {
		alias: ['N'],
		requiresArg: true,
		normalize: true,
		description: 'npm, yarn, ...etc',
		default: 'npm',
		type: 'string',
	})
	.option('yes', {
		alias: ['y'],
//		requiresArg: true,
//		default: 'npm',
		type: 'boolean',
	})
	.option('cwd', {
		alias: ['C'],
		requiresArg: true,
		normalize: true,
//		default: process.cwd(),
		defaultDescription: '.',
		type: 'string',
	})
	.option('skipCheckWorkspace', {
		alias: ['W'],
		type: 'boolean',
	})
	.option('force', {
		alias: ['f'],
		type: 'boolean',
	})
	.option('private', {
		alias: ['p'],
		type: 'boolean',
	})
;

let argv = cli.argv._;

let cwd = path.resolve(cli.argv.cwd || process.cwd());

let hasWorkspace: string;

if (!cli.argv.skipCheckWorkspace)
{
	hasWorkspace = findYarnWorkspaceRoot(cwd);
}

let targetDir: string;

if (argv.length)
{
	let name: string = argv[0];

	if (hasWorkspace)
	{
		let ws = parseStaticPackagesPaths(getConfig(hasWorkspace));

		if (ws.prefix.length)
		{
			name = path.join(hasWorkspace, ws.prefix[0], name);
		}
		else
		{
			throw new RangeError();
		}
	}

	targetDir = path.resolve(name);
}
else
{
	targetDir = cwd;
}

//console.log(targetDir);

fs.ensureDirSync(targetDir);

let flags = Object.keys(cli.argv)
	.reduce(function (a, f)
	{
		if (/^[a-z]$/.test(f) && cli.argv[f])
		{
			a.push(f);
		}

		return a;
	}, [])
	.join('')
;

let args = [
	'init',
	(flags && '-' + flags),
];

console.log(args);

crossSpawn.sync(cli.argv.npmClient, args, {
	stdio: 'inherit',
	cwd: targetDir,
});

{
	let pkg;
	let file = path.join(targetDir, 'package.json');

	if (fs.existsSync(file))
	{
		if (cli.argv.p && cli.argv.npmClient != 'yarn')
		{
			pkg = pkg || fs.readJSONSync(file);

			pkg.private = true;
		}

		if (cli.argv.sort)
		{
			pkg = pkg || fs.readJSONSync(file);

			pkg = sortPackageJson(pkg);
		}

		if (pkg)
		{
			fs.writeJSONSync(file, pkg, {
				spaces: 2,
			});
		}
	}
}
