// Public synthetic fixtures only. Run with Node and Playwright available.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

(async () => {
  const browser = await chromium.launch({ headless:true,
    ...(process.env.CARD_TEST_BROWSER ? { executablePath:process.env.CARD_TEST_BROWSER } : {}) });
  try {
    const page = await browser.newPage({ viewport:{width:400,height:850} });
    // DOCX import's optional CDN library is unrelated to this offline card test.
    await page.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()); });
    const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
    await page.goto(url);
    await page.evaluate(async()=>{ await fontsReady(); });
    const results=await page.evaluate(async()=>{
      const out=[], ctx=document.createElement('canvas').getContext('2d');
      for(const type of FULL_CARD_TYPES){
        for(const [format,fmt] of Object.entries(CARD_FORMATS)){
          const rows=type==='compare'? 'LABEL | LEFT | RIGHT\nSIZE | Small | Large\nUSE | Road | Track' :
            type==='table'? 'PART | SIZE | USE\nAlpha | Small | Road\nBeta | Large | Track' :
            type==='timeline'? '1990 | First version introduced\n2000 | Updated design' :
            'SIZE | A compact assembly with a useful description that wraps into the available column.\nUSE | Road and track';
          const c=parseSpecs('type: '+type+'\nformat: '+format+'\nkicker: SYNTHETIC EXAMPLE\nheadline: CARD FORMAT\nsubhead: A useful subtitle\nrows:\n'+rows+'\nhighlight: A concise takeaway.\nsource: Test fixture')[0];
          overflow=false; renderCard(ctx,c);
          const blob=await canvasBlob(ctx.canvas), bitmap=await createImageBitmap(blob);
          out.push({type,format,width:bitmap.width,height:bitmap.height,expected:[fmt.width,fmt.height],overflow,warnings:c.warnings});
          bitmap.close();
          if(!workToBlock(cloneCard(c)).includes('format: '+format)) throw Error('Format lost in studio');
        }
      }
      const old=parseSpecs('type: spec\nheadline: ORIGINAL')[0];
      if(workToBlock(cloneCard(old)).includes('format:')) throw Error('Default serialized into old card');
      for(const format of ['square','landscape','portrait']){
        renderCard(ctx,parseSpecs('type: popup\ntext: A popup.')[0]);
        renderCard(ctx,parseSpecs('type: spec\nformat: '+format+'\nheadline: FRAME')[0]);
        if(ctx.canvas.width!==CARD_FORMATS[format].width || ctx.getTransform().a!==1) throw Error('Mixed render state leaked');
      }
      if(!parseSpecs('type: spec\nformat: invalid')[0].warnings.length) throw Error('Invalid format not warned');
      const dense=parseSpecs('type: spec\nformat: square\nheadline: TOO MUCH\nrows:\n'+Array(30).fill('LABEL | Long content taking up space.').join('\n'))[0];
      overflow=false; renderCard(ctx,dense);
      if(!overflow) throw Error('Overflow not detected');
      cards=[dense]; idx=0;
      const originalAlert=window.alert; window.alert=()=>{};
      if(!currentCardBlocked()) throw Error('Overflow export not blocked');
      window.alert=originalAlert;
      setSpec('=== CARD 01\ntype: spec\nheadline: TEST CARD\nrows:\nSIZE | Compact\nUSE | Road');
      cards=parseSpecs(specEl.value); idx=0; studioIdx=-1; showCard();
      return out;
    });
    for(const r of results){
      assert.deepEqual([r.width,r.height],r.expected,`${r.type}/${r.format} dimensions`);
      assert.equal(r.overflow,false,`${r.type}/${r.format} overflow`);
      assert.deepEqual(r.warnings,[]);
    }
    // Open Cards, then use the Studio controls.
    await page.evaluate(()=>{ showView('cards'); });
    await page.getByRole('button',{name:'Square 1:1',exact:true}).click();
    assert.match(await page.locator('#spec').inputValue(),/format: square/);
    assert.deepEqual(await page.locator('#cv').evaluate(c=>[c.width,c.height]),[1080,1080]);
    await page.getByRole('button',{name:'Landscape 16:9',exact:true}).click();
    assert.deepEqual(await page.locator('#cv').evaluate(c=>[c.width,c.height]),[1920,1080]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Phone page overflows horizontally');
    assert.equal(await page.getByRole('button',{name:'Landscape 16:9',exact:true}).getAttribute('aria-pressed'),'true');
    await page.reload(); await page.evaluate(async()=>{ await fontsReady(); showView('cards'); });
    assert.match(await page.locator('#spec').inputValue(),/format: landscape/);
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Save PNG',exact:true}).click();
    const download=await downloadPromise;
    const bytes=require('node:fs').readFileSync(await download.path());
    assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[1920,1080]);

    // Exercise both batch export buttons with a mixed deck, capturing their
    // real PNG blobs locally instead of opening a share sheet or download UI.
    await page.evaluate(()=>{
      window.cardTestSpec=specEl.value;
      window.cardTestSave=saveBlob;
      window.cardTestFiles=[];
      saveBlob=(blob,name)=>{ window.cardTestFiles.push({blob,name}); };
      Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
      const blocks=Object.keys(CARD_FORMATS).map(format=>'type: spec\nformat: '+format+'\nheadline: TEST CARD\nrows:\nSIZE | Compact');
      blocks.push('type: popup\ntext: A short note.');
      setSpec(blocks.join('\n=== CARD\n')); cards=parseSpecs(specEl.value); idx=0; studioIdx=-1; showCard();
    });
    const checkBatch=async button=>{
      await page.evaluate(()=>{ window.cardTestFiles=[]; });
      await page.locator(button).click();
      await page.waitForFunction(()=>window.cardTestFiles.filter(f=>f.blob.type==='image/png').length===4);
      if(button==='#sharePack') await page.waitForFunction(()=>document.getElementById('sharePack').textContent.startsWith('Downloaded'));
      const sizes=await page.evaluate(async()=>Promise.all(window.cardTestFiles.filter(f=>f.blob.type==='image/png').map(async f=>{
        const bitmap=await createImageBitmap(f.blob), size=[bitmap.width,bitmap.height]; bitmap.close(); return size;
      })));
      assert.deepEqual(sizes.slice(0,3),[[1080,1920],[1080,1080],[1920,1080]],button+' PNG sizes');
      assert.ok(sizes[3][0]>0 && sizes[3][1]>0,'Popup export missing');
    };
    await checkBatch('#dlall');
    await checkBatch('#sharePack');
    await page.evaluate(()=>{
      saveBlob=window.cardTestSave; setSpec(window.cardTestSpec);
      cards=parseSpecs(specEl.value); idx=0; studioIdx=-1; showCard();
    });

    // Existing portrait and popup pixels must match the checkout's base version.
    const baseline=execFileSync('git',['show',(process.env.CARD_TEST_BASE_REF || 'HEAD')+':index.html'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',maxBuffer:8*1024*1024});
    const base=await browser.newPage();
    await base.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
    await base.route('http://card-baseline.test/**',route=>route.fulfill({contentType:'text/html',body:baseline}));
    await base.goto('http://card-baseline.test/');
    const snapshots=async p=>p.evaluate(async()=>{
      await fontsReady();
      const ctx=document.createElement('canvas').getContext('2d');
      return parseSpecs(CARD_EXAMPLE).map(c=>{ renderCard(ctx,c); return ctx.canvas.toDataURL(); });
    });
    assert.deepEqual(await snapshots(page),await snapshots(base),'Existing card pixels changed');
    assert.deepEqual(errors,[],'Browser errors or app self-test failure');
    if(process.env.CARD_TEST_SCREENSHOT){
      await page.evaluate(()=>{ showView('cards'); });
      await page.screenshot({path:process.env.CARD_TEST_SCREENSHOT,fullPage:true});
      await page.setViewportSize({width:1400,height:950});
      await page.screenshot({path:process.env.CARD_TEST_SCREENSHOT.replace('.png','-desktop.png'),fullPage:true});
      const gallery=await page.evaluate(()=>{
        const ctx=document.createElement('canvas').getContext('2d');
        return Object.keys(CARD_FORMATS).map(format=>{
          const c=parseSpecs(DEMO_SPECS)[0]; c.format=format; overflow=false; renderCard(ctx,c);
          return {format,overflow,url:ctx.canvas.toDataURL()};
        });
      });
      await base.setViewportSize({width:1600,height:950});
      await base.setContent('<body style="background:#eee;font:20px sans-serif;display:flex;align-items:flex-start;gap:20px">'+gallery.map(c=>'<div><p>'+c.format+(c.overflow?' (overflow)':'')+'</p><img style="max-width:500px;max-height:850px" src="'+c.url+'"></div>').join(''));
      await base.screenshot({path:process.env.CARD_TEST_SCREENSHOT.replace('.png','-gallery.png')});
    }
    console.log('PASS: 12 type/format PNGs, studio controls, draft persistence, phone width, PNG download, both batch exports, overflow protection, mixed popup/full-card rendering, and baseline pixel equality.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
