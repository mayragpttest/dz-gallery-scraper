import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

// Use your Browserless token from environment variable
const BROWSERLESS_ENDPOINT = process.env.BROWSERLESS_ENDPOINT;

app.get("/scrape", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Please provide a gallery URL as ?url=" });

  try {
    // Connect to Browserless remote Chrome
    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSERLESS_ENDPOINT,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    // Scrape data
    const title = await page.$eval("section.image-view h1", el => el.textContent.trim());
    const artist = await page.$eval("section.image-view h2 a", el => el.textContent.trim());
    const image_url = await page.$eval("img#img-current-img", el => el.src);
    const description = await page.$eval("section.image-information pre", el => el.textContent.trim());
    const categories = await page.$$eval("section.image-information p a.tag-link", els =>
      els.map(el => el.textContent.trim())
    );

    await browser.disconnect();

    res.json({ title, artist, image_url, description, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Scraping failed", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
