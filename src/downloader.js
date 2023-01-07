const fs = require('fs');
const https = require('https');
const puppeteer = require('puppeteer');

const imageDownload = (url, path) => new Promise (async (resolve, reject) => {
    try {
        const browser = await puppeteer.launch({
            headless: true
        });
    
        const page = await browser.newPage();
        await page.goto(
            url, { waitUntil: 'networkidle2' }
        );
    
        const imgUrl = await page.$eval('img', img => img.src);
        
        https.get(imgUrl, res => {
            const stream = fs.createWriteStream(path);
            res.pipe(stream);
            stream.on('finish', () => {
                stream.close();
            })
        })
    
        browser.close();

        resolve({
            status: "success"
        })
    } catch (err) {
        resolve({
            status: "error"
        })
    }
});

module.exports = { imageDownload }