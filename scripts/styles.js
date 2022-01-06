const sass = require('sass');
const path = require('path');
const fs = require('fs');
const {BUILD, SRC} = require('./common');

for (const entry of ['index', 'success', 'report']) {
  const result = sass.renderSync({ file: path.join(SRC, `${entry}.scss`)});
  fs.writeFileSync(path.join(BUILD, `${entry}.css`), result.css.toString())
}

