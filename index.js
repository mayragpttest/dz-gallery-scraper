import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing ?url parameter" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new", // use new headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const title = await page.$eval("section.image-view h1", el =>
      el.textContent.trim()
    );
    const artist = await page.$eval("section.image-view h2 a", el =>
      el.textContent.trim()
    );
    const image_url = await page.$eval("img#img-current-img", el => el.src);
    const description = await page.$eval("section.image-information pre", el =>
      el.textContent.trim()
    );
    const categories = await page.$$eval(
      "section.image-information p a.tag-link",
      els => els.map(el => el.textContent.trim().split(" ")[0]) // strip IDs
    );

    await browser.close();

    res.json({ title, artist, image_url, description, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
