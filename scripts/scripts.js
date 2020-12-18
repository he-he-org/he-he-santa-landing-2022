const esbuild = require('esbuild');
const path = require('path');

const {BUILD, SRC} = require('./common');

esbuild.build({
  entryPoints: [path.join(SRC, 'entry.ts')],
  bundle: true,
  outfile: path.join(BUILD, 'index.js'),
}).catch((e) => {
  console.error(e)
})
