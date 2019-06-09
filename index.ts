#!/usr/bin/env node

import findYarnWorkspaceRoot = require('find-yarn-workspace-root2');
import yargs = require('yargs');
import crossSpawn = require('cross-spawn-extra');
import fs = require('fs-extra');
import path = require('path');
import getConfig, { parseStaticPackagesPaths } from 'workspaces-config';
import PackageJsonLoader from 'npm-package-json-loader';
import { updateNotifier } from '@yarn-tool/update-notifier';
import pkg = require( './package.json' );
import { copyStaticFiles, defaultCopyStaticFiles, getTargetDir } from './lib/index';
import setupToYargs from './lib/yargs-setting';
import { findRoot } from '@yarn-tool/find-root';
import { npmHostedGitInfo } from '@yarn-tool/pkg-git-info';

//updateNotifier(__dirname);

let cli = setupToYargs(yargs);

let argv = cli.argv._;

//console.dir(cli.argv);

let cwd = path.resolve(cli.argv.cwd || process.cwd());

let rootData = findRoot({
	cwd,
	skipCheckWorkspace: cli.argv.skipCheckWorkspace,
});

let hasWorkspace: string = rootData.ws;

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

fs.ensureDirSync(targetDir);

let flags = Object.keys(cli.argv)
	.reduce(function (a, f)
	{
		if (f === 'silent' || f === 'y' || f === 'yes')
		{

		}
		else if (/^[a-z]$/.test(f) && cli.argv[f])
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
	cli.argv.yes && '-y',
].filter(v => v);

//console.log(args);

let old_pkg_name: string;

if (cli.argv.yes && !targetName)
{
	try
	{
		let pkg = new PackageJsonLoader(path.join(targetDir, 'package.json'));

		old_pkg_name = pkg.data.name
	}
	catch (e)
	{

	}
}

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
		else if (cli.argv.yes && old_pkg_name && pkg.data.name != old_pkg_name)
		{
			pkg.data.name = old_pkg_name;
		}

		if (pkg.data.name && /^@/.test(pkg.data.name) && !pkg.data.publishConfig)
		{
			//pkg.data.publishConfig = {};
		}

		if (!pkg.data.scripts)
		{
			pkg.data.scripts = {};
		}

		if (!pkg.data.homepage || !pkg.data.bugs || !pkg.data.repository)
		{
			try
			{
				let info = npmHostedGitInfo(targetDir)

				// @ts-ignore
				pkg.data.homepage = pkg.data.homepage || info.homepage

				pkg.data.bugs = pkg.data.bugs || {
					url: info.bugs,
				}

				pkg.data.repository = pkg.data.repository || {
					"type": "git",
					url: info.repository,
				}
			}
			catch (e)
			{

			}
		}

		Object
			.entries({
				"lint": "npx eslint **/*.ts",
				"ncu": "npx yarn-tool ncu -u",
				"sort-package-json": "npx sort-package-json ./package.json",
				"prepublishOnly": "npm run ncu && npm run sort-package-json && npm run test",
				"postpublish": `git commit -m "publish new version" .`,
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

		pkg.writeOnlyWhenLoaded();

		try
		{
			let copyOptions: fs.CopyOptionsSync = {
				overwrite: false,
				preserveTimestamps: true,
				errorOnExist: false,
			};

			fs.copySync(path.join(__dirname, 'lib/static'), targetDir, copyOptions);
		}
		catch (e)
		{

		}

		copyStaticFiles(defaultCopyStaticFiles, {
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
else
{
	process.exitCode = 1;
}
