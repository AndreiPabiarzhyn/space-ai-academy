'use strict';

const fs = require('fs');
const vm = require('vm');

const i18nSource = fs.readFileSync('js/i18n.js', 'utf8');
const context = {
  S: { lang: 'ru' },
  save() {},
  document: { documentElement: {}, querySelector() { return {}; } }
};
vm.runInNewContext(`${i18nSource};globalThis.__translations=L`, context);

const appSource = ['js/engine.js', 'js/scenes.js', 'js/free-lab.js']
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');
const usedKeys = [...appSource.matchAll(/(?<![\w])t\('([^']+)'\)/g)].map(match => match[1]);

for (const language of ['ru', 'en', 'pl']) {
  const missing = [...new Set(usedKeys.filter(key =>
    !(key in context.__translations[language]) && !(key in context.__translations.ru)
  ))];
  if (missing.length) throw new Error(`${language} missing translations: ${missing.join(', ')}`);
}

const css = fs.readFileSync('css/components.css', 'utf8');
const openingBraces = (css.match(/{/g) || []).length;
const closingBraces = (css.match(/}/g) || []).length;
if (openingBraces !== closingBraces) throw new Error('Unbalanced CSS braces');

for (const language of ['ru', 'en', 'pl']) {
  if (context.__translations[language].chapters.length !== 10) throw new Error(`${language} must have 10 chapters`);
}

const dataContext = { S: { lang: 'ru' } };
vm.runInNewContext(`${fs.readFileSync('js/free-lab.js', 'utf8')};globalThis.__train=KID_TRAIN;globalThis.__test=KID_TEST`, dataContext);
const uniqueIds = items => new Set(items.map(item => item.id)).size === items.length;
if (dataContext.__train.length !== 20 || !uniqueIds(dataContext.__train)) throw new Error('Training set must contain 20 unique items');
if (dataContext.__test.length !== 5 || !uniqueIds(dataContext.__test)) throw new Error('Test set must contain 5 unique items');

const scenesSource = fs.readFileSync('js/scenes.js', 'utf8').split("el('sound').onclick")[0];
const sceneContext = {};
vm.runInNewContext(`${scenesSource};globalThis.__paths=paths;globalThis.__repairs=repairs;globalThis.__real=realTasks`, sceneContext);
for (const [name, items, expected] of [['paths', sceneContext.__paths, 3], ['repairs', sceneContext.__repairs, 5], ['real tasks', sceneContext.__real, 8]]) {
  if (items.length !== expected || !uniqueIds(items)) throw new Error(`${name} must contain ${expected} unique items`);
}

console.log(`QA passed: ${new Set(usedKeys).size} translation keys, CSS and mission datasets valid.`);
