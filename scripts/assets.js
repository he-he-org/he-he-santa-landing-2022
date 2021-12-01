const fs = require('fs');
const path = require('path');
const { SRC, BUILD } = require('./common');

fs.rmSync(path.join(BUILD, 'assets'), { recursive: true, force: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(path.join(SRC, 'assets'), path.join(BUILD, 'assets'))
