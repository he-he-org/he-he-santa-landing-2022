const chokidar = require('chokidar');
const child_process = require('child_process');
const { SRC, CONTENT } = require('./common');
const pc = require('picocolors')

const watcherLog = (...args) => console.log(pc.green(`[watcher]: ${args.map(x => x.toString()).join(', ')}`))

async function makeWatcher(rebuild) {
  try {
    await rebuild();

    let bundling = false;
    let bundleAgain = false;
    chokidar.watch([SRC, CONTENT]).on('all', (_e) => {
      if (bundling) {
        bundleAgain = true;
        return;
      }
      bundling = true;

      function rebuildDebounced() {
        watcherLog(`Rebuilding...`);
        rebuild()
          .then(
            () => {
              watcherLog('Done!');
            },
            (e) => {
              watcherLog(pc.red(`Error while rebuilding! ${e.message}`));
            },
          )
          .then(() => {
            if (bundleAgain) {
              bundleAgain = false;
              rebuildDebounced();
            } else {
              bundling = false;
            }
          });
      }

      rebuildDebounced();
    });

    return new Promise(() => {})
  } catch (e) {
    watcherLog(pc.red(`Error while rebuilding. ${e.message}`))
  }
}


makeWatcher(() => {
  return new Promise((resolve, reject) => {
    child_process.exec(`npm run all 'build:to-rebuild:*'`, {}, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    })
  })
}).catch((e) => {
  watcherLog(pc.red(`Error while watching. ${e.message}`));
})
