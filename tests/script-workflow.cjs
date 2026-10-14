// Isolated browser profile; public synthetic text only.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

(async()=>{
  const browser=await chromium.launch({headless:true,
    ...(process.env.CARD_TEST_BROWSER?{executablePath:process.env.CARD_TEST_BROWSER}:{})});
  try{
    const page=await browser.newPage({viewport:{width:400,height:850}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.evaluate(()=>{showView('home');window.copyText=(t)=>{window.testCopy=t;};});
    assert.equal(await page.getByLabel('Script idea').isVisible(),true);
    assert.equal(await page.getByRole('heading',{name:'What story do you want to tell?'}).isVisible(),true);
    assert.equal(await page.getByLabel('Script format').evaluate(el=>el.getBoundingClientRect().height>=36),true);
    assert.equal(await page.locator('[data-manual-prompt="pp3"]').isVisible(),false,'Advanced prompts start collapsed');
    await page.getByLabel('Script idea').fill('Explain a synthetic identification difference. Keep it under two minutes.');
    await page.getByRole('button',{name:'Start script · copy research + writing prompt',exact:true}).click();
    let state=await page.evaluate(()=>({s:bsState().active,steps:bsTrack(bsState().active),prompt:testCopy}));
    assert.equal(state.s.scriptFirst,true);
    assert.equal(state.s.dossierTag,'');
    assert.deepEqual(state.s.dossierTags,[]);
    assert.deepEqual(state.steps.map(x=>x.key),['script','audit','filed']);
    assert.match(state.prompt,/Actively search outside/);
    assert.match(state.prompt,/No dossier, coverage plan/);
    assert.match(state.prompt,/OPTIONAL LIBRARY REFERENCES: none supplied/);
    assert.doesNotMatch(state.prompt,/sole factual basis|No outside facts|\[PASTE THE COMPLETE DOSSIER\]|ITC PRODUCTION KNOWLEDGE BUNDLE/);
    assert.equal((state.prompt.match(/SOURCE HIERARCHY/g)||[]).length,1,'One shared evidence standard');
    await page.getByLabel('Story and direction').fill('Updated synthetic story');
    await page.getByRole('button',{name:'Copy Short script prompt',exact:true}).click();
    assert.match(await page.evaluate(()=>testCopy),/Updated synthetic story/);
    await page.getByText('Source notes · optional handoff',{exact:true}).click();
    await page.getByLabel('Source notes').fill('C1: Synthetic source note with an exact figure and a source URL.');
    await page.getByPlaceholder('Paste the final script here after you finish the back-and-forth in AI.').fill('Synthetic script copy. Inside The Case.');
    await page.getByRole('button',{name:'Save script · independent check',exact:true}).click();
    await page.getByRole('button',{name:'Copy independent fact-check prompt',exact:true}).click();
    let audit=await page.evaluate(()=>testCopy);
    assert.match(audit,/Synthetic script copy/);
    assert.match(audit,/C1: Synthetic source note/);
    assert.match(audit,/Verify every factual claim against actual outside sources/);
    assert.match(audit,/do not return a clean verdict/);
    assert.doesNotMatch(audit,/\[PASTE THE FINAL COPY\]|\[PASTE SOURCE NOTES/);
    await page.reload();
    await page.evaluate(()=>{showView('home');window.copyText=(t)=>{window.testCopy=t;};});
    assert.equal(await page.evaluate(()=>bsState().active.status),'audit');
    assert.match(await page.evaluate(()=>bsState().active.evidence),/Synthetic source note/);
    await page.getByText('Source notes · optional handoff',{exact:true}).click();
    await page.getByLabel('Source notes').fill('C1: Revised synthetic evidence, independently checked.');
    await page.getByPlaceholder('Paste the corrected final script here. Leave this blank if the audit came back clean.').fill('Corrected synthetic copy. Inside The Case.');
    await page.getByRole('button',{name:'Check resolved · optional cards + upload details',exact:true}).click();
    await page.getByRole('button',{name:'Copy P4 · cards',exact:true}).click();
    const cards=await page.evaluate(()=>testCopy);
    assert.match(cards,/Corrected synthetic copy/);
    assert.match(cards,/Revised synthetic evidence/);
    assert.match(cards,/FULL-CARD MACHINE FORMAT/);
    assert.doesNotMatch(cards,/\[PASTE THE COMPLETE DOSSIER\]/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'400px layout');
    await page.evaluate(()=>{
      const s=bsState().active;
      // Legacy jobs and research keep their previous paths and text.
      const old={kind:'production',tag:'SYNTHETIC',dossierTag:'SYNTHETIC',status:'write',finalScript:'keep me'};
      bsNorm(old);window.testLegacy={old,steps:bsTrack(old).map(x=>x.key)};
      const light={kind:'research',light:true,status:'scope'};
      window.testLight=bsTrack(light).map(x=>x.key);
      const st=bsState();bsFile(st);
    });
    const legacy=await page.evaluate(()=>testLegacy);
    assert.equal(legacy.old.status,'idea');
    assert.equal(legacy.old.finalScript,'keep me');
    assert.equal(legacy.steps.includes('plan'),true);
    assert.deepEqual(await page.evaluate(()=>testLight),['scope','lresearch','lfinal','shelved']);
    assert.equal(await page.evaluate(()=>bsState().history[0].finalScript),'Corrected synthetic copy. Inside The Case.');
    assert.equal(await page.getByLabel('Script idea').inputValue(),'Explain a synthetic identification difference. Keep it under two minutes.');
    // Reference choice can be removed, including a tag colliding with a
    // Library record. New scripts never acquire an implicit primary.
    const refs=await page.evaluate(()=>{
      const before=libraryCache;
      libraryCache={SYNTHETIC:{tag:'SYNTHETIC',text:'01 SYNTHETIC\n'+('Synthetic reference. '.repeat(30)),status:'ready'}};
      const s={kind:'production',scriptFirst:true,tag:'SYNTHETIC',dossierTag:'',dossierTags:[]};
      const absent=selectedDossierTags(s);
      s.dossierTags=['SYNTHETIC'];const present=selectedDossierTags(s);
      s.dossierTags=[];const removed=selectedDossierTags(s);
      libraryCache=before;return {absent,present,removed};
    });
    assert.deepEqual(refs,{absent:[],present:['SYNTHETIC'],removed:[]});
    await page.getByText('Jobs · switch or review',{exact:true}).click();
    await page.getByText('Review saved script and sources',{exact:true}).click();
    await page.getByRole('button',{name:'Copy saved sources',exact:true}).click();
    assert.match(await page.evaluate(()=>testCopy),/Revised synthetic evidence/);
    await page.getByText('Jobs · switch or review',{exact:true}).click();
    // All formats retain the independent sourcing standard without a
    // dossier attachment. A direct finish preserves more than 20 jobs.
    const checks=await page.evaluate(()=>{
      const prompts=['pp2a','pp2b','pp2c'].map(id=>ppP2(id,{story:'Synthetic story',dossierTags:[]}));
      const st=bsState();st.history=Array.from({length:24},(_,i)=>({id:i,kind:'production',status:'filed',tag:'SYNTHETIC_'+i,updated:Date.now()}));bsSave(st);
      return prompts;
    });
    for(const prompt of checks){
      assert.match(prompt,/Actively search outside/);assert.match(prompt,/SOURCE HIERARCHY/);
      assert.doesNotMatch(prompt,/sole factual basis|every twenty seconds/);
    }
    await page.getByRole('button',{name:'Start script · copy research + writing prompt',exact:true}).click();
    await page.getByPlaceholder('Paste the final script here after you finish the back-and-forth in AI.').fill('A second synthetic script.');
    await page.getByRole('button',{name:'Save script · independent check',exact:true}).click();
    await page.getByRole('button',{name:'Check resolved · finish script',exact:true}).click();
    assert.equal(await page.evaluate(()=>bsState().active),null);
    assert.equal(await page.evaluate(()=>bsState().history.length),25);
    assert.equal(await page.evaluate(()=>bsState().history[0].finalScript),'A second synthetic script.');
    if(process.env.SCRIPT_TEST_SCREENSHOT) await page.screenshot({path:process.env.SCRIPT_TEST_SCREENSHOT,fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('Script workflow passed: empty Library, two core steps, outside research, current evidence handoff, reload, optional cards, legacy jobs, 400px layout.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
