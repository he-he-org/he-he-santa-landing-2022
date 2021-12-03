const fs = require('fs');
const {BUILD, CONTENT} = require('./common');

fs.rmSync(BUILD, {
  recursive: true,
  force: true,
})

fs.rmSync(CONTENT, {
  recursive: true,
  force: true,
})
