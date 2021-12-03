const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, "..");
const BUILD = path.join(ROOT, "build");
const SRC = path.join(ROOT, "src");
const LANGS = ["ru", "en", "es"];
const DEFAULT_LANG = "ru";

function readDotEnv() {
  let mergedConfig = {};
  for (const file of [".env.default", ".env"]) {
    const filePath = path.resolve(ROOT, file);
    if (fs.existsSync(filePath)) {
      const pairs = fs
        .readFileSync(filePath)
        .toString()
        .split(/\r?\n/)
        .filter(line => line !== "")
        .map(pair => pair.split("="));
      for (const [key, value] of pairs) {
        mergedConfig[key] = value;
      }
    }
  }
  for (const [key, value] of Object.entries(mergedConfig)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

module.exports = {
  ROOT, BUILD, SRC, LANGS, DEFAULT_LANG, readDotEnv
}
