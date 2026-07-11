'use strict';

const CFG = { accuracy: [35, 51, 68, 82, 91, 97] };
const objects = [
  { id:'workingSat', k:'sat', c:'Keep' }, { id:'brokenSat', k:'broken', c:'Junk' },
  { id:'booster', k:'booster', c:'Junk' }, { id:'fuelTank', k:'leakingTank', c:'Junk' },
  { id:'comSat', k:'dish', c:'Keep' }, { id:'probe', k:'probe', c:'Keep' },
  { id:'looseBolt', k:'bolt', c:'Junk' }, { id:'solarPanel', k:'solar', c:'Keep' },
  { id:'lostWrench', k:'wrench', c:'Junk' }, { id:'antenna', k:'antenna', c:'Keep' }
];
const unfamiliar = [
  { id:'tinySat', k:'tiny', c:'Keep' }, { id:'debris', k:'debris', c:'Junk' },
  { id:'folded', k:'folded', c:'Keep' }, { id:'blanket', k:'blanket', c:'Junk' }
];
const S = { chapter:0, xp:0, level:1, accuracy:35, quality:0, sound:true,
  name:'Space Cadet', streak:0, lang:'ru' };
try { Object.assign(S, JSON.parse(localStorage.spaceAI || '{}')); } catch (_) {}
if (!['ru','en','pl'].includes(S.lang)) S.lang = 'ru';
const app = document.querySelector('#app');
