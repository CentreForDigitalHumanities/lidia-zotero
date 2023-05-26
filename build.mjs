import * as esbuild from 'esbuild';
import 'zotero-plugin/copy-assets.js';
import 'zotero-plugin/rdf.js';
import 'zotero-plugin/version.js';


async function build() {
    await esbuild.build({
        entryPoints: ['plugin/src/lib.js'],
        bundle: true,
        loader: { '.js': 'jsx' },
        outfile: 'plugin/out.js',
    })
}

build().catch(err => {
    console.log(err)
    process.exit(1)
})
