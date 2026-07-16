'use strict';

const Voice=(()=>{
 let audio=null,run=0;
 const langCode={ru:'ru-RU',en:'en-US',pl:'pl-PL'};
 const profileSettings={guide:{rate:.94,pitch:1.03},story:{rate:.88,pitch:1},action:{rate:.93,pitch:1.03},finish:{rate:.87,pitch:1.07}};

 function stop(){run++;if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}globalThis.speechSynthesis?.cancel()}

 function browserFallback(text,profile,token){
  const synth=globalThis.speechSynthesis;
  if(token!==run||!synth||typeof SpeechSynthesisUtterance==='undefined')return;
  const utterance=new SpeechSynthesisUtterance(text),settings=profileSettings[profile]||profileSettings.guide;
  utterance.lang=langCode[S.lang]||langCode.ru;utterance.rate=settings.rate;utterance.pitch=settings.pitch;utterance.volume=.96;
  synth.speak(utterance);
 }

 function play(key,text,{profile='guide',force=false}={}){
  if((!S.sound&&!force)||!text)return;
  stop();const token=run,clip=new Audio(`assets/audio/${S.lang}/${key}.mp3`);audio=clip;clip.preload='auto';
  clip.addEventListener('ended',()=>{if(token===run)audio=null},{once:true});
  clip.addEventListener('error',()=>{if(token===run){audio=null;browserFallback(text,profile,token)}},{once:true});
  clip.play().catch(()=>{if(token===run){audio=null;browserFallback(text,profile,token)}});
 }

 return {play,stop};
})();
