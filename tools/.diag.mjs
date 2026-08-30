import { chromium } from 'playwright';
const b = await chromium.launch({ channel:'chrome', headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1280,height:720} });
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
p.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text().slice(0,160)); });
p.on('response', r => { if (r.status()>=400 && !/photos/.test(r.url())) console.log('HTTP', r.status(), r.url()); });
const t0=Date.now();
await p.goto(process.argv[2], { waitUntil:'domcontentloaded' });
for (let i=0;i<200;i++) {
  const s = await p.evaluate(() => ({
    app: !!window.__app, tl: !!window.__app?.tl, boot: !!document.getElementById('boot'),
    bootText: document.getElementById('boot')?.textContent || null,
    gate: !!document.getElementById('startgate'),
    audioDur: window.__app?.narration?.audio?.duration ?? null,
  }));
  if (s.tl && !s.boot) { console.log('READY at', ((Date.now()-t0)/1000).toFixed(1)+'s', JSON.stringify(s)); break; }
  await new Promise(r=>setTimeout(r,500));
}
await b.close();
