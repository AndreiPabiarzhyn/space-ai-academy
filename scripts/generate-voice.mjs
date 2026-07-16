import fs from 'node:fs/promises';
import vm from 'node:vm';

const dryRun=process.argv.includes('--dry-run');
const apiKey=process.env.OPENAI_API_KEY;
if(!apiKey&&!dryRun)throw new Error('OPENAI_API_KEY is required');

const source=await fs.readFile('js/i18n.js','utf8');
const context={S:{lang:'ru'},save(){},document:{documentElement:{},querySelector(){return {}}}};
vm.runInNewContext(`${source};globalThis.__translations=L`,context);
const translations=context.__translations;
const model=process.env.OPENAI_TTS_MODEL||'tts-1-hd';
const voice=process.env.OPENAI_TTS_VOICE||'nova';
const instructions={
 ru:'Говори по-русски как добрый ведущий детской научной игры. Чёткая дикция, живые смысловые ударения, короткие естественные паузы. Не спеши и не переигрывай.',
 en:'Speak like a warm host of a children’s science game. Clear diction, lively emphasis, short natural pauses, and an encouraging tone.',
 pl:'Mów po polsku jak serdeczny prowadzący dziecięcej gry naukowej. Wyraźna dykcja, naturalne akcenty, krótkie pauzy i zachęcający ton.'
};

function jobsFor(language){
 const pack=translations[language],jobs=[];
 pack.briefs.slice(1).forEach((brief,index)=>jobs.push({key:`brief-${index+1}`,text:`${brief.do} ${brief.theory}`}));
 jobs.push({key:'data-error',text:`${pack.dataBrief.do} ${pack.dataBrief.theory}`});
 jobs.push({key:'final-story',text:pack.finalStoryVoice.join(' ')});
 pack.finalVoiceStages.forEach((lines,index)=>jobs.push({key:`final-stage-${index+1}`,text:lines.join(' ')}));
 jobs.push({key:'final-complete',text:pack.finalVoiceComplete.join(' ')});
 return jobs;
}

async function generate(language,job){
 if(dryRun){console.log(`ready ${language}/${job.key}.mp3`);return}
 const payload={model,voice,input:job.text,response_format:'mp3',speed:.96};
 if(model.includes('gpt-4o-mini-tts'))payload.instructions=instructions[language];
 const response=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!response.ok)throw new Error(`${language}/${job.key}: ${response.status} ${await response.text()}`);
 const directory=`assets/audio/${language}`;
 await fs.mkdir(directory,{recursive:true});
 await fs.writeFile(`${directory}/${job.key}.mp3`,Buffer.from(await response.arrayBuffer()));
 console.log(`generated ${language}/${job.key}.mp3`);
}

for(const language of ['ru','en','pl'])for(const job of jobsFor(language))await generate(language,job);
