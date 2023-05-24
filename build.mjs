import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/lib.js'],
    bundle: true,
    loader: { '.js': 'jsx' },
    outfile: 'out.js',
    target: 'es2015'
});
