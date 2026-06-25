const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { waitUntil: 'networkidle2' });
  const html = await page.evaluate(() => {
    const el = document.querySelector('yt-lockup-view-model');
    return el ? el.outerHTML : 'Not found';
  });
  console.log(html);
  await browser.close();
})();
