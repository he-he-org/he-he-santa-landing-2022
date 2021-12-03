const fs = require('fs');
const {BUILD, CONTENT} = require('./common');

fs.mkdirSync(BUILD,{ recursive: true })
fs.mkdirSync(CONTENT,{ recursive: true })
