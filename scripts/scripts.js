const esbuild = require('esbuild');
const path = require('path');

const { BUILD, SRC, LANGS, DEFAULT_LANG, readDotEnv } = require('./common');

readDotEnv()

const ENTRIES = ['index', 'report']
for (const entry of ENTRIES) {
  esbuild.build({
    entryPoints: [path.join(SRC, `${entry}.ts`)],
    bundle: true,
    outfile: path.join(BUILD, `${entry}.js`),
    define: {
      STRIPE_PUBLISHABLE_KEY: `"${process.env.STRIPE_PUBLISHABLE_KEY}"`,
      LANGS: JSON.stringify(LANGS),
      DEFAULT_LANG: JSON.stringify(DEFAULT_LANG),
    },
  }).catch((e) => {
    console.error(e)
  })
}

