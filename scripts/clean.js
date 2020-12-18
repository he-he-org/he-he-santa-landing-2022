const fs = require('fs');
const {BUILD} = require('./common');

fs.rmSync(BUILD, {
  recursive: true,
  force: true,
})
