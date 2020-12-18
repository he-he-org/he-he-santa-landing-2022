const pug = require('pug');
const path = require('path');
const fs = require('fs');

const {ROOT, BUILD, readDotEnv} = require('./common');
readDotEnv();

console.log("process.env", process.env.CONTENTFUL_STATIC_TEXT_ID)

// Compile the source code
const compiledFunction = pug.compileFile(path.join(ROOT, 'src', 'layout.pug'));

fs.mkdirSync(BUILD,{ recursive: true })

fs.writeFileSync(path.join(BUILD, "index.html"), compiledFunction())
