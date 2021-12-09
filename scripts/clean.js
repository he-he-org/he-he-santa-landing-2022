const fs = require('fs');
const {BUILD, CONTENT} = require('./common');

fs.rmSync(BUILD, {
  recursive: true,
  force: true,
})

