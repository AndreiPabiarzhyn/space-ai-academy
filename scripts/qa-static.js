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
  const missing = [...new Set(usedKeys.filter(key => !(key in context.__translations[language])))];
  if (missing.length) throw new Error(`${language} missing translations: ${missing.join(', ')}`);
}

const dynamicKeys = [
  'emotionIdle','emotionThinking','emotionDoubt','emotionHappy','emotionError','emotionHelp','emotionTrained',
  'confidenceConfident','confidenceDoubt','confidenceHuman','hintObjectPurpose','hintDamageOrUseful',
  'hintComparePrediction','hintSeenBefore','hintAskHuman','hintWatchMovement','hintDangerZone','hintDamage',
  'explainScanner','explainFeedback','explainUnknown','explainCollision','explainRepair'
];
for (const language of ['ru', 'en', 'pl']) {
  const missing = dynamicKeys.filter(key => !(key in context.__translations[language]));
  if (missing.length) throw new Error(`${language} missing dynamic translations: ${missing.join(', ')}`);
}

const cssFiles = ['tokens.css', 'base.css', 'layout.css', 'ui.css', 'scenes.css', 'responsive.css'];
const css = cssFiles.map(file => fs.readFileSync(`css/${file}`, 'utf8')).join('\n');
const openingBraces = (css.match(/{/g) || []).length;
const closingBraces = (css.match(/}/g) || []).length;
if (openingBraces !== closingBraces) throw new Error('Unbalanced CSS braces');
for (const selector of ['.course-step', '.choice .cta', '.review-arrow', '.mistake-review > header']) {
  if (!css.includes(selector)) throw new Error(`Missing critical UI selector: ${selector}`);
}
for (const selector of ['.lesson-brief', '.brief-card', '.brief-action', '.brief-theory']) {
  if (!css.includes(selector)) throw new Error(`Missing lesson brief selector: ${selector}`);
}
if (!css.includes('.course-step span { position: relative; z-index: 2;')) throw new Error('Progress circles do not cover connector lines');
if (!css.includes('right: calc(50% + 18px); left: calc(-50% + 18px);')) throw new Error('Progress connectors do not stop outside circles');
if (!css.includes('.app-shell {') || !css.includes('grid-template-rows: auto minmax(0, 1fr) auto;')) {
  throw new Error('Three-zone application shell is not active');
}
if (!css.includes('main { display: grid;') || !css.includes('align-items: center;')) throw new Error('Content is not centered in its zone');
if (!css.includes('font-size: 13px; font-weight: 800;') || !css.includes('.intro-hero { position: relative;')) {
  throw new Error('Simple intro hero or readable progress labels are not active');
}
for (const selector of ['animation-name: collision-flight', 'animation-name: safe-flight', 'animation-name: near-flight', '.mover svg']) {
  if (!css.includes(selector)) throw new Error(`Missing collision animation rule: ${selector}`);
}
if (css.includes('.trajectory-hit, .trajectory-safe, .trajectory-near { position: absolute; height: 4px;')) {
  throw new Error('Collision object is collapsed into a trajectory line');
}
for (const selector of ['.dataset-strip > button', '.dataset-strip .task-picture']) {
  if (!css.includes(selector)) throw new Error(`Missing compact experiment selector: ${selector}`);
}
for (const selector of ['.training-snapshot', '.cause-chain', '.label-fix-card', '.model-change']) {
  if (!css.includes(selector)) throw new Error(`Missing visual data lesson selector: ${selector}`);
}
for (const selector of ['.cinematic-grid', '.robot-shield', '.avoid-route', '.repair-beam', '.orbit-collector', '.mission-stamp', '.cinematic-log', '.repair-before', '.repair-after', '.human-beacon', '.auto-unknown']) {
  if (!css.includes(selector)) throw new Error(`Missing final cinematic selector: ${selector}`);
}
for (const selector of ['.cinematic-intro', '.story-signal', '.story-copy', '.story-goals', '.story-actions', '.awaiting-start']) {
  if (!css.includes(selector)) throw new Error(`Missing final story selector: ${selector}`);
}
for (const selector of ['.certificate-screen', '.certificate-head', '.certificate-body', '.graduate-badge', '.certificate-actions', '.certificate-achievements']) {
  if (!css.includes(selector)) throw new Error(`Missing compact certificate selector: ${selector}`);
}
for (const selector of ['main > .free-lab-screen', '.free-lab-head', '.free-lab-body', '.free-back']) {
  if (!css.includes(selector)) throw new Error(`Missing free lab frame selector: ${selector}`);
}
for (const animation of ['scan-sweep', 'meteor-swoop', 'repair-before', 'repair-after', 'collect-one', 'collect-two', 'collect-three', 'unknown-pulse']) {
  if (!css.includes(`@keyframes ${animation}`)) throw new Error(`Missing final cinematic animation: ${animation}`);
}
if (!css.includes('--bg: #070d20') || !css.includes('--page: 1380px') || css.includes('font-size: clamp(34px, 5vw, 52px)')) {
  throw new Error('Compact dark-page design tokens are not active');
}
if (!css.includes('.learning-visual { display: grid;')) throw new Error('Wide learning layout is not active');

for (const asset of ['academy-arrival', 'data-lab', 'collision-control', 'repair-bay', 'orbit-success']) {
  if (!fs.existsSync(`assets/story/${asset}.png`)) throw new Error(`Missing story illustration: ${asset}`);
}

context.document.querySelector = () => null;
vm.runInNewContext(`${fs.readFileSync('js/engine.js', 'utf8')};globalThis.__feedback={resetLessonMistakes,registerMistake,resolveMistake,mistakeReview,confidenceUI,robot}`, context);
context.__feedback.resetLessonMistakes();
const mistake = { id: 'brokenSat', kind: 'broken', user: 'Keep', correct: 'Junk', hints: ['hintObjectPurpose', 'hintDamageOrUseful'], explain: 'explainScanner' };
const firstHint = context.__feedback.registerMistake(mistake);
const secondHint = context.__feedback.registerMistake(mistake);
context.__feedback.resolveMistake('brokenSat');
const reviewMarkup = context.__feedback.mistakeReview();
if (firstHint === secondHint || !reviewMarkup.includes('mistake-card') || !reviewMarkup.includes('mistake-picture') || !reviewMarkup.includes('review-arrow')) throw new Error('Mistake review or progressive hints are broken');
if (!context.__feedback.confidenceUI(80).includes('state-confident') || !context.__feedback.confidenceUI(55).includes('state-doubt') || !context.__feedback.confidenceUI(20).includes('state-human')) throw new Error('Confidence states are broken');
for (const state of ['idle', 'thinking', 'doubt', 'happy', 'error', 'help', 'trained']) {
  if (!context.__feedback.robot(state).includes(`robot-${state}`)) throw new Error(`Missing robot emotion: ${state}`);
}

for (const language of ['ru', 'en', 'pl']) {
  if (context.__translations[language].chapters.length !== 10) throw new Error(`${language} must have 10 chapters`);
  const voiceStages = context.__translations[language].finalVoiceStages;
  if (!Array.isArray(voiceStages) || voiceStages.length !== 4 || voiceStages.some(stage => !Array.isArray(stage) || stage.length < 2)) {
    throw new Error(`${language} final narration must contain four paced scenes`);
  }
}
if (!context.__translations.ru.finalVoiceStages.flat().join('').includes('\u0301')) throw new Error('Russian final narration has no pronunciation stress marks');

const dataContext = { S: { lang: 'ru' } };
vm.runInNewContext(`${fs.readFileSync('js/free-lab.js', 'utf8')};globalThis.__train=KID_TRAIN;globalThis.__test=KID_TEST`, dataContext);
const uniqueIds = items => new Set(items.map(item => item.id)).size === items.length;
if (dataContext.__train.length !== 20 || !uniqueIds(dataContext.__train)) throw new Error('Training set must contain 20 unique items');
if (dataContext.__test.length !== 5 || !uniqueIds(dataContext.__test)) throw new Error('Test set must contain 5 unique items');

const scenesSource = fs.readFileSync('js/scenes.js', 'utf8').split("el('sound').onclick")[0];
if (!scenesSource.includes('function startFinaleMovie') || !scenesSource.includes('id="cinematicIntro"') || !scenesSource.includes("t('finalStoryText')")) {
  throw new Error('Final cinematic story intro is not active');
}
if (!scenesSource.includes('certificate-screen') || !scenesSource.includes('certificate-achievements')) throw new Error('Compact certificate markup is not active');
for (const feature of ['function speakCinematic', 'Voice.play', "t('finalVoiceStages')", 'debris-one', 'debris-two', 'debris-three', 'auto-unknown', 'repair-before', 'repair-after', 'human-beacon']) {
  if (!scenesSource.includes(feature)) throw new Error(`Missing narrated final feature: ${feature}`);
}
const voiceSource = fs.readFileSync('js/voice.js', 'utf8');
if (!voiceSource.includes('assets/audio/${S.lang}/${key}.mp3') || !voiceSource.includes('browserFallback')) {
  throw new Error('API narration player or browser fallback is missing');
}
if (scenesSource.includes('dataErrorLabel(') || !scenesSource.includes('hiddenDataErrorTitle') || !scenesSource.includes('model-change')) {
  throw new Error('Visual data-quality lesson is not active');
}
const sceneContext = {};
vm.runInNewContext(`${scenesSource};globalThis.__paths=paths;globalThis.__repairs=repairs;globalThis.__real=realTasks`, sceneContext);
for (const [name, items, expected] of [['paths', sceneContext.__paths, 3], ['repairs', sceneContext.__repairs, 5], ['real tasks', sceneContext.__real, 8]]) {
  if (items.length !== expected || !uniqueIds(items)) throw new Error(`${name} must contain ${expected} unique items`);
}

console.log(`QA passed: ${new Set(usedKeys).size} translation keys, CSS and mission datasets valid.`);
