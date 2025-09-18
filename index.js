import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  const galleryUrl = req.query.url;
  if (!galleryUrl) {
    return res.status(400).json({ error: "Please provide a gallery URL with ?url=" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(galleryUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(1500); // wait a bit for dynamic content

    // Helper to safely get text content
    const safeText = async (selector) => {
      try {
        return await page.$eval(selector, (el) => el.textContent.trim());
      } catch {
        return null;
      }
    };

    const safeMultiple = async (selector) => {
      try {
        return await page.$$eval(selector, (els) => els.map((el) => el.textContent.trim()));
      } catch {
        return [];
      }
    };

    // Scrape fields
    const title = await safeText("section.image-view h1");
    const artist = await safeText("section.image-view h2 a");
    const image_url = await safeText("img#img-current-img[src]");
    const description = await safeText("section.image-information pre");
    const categories = (await safeMultiple("section.image-information p a.tag-link")).map(cat => cat.replace(/\d+$/, "").trim());

    res.json({ title, artist, image_url, description, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
