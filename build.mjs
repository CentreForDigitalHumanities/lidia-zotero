import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/lib.js'],
    bundle: true,
    outfile: 'out.js',
});
