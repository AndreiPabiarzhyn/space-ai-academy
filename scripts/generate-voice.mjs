import fs from 'node:fs/promises';
import vm from 'node:vm';
import {spawn} from 'node:child_process';

const dryRun=process.argv.includes('--dry-run');
const apiKey=process.env.OPENAI_API_KEY;

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
const edgeVoices={ru:'ru-RU-SvetlanaNeural',en:'en-US-AnaNeural',pl:'pl-PL-ZofiaNeural'};
let useOpenAI=Boolean(apiKey);

function jobsFor(language){
 const pack=translations[language],jobs=[];
 pack.briefs.slice(1).forEach((brief,index)=>jobs.push({key:`brief-${index+1}`,text:`${brief.do} ${brief.theory}`}));
 jobs.push({key:'data-error',text:`${pack.dataBrief.do} ${pack.dataBrief.theory}`});
 jobs.push({key:'final-story',text:pack.finalStoryVoice.join(' ')});
 pack.finalVoiceStages.forEach((lines,index)=>jobs.push({key:`final-stage-${index+1}`,text:lines.join(' ')}));
 jobs.push({key:'final-complete',text:pack.finalVoiceComplete.join(' ')});
 return jobs;
}

function run(command,args){return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${command} exited with ${code}`)))});}

async function generateWithEdge(language,job,file){
 await fs.rm(file,{force:true});
 await run('edge-tts',['--voice',edgeVoices[language],'--rate=-4%','--text',job.text,'--write-media',file]);
 console.log(`generated ${language}/${job.key}.mp3 with Edge neural voice`);
}

async function generate(language,job){
 if(dryRun){console.log(`ready ${language}/${job.key}.mp3`);return}
 const directory=`assets/audio/${language}`,file=`${directory}/${job.key}.mp3`;
 await fs.mkdir(directory,{recursive:true});
 if(!useOpenAI)return generateWithEdge(language,job,file);
 const payload={model,voice,input:job.text,response_format:'mp3',speed:.96};
 if(model.includes('gpt-4o-mini-tts'))payload.instructions=instructions[language];
 try{
  const response=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!response.ok)throw new Error(`${response.status} ${await response.text()}`);
  await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));
  console.log(`generated ${language}/${job.key}.mp3 with OpenAI`);
 }catch(error){
  console.warn(`OpenAI voice unavailable (${error.message}). Switching this run to Edge neural voices.`);
  useOpenAI=false;
  await generateWithEdge(language,job,file);
 }
}

for(const language of ['ru','en','pl'])for(const job of jobsFor(language))await generate(language,job);
