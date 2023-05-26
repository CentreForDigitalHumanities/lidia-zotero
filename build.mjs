import * as esbuild from 'esbuild';
import { promisify } from 'util';
import { execFile as execFileCb } from 'child_process';
import fs from 'fs-extra';
import 'zotero-plugin/copy-assets.js';
import 'zotero-plugin/rdf.js';
import 'zotero-plugin/version.js';


const execFile = promisify(execFileCb);

async function prebuild() {
    await execFile('python', ['vocabulary/vocabulary.py']);
}

async function build() {
    await esbuild.build({
        entryPoints: ['src/lib.js'],
        bundle: true,
        loader: { '.js': 'jsx' },
        outfile: 'build/out.js',
    });
    await fs.copy('bootstrap.js', 'build/bootstrap.js');
}

async function main() {
    try {
      await prebuild();
      await build();
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }

main();
