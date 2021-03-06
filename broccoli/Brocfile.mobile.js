"use strict";
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const cliqzConfig = require('./config');
const modules = require('./modules-tree');
const writeFile = require('broccoli-file-creator');
const concat = require('broccoli-concat');

// input trees
const mobileSpecific  = new Funnel('specific/mobile', { exclude: ['skin/sass/**/*', '*.py'] });

console.log('Source maps:', cliqzConfig.sourceMaps);
console.log(cliqzConfig);
const configFile = writeFile('cliqz.json', JSON.stringify(cliqzConfig));

const mobile = new MergeTrees([
  configFile,
  mobileSpecific,
  modules.static,
  modules.bundles,
]);

const outputList = [
  mobile,
];

if (process.env['CLIQZ_ENVIRONMENT'] !== 'production') {
  const platformTests = new Funnel('platforms/'+cliqzConfig.platform, {
    include: ['tests/**/*']
  });
  const testsTree = concat(platformTests, {
    outputFile: 'tests.js',
    inputFiles: [
      "**/*.js"
    ],
    allowNone: true,
    sourceMapConfig: { enabled: cliqzConfig.sourceMaps },
  });
  const mobileDev = new MergeTrees([
    mobileSpecific,
    modules.modules,
  ]);
  const outputTreeDev = new MergeTrees([
    mobileDev,
    new Funnel(testsTree, { destDir: 'tests'})
  ]);
  outputList.push(new Funnel(testsTree, { destDir: 'tests'}));
  outputList.push(new Funnel(outputTreeDev, { destDir: 'dev' }));
}

module.exports = new MergeTrees(outputList);
