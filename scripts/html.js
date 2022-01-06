const pug = require('pug');
const path = require('path');
const fs = require('fs');

const { ROOT, SRC, BUILD, LANGS, DEFAULT_LANG, readDotEnv } = require('./common');
readDotEnv();

const pages = []

for (const lang of LANGS) {
  pages.push({
    lang,
    outputDir: lang === DEFAULT_LANG ? BUILD : path.join(BUILD, lang),
    fn: pug.compileFile(path.join(SRC, `index.pug`)),
  })
  pages.push({
    lang,
    outputDir: lang === DEFAULT_LANG ? path.join(BUILD, "success") : path.join(BUILD, lang, "success"),
    fn: pug.compileFile(path.join(SRC, `success.pug`)),
  })
  pages.push({
    lang,
    outputDir: lang === DEFAULT_LANG ? path.join(BUILD, "report") : path.join(BUILD, lang, "report"),
    fn: pug.compileFile(path.join(SRC, `report.pug`)),
  })
}

fs.mkdirSync(BUILD, { recursive: true })
for (const { outputDir, fn, lang } of pages) {
  const data = require(path.join(ROOT, "content", `index.${lang}.json`))
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, `index.html`), fn({
    env: {
      LANGS,
      DEFAULT_LANG,
    },
    currentLang: lang,
    data,
  }))
}
