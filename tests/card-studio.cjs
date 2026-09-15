// Public synthetic cards only. No real research, drafts or browser profiles.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');

(async()=>{
  const browser=await chromium.launch({headless:true,
    ...(process.env.CARD_TEST_BROWSER?{executablePath:process.env.CARD_TEST_BROWSER}:{})});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];
    await page.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.evaluate(async()=>{await fontsReady();showView('cards');});
    const dense='=== CARD 01\ntype: spec\nkicker: DEVELOPMENT NOTES / SYNTHETIC EXAMPLE\nheadline: FIVE MILESTONES\nsubhead: Small changes with a bigger story\nrows:\n'+
      Array.from({length:5},(_,i)=>`${1980+i} | A useful update to the design\n> A short note explains what changed and why it matters.`).join('\n')+
      '\nhighlight: Each change builds on the previous version. Keep the whole story in view.\nsource: Synthetic fixture\n';
    const popup='=== POPUP 03\ntype: popup\nstyle: tip\nkicker:\ntext: A synthetic popup stays independent.\n';
    const original=dense+'\n=== CARD 02\ntype: table\nformat: landscape\nheadline: QUICK COMPARISON\nrows:\nPART | DESCRIPTION | USE\nAlpha | Compact housing | Road\nBeta | Larger housing | Track\n\n'+popup;
    await page.evaluate(t=>{setSpec(t);cards=parseSpecs(t);idx=0;studioIdx=-1;showCard();},original);
    assert.equal(await page.getByLabel('Deck size',{exact:true}).inputValue(),'square');
    await page.getByRole('button',{name:'Apply to all cards',exact:true}).click();
    const applied=await page.locator('#spec').inputValue();
    assert.ok(applied.endsWith(popup),'Popup bytes changed during bulk sizing');
    assert.deepEqual(await page.evaluate(()=>cards.map(c=>c.format)),['square','square','']);
    const squareMetrics=await page.evaluate(()=>cv._cardLayout);
    assert.equal(await page.evaluate(()=>overflow),false,'Five rows with notes should fit square: '+JSON.stringify(squareMetrics));
    assert.ok(squareMetrics.bodySize>=24);
    assert.ok(squareMetrics.bodyHeight<=squareMetrics.available);
    await page.getByRole('button',{name:'Undo deck change',exact:true}).click();
    assert.equal(await page.locator('#spec').inputValue(),original,'Bulk undo did not restore exact text');
    await page.getByRole('button',{name:'Apply to all cards',exact:true}).click();
    await page.getByRole('button',{name:'Landscape 16:9',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>cards.map(c=>c.format)),['landscape','square',''],'Individual size changed another card');
    assert.equal(await page.getByRole('button',{name:'Undo deck change',exact:true}).isDisabled(),true,'Undo can erase a later edit');
    await page.getByRole('button',{name:'Square 1:1',exact:true}).click();
    await page.getByLabel('Layout',{exact:true}).selectOption('columns');
    await page.getByLabel('Row spacing',{exact:true}).selectOption('compact');
    await page.getByLabel('Margins',{exact:true}).selectOption('narrow');
    await page.getByLabel('Body font',{exact:true}).selectOption('mono');
    await page.getByRole('button',{name:'Apply design to all cards',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>cards.slice(0,2).map(c=>[c.layout,c.spacing,c.padding,c.font])),
      [['columns','compact','narrow','mono'],['auto','compact','narrow','mono']]);
    assert.ok((await page.locator('#spec').inputValue()).endsWith(popup),'Popup bytes changed during bulk design');
    const allDesign=await page.locator('#spec').inputValue();
    await page.reload();await page.evaluate(async()=>{await fontsReady();showView('cards');});
    assert.equal(await page.locator('#spec').inputValue(),allDesign,'Design not saved');
    assert.equal(await page.getByLabel('Deck size',{exact:true}).inputValue(),'square','Default size not remembered');
    await page.getByTitle('Add a card',{exact:true}).click();
    assert.equal(await page.evaluate(()=>cards.at(-1).format),'square','New card ignored preferred size');
    // Slider and text edits must retain focus and update the real spec text.
    await page.getByLabel('Headline',{exact:true}).fill('A BIGGER VIEW');
    assert.equal(await page.getByLabel('Headline',{exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.getByLabel('Card text size',{exact:true}).fill('130');
    assert.match(await page.locator('#spec').inputValue(),/textsize: 130/);
    assert.equal(await page.getByLabel('Card text size',{exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.getByRole('button',{name:'Preview',exact:true}).click();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    await page.getByRole('button',{name:'Actual pixels',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Fit preview',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.getByRole('dialog').locator('img').evaluate(el=>el.clientWidth===el.naturalWidth),true,'Actual pixels still scaled');
    await page.getByRole('button',{name:'Fit preview',exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:'‹ Prev',exact:true}).click();
    assert.equal(await page.evaluate(()=>idx),2);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').isVisible(),false);

    const checks=await page.evaluate(()=>{
      const ctx=document.createElement('canvas').getContext('2d'),results=[];
      const raw='type: popup\nstyle: warning\nkicker:\ntext: Exact round trip.';
      if(workToBlock(cloneCard(parseSpecs(raw)[0]))!==raw)throw Error('No-op popup changed');
      const full='type: spec\nheadline: FORMAT\nlayout: columns\nspacing: airy\npadding: wide\nfont: mono\ntextsize: 110\nrows:\nLABEL | value';
      if(workToBlock(cloneCard(parseSpecs(full)[0]))!==full)throw Error('No-op design changed');
      const plain=cloneCard(parseSpecs('type: spec\nheadline: DEFAULTS')[0]);plain.headline='EDITED';
      if(/^(layout|spacing|padding|font|textsize|format):/m.test(workToBlock(plain)))throw Error('Default serialized during text edit');
      for(const format of Object.keys(CARD_FORMATS)){
        for(const type of FULL_CARD_TYPES){
          const rows=type==='table'?'COMPONENT NAME | DESCRIPTIVE HEADING | INTENDED USE\nAlpha assembly | A longer description wraps here | Road use\nBeta assembly | A compact description | Track use':
            type==='compare'?'LABEL | FIRST ASSEMBLY WITH LONG NAME | SECOND ASSEMBLY WITH LONG NAME\nHOUSING DESIGN | Compact and light | Wider and stronger\nTYPICAL USE | Road use | Track use':
            type==='timeline'?'1980 to 1985 | First version introduced\n1986 to 1990 | Updated design with more options':'LONG LABEL THAT WRAPS | A useful description\nIDENTIFIER | ABCDEFGHIJKLMNOPQRSTUVWXYZ012345678901234567890123456789';
          const c=parseSpecs('type: '+type+'\nformat: '+format+'\nkicker: A LONGER SYNTHETIC KICKER THAT WRAPS INSIDE ITS OWN COLUMN\nheadline: A CLEARER CARD\nsubhead: Useful context for the reader\nrows:\n'+rows+'\nhighlight: A concise takeaway in the reserved callout.\nsource: Synthetic design check')[0];
          // Inspect the actual glyph bounds, including wrapping of long labels.
          const real=ctx.fillText.bind(ctx),bounds=[];
          ctx.fillText=(s,x,y,...args)=>{
            const m=ctx.measureText(s),t=ctx.getTransform();
            const left=t.a*(x-m.actualBoundingBoxLeft)+t.e,right=t.a*(x+m.actualBoundingBoxRight)+t.e;
            const top=t.d*(y-m.actualBoundingBoxAscent)+t.f,bottom=t.d*(y+m.actualBoundingBoxDescent)+t.f;
            bounds.push({s,left,right,top,bottom});real(s,x,y,...args);
          };
          overflow=false;renderCard(ctx,c);ctx.fillText=real;
          const outside=bounds.filter(b=>b.left<0||b.right>ctx.canvas.width+.1||b.top<0||b.bottom>ctx.canvas.height+.1);
          results.push({type,format,overflow,outside});
        }
      }
      const excessive=parseSpecs('type: spec\nformat: square\nheadline: TOO MANY ROWS\nrows:\n'+Array(50).fill('LABEL | A long value that requires some room').join('\n'))[0];
      overflow=false;renderCard(ctx,excessive);if(!overflow)throw Error('Excessive content not blocked');
      for(const value of ['layout: invalid','spacing: invalid','padding: invalid','textsize: 999','font: invalid'])
        if(!parseSpecs('type: spec\n'+value)[0].warnings.length)throw Error('Invalid design accepted: '+value);
      return results;
    });
    checks.forEach(r=>{assert.equal(r.overflow,false,r.type+'/'+r.format+' should fit');assert.deepEqual(r.outside,[],r.type+'/'+r.format+' glyph outside frame');});

    // Restore the dense example for viewport checks and reviewable screenshots.
    await page.evaluate(t=>{setSpec(t);cards=parseSpecs(t);idx=0;studioIdx=-1;showCard();applyDeckSettings({format:'square'},'');},original);
    await page.evaluate(()=>scrollTo(0,0));
    const geometry=await page.locator('#cv').boundingBox();
    assert.ok(geometry.width>550,'Desktop preview still too narrow');
    assert.ok(geometry.y<200,'Desktop preview is not at the top of its column');
    if(process.env.CARD_STUDIO_OUTPUT){
      fs.mkdirSync(process.env.CARD_STUDIO_OUTPUT,{recursive:true});
      await page.screenshot({path:path.join(process.env.CARD_STUDIO_OUTPUT,'studio-desktop.png')});
      const bytes=await page.locator('#cv').evaluate(c=>c.toDataURL().split(',')[1]);
      fs.writeFileSync(path.join(process.env.CARD_STUDIO_OUTPUT,'square-card.png'),Buffer.from(bytes,'base64'));
      await page.getByRole('button',{name:'Expand preview',exact:true}).click();
      await page.screenshot({path:path.join(process.env.CARD_STUDIO_OUTPUT,'expanded-preview.png')});
      await page.keyboard.press('Escape');
    }
    for(const width of [400,768,1000,1200]){
      await page.setViewportSize({width,height:950});await page.evaluate(()=>scrollTo(0,0));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Horizontal overflow at '+width);
    }
    await page.setViewportSize({width:400,height:850});
    await page.getByRole('button',{name:'Preview',exact:true}).click();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile expanded preview overflows');
    if(process.env.CARD_STUDIO_OUTPUT)await page.screenshot({path:path.join(process.env.CARD_STUDIO_OUTPUT,'studio-mobile-preview.png')});
    await page.keyboard.press('Escape');
    assert.deepEqual(errors,[],'Browser or load-time self-test errors');
    console.log('PASS: bulk sizes/design, exact undo, popup preservation, per-card overrides, saved defaults/design, new cards, focus, expanded preview, 12 wrapping/glyph checks, overflow protection, and 400/768/1000/1200/1600px layouts.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
