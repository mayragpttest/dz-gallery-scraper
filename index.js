import puppeteer from "puppeteer";

// Get the URL from command line
const url = process.argv[2];

if (!url) {
  console.error("❌ Please provide a gallery URL. Example:");
  console.error('   node index.js "https://www.daz3d.com/gallery/#images/123456"');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new", // use new headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  // Grab structured data
  const title = await page.$eval("section.image-view h1", el => el.textContent.trim());
  const artist = await page.$eval("section.image-view h2 a", el => el.textContent.trim());
  const image_url = await page.$eval("img#img-current-img", el => el.src);
  const description = await page.$eval("section.image-information pre", el => el.textContent.trim());

  // Clean up categories: remove trailing numbers
  const categories = await page.$$eval("section.image-information p a.tag-link", els =>
    els.map(el => el.innerText.trim().replace(/\s\d+$/, ""))
  );

  console.log(JSON.stringify({ title, artist, image_url, description, categories }, null, 2));

  await browser.close();
})();
