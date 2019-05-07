/**
 * Created by user on 2018/5/14/014.
 */

import findYarnWorkspaceRoot = require('find-yarn-workspace-root');
import yargs = require('yargs');
import crossSpawn = require('cross-spawn-extra');
import fs = require('fs-extra');
import path = require('path');
import getConfig, { parseStaticPackagesPaths } from 'workspaces-config';
import PackageJsonLoader from 'npm-package-json-loader';
import updateNotifier = require('update-notifier');
import pkg = require( './package.json' );
import { copyStaticFiles, getTargetDir } from './lib/index';

updateNotifier({ pkg }).notify();

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
		defaultDescription: process.cwd(),
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
	.option('sort', {
		type: 'boolean',
		default: true,
	})
	.option('private', {
		alias: ['p'],
		type: 'boolean',
	})
	.option('createModule', {
		alias: ['m'],
		type: 'string',
	})
	.option('name', {
		type: 'string',
	})
	.option('copyStatic', {
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

let workspacePrefix: string;

if (hasWorkspace)
{
	let ws = parseStaticPackagesPaths(getConfig(hasWorkspace));

	if (ws.prefix.length)
	{
		workspacePrefix = ws.prefix[0];
	}
}

let { targetDir, targetName } = getTargetDir({
	inputName: argv.length && argv[0],
	cwd,
	targetName: cli.argv.name || null,
	hasWorkspace,
	workspacePrefix,
});

/*

let targetDir: string;
let targetName: string = cli.argv.name || null;

if (argv.length)
{
	let name: string = argv[0];

	if (/^(?:@([^/]+?)[/])([^/]+)$/i.test(name))
	{
		targetName = targetName || name;
		name = name
			.replace(/[\/\\]+/g, '_')
			.replace(/^@/g, '')
		;
	}
	else if (/^[^/@]+$/i.test(name))
	{
		targetName = targetName || null;
	}
	else
	{
		targetName = targetName || null;
	}

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

*/

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
	cli.argv.createModule,
].filter(v => v);

//console.log(args);

let cp = crossSpawn.sync(cli.argv.npmClient, args, {
	stdio: 'inherit',
	cwd: targetDir,
});

if (!cp.error)
{
	let pkg = new PackageJsonLoader(path.join(targetDir, 'package.json'));

	if (pkg.exists())
	{
		if (cli.argv.p && cli.argv.npmClient != 'yarn')
		{
			pkg.data.private = true;
		}

		if (targetName && pkg.data.name != targetName)
		{
			pkg.data.name = targetName;
		}

		if (pkg.data.name && /^@/.test(pkg.data.name) && !pkg.data.publishConfig)
		{
			//pkg.data.publishConfig = {};
		}

		if (!pkg.data.scripts)
		{
			pkg.data.scripts = {};
		}

		Object
			.entries({
				"ncu": "npx npm-check-updates -u",
				"sort-package-json": "npx sort-package-json ./package.json",
				"prepublishOnly": "npm run ncu && npm run sort-package-json && npm run test",
				"coverage": "npx nyc npm run test",
				"test": "echo \"Error: no test specified\" && exit 1",
			})
			.forEach(([k, v]) =>
			{
				if (pkg.data.scripts[k] == null)
				{
					pkg.data.scripts[k] = v;
				}
			})
		;

		pkg.autofix();

		if (cli.argv.sort)
		{
			pkg.sort();
		}

		pkg.writeWhenLoaded();

		let copyOptions: fs.CopyOptionsSync = {
			overwrite: false,
			preserveTimestamps: true,
			errorOnExist: false,
		};

		try
		{
			fs.copySync(path.join(__dirname, 'lib/static'), targetDir, copyOptions);
		}
		catch (e)
		{

		}

		copyStaticFiles([

			['.npmignore', 'file/npmignore'],
			['.gitignore', 'file/gitignore'],

			['.nvmrc', 'file/nvmrc'],
			['.browserslistrc', 'file/browserslistrc'],

			['tsconfig.json.tpl', 'file/tsconfig.json.tpl', 'tsconfig.json'],

			['tsconfig.json.tpl', 'file/tsconfig.json.tpl', 'tsconfig.json'],

			['.eslintrc.json.tpl', 'file/eslintrc.json.tpl', '.eslintrc.json'],

		], {
			cwd: targetDir,
		});

		/*
		fs.copySync(path.join(__dirname, 'lib/file/npmignore'), path.join(targetDir, '.npmignore'), copyOptions);

		fs.copySync(path.join(__dirname, 'lib/file/gitignore'), path.join(targetDir, '.gitignore'), copyOptions);

		if (!fs.pathExistsSync(path.join(targetDir, 'tsconfig.json')))
		{
			fs.copySync(path.join(__dirname, 'lib/file/tsconfig.json.tpl'), path.join(targetDir, 'tsconfig.json.tpl'), copyOptions);
		}
		 */

	}
}
