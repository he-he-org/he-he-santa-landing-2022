const pug = require('pug');
const path = require('path');
const fs = require('fs');

const {ROOT, BUILD, LANGS, DEFAULT_LANG, readDotEnv} = require('./common');
readDotEnv();

const compiledFunction = pug.compileFile(path.join(ROOT, 'src', 'layout.pug'));

fs.mkdirSync(BUILD,{ recursive: true })
for (const lang of LANGS) {
  let dir = BUILD
  if (lang !== DEFAULT_LANG) {
    dir = path.join(BUILD, lang)
    fs.mkdirSync(dir, { recursive: true })
  }
  const data = require(path.join(ROOT, "content", `index.${lang}.json`))
  fs.writeFileSync(path.join(dir, "index.html"), compiledFunction({
    env: {
      LANGS,
      DEFAULT_LANG,
    },
    data,
  }))
}

