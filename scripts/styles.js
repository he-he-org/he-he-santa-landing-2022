const sass = require('sass');
const path = require('path');
const fs = require('fs');
const {BUILD, SRC} = require('./common');

const result = sass.renderSync({ file: path.join(SRC, "entry.scss")});
fs.writeFileSync(path.join(BUILD, "index.css"), result.css.toString())
