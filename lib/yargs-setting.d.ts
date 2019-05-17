/**
 * Created by user on 2019/5/16.
 */
import yargs = require('yargs');
import { Argv } from 'yargs';
export declare function setupToYargs<T extends any>(yargs: Argv<T>): yargs.Argv<yargs.Omit<yargs.Omit<T, never>, "npmClient"> & {
    npmClient: string;
} & {
    yes: boolean;
} & {
    cwd: string;
} & {
    skipCheckWorkspace: boolean;
} & {
    force: boolean;
} & {
    sort: boolean;
} & {
    private: boolean;
} & {
    createModule: string;
} & {
    name: string;
} & {
    copyStatic: boolean;
}>;
export default setupToYargs;
