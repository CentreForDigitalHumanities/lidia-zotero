import * as esbuild from 'esbuild';
import fs from 'fs-extra';
import 'zotero-plugin/copy-assets.js';
import 'zotero-plugin/rdf.js';
import 'zotero-plugin/version.js';

async function build() {
    await esbuild.build({
        entryPoints: ['src/lib.js'],
        bundle: true,
        loader: { '.js': 'jsx' },
        outfile: 'build/out.js',
    });
    await fs.copy('bootstrap.js', 'build/bootstrap.js');
}

build().catch(err => {
    console.log(err)
    process.exit(1)
})
