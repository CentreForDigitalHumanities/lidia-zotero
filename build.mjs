import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['plugin/src/lib.js'],
    bundle: true,
    loader: { '.js': 'jsx' },
    outfile: 'plugin/out.js',
});
