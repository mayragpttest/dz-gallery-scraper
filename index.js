import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const title = await page.$eval("section.image-view h1", el => el.textContent.trim());
    const artist = await page.$eval("section.image-view h2 a", el => el.textContent.trim());
    const image_url = await page.$eval("img#img-current-img", el => el.src);
    const description = await page.$eval("section.image-information pre", el => el.textContent.trim());
    const categories = await page.$$eval("section.image-information p a.tag-link", els =>
      els.map(el => el.textContent.trim())
    );

    await browser.close();
    res.json({ title, artist, image_url, description, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scrape the page" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
