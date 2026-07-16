'use strict';

const Voice=(()=>{
 let audio=null,run=0,finishCurrent=null;
 const langCode={ru:'ru-RU',en:'en-US',pl:'pl-PL'};
 const profileSettings={guide:{rate:.94,pitch:1.03},story:{rate:.88,pitch:1},action:{rate:.93,pitch:1.03},finish:{rate:.87,pitch:1.07}};

 function stop(){run++;if(finishCurrent){const finish=finishCurrent;finishCurrent=null;finish('cancelled')}if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}globalThis.speechSynthesis?.cancel()}

 function browserFallback(text,profile,token,finish){
  const synth=globalThis.speechSynthesis;
  if(token!==run||!synth||typeof SpeechSynthesisUtterance==='undefined'){finish('unavailable');return}
  const utterance=new SpeechSynthesisUtterance(text),settings=profileSettings[profile]||profileSettings.guide;
  utterance.lang=langCode[S.lang]||langCode.ru;utterance.rate=settings.rate;utterance.pitch=settings.pitch;utterance.volume=.96;
  utterance.onend=()=>finish('ended');utterance.onerror=()=>finish('error');
  synth.speak(utterance);
 }

 function play(key,text,{profile='guide',force=false}={}){
  if((!S.sound&&!force)||!text)return Promise.resolve('skipped');
  stop();const token=run,clip=new Audio(`assets/audio/${S.lang}/${key}.mp3`);audio=clip;clip.preload='auto';
  return new Promise(resolve=>{let settled=false,watchdog;const finish=status=>{if(settled)return;settled=true;clearTimeout(watchdog);if(finishCurrent===finish)finishCurrent=null;if(token===run)audio=null;resolve(status)};finishCurrent=finish;watchdog=setTimeout(()=>finish('timeout'),Math.min(30000,Math.max(12000,text.split(/\s+/).length*700)));clip.addEventListener('ended',()=>finish('ended'),{once:true});clip.addEventListener('error',()=>{if(token===run){audio=null;browserFallback(text,profile,token,finish)}else finish('cancelled')},{once:true});clip.play().catch(()=>{if(token===run){audio=null;browserFallback(text,profile,token,finish)}else finish('cancelled')})});
 }

 return {play,stop};
})();
