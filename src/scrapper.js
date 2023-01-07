const downloader = require('./downloader.js')

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs').promises;

const pageReader = (url) => new Promise (async (resolve, reject) => {
    console.log("[#] Scrapping Pages ...")
    var results = {
        title: "",
        pages: "", 
        paginate: "",
        images: []
    }

    try {
        var html = await fetch(url);
        html = await html.text();
        var $ = cheerio.load(html);

        // get title
        results.title = $("#gn").text();
        console.log("[#] Getting Details: " + results.title)

        // get pages
        var texts = $('.gdt2').map((i, section) => {
            return $(section).text();
        }).get();

        var pages = "";
        for (var i = 0; i < texts.length; i++) {
            if (texts[i].indexOf("pages") > -1) {
                pages = texts[i];
            }
        }
        pages = pages.split(" ");
        pages = pages[0];
        results.pages = pages;

        // get paginates
        texts = $('.ptt tbody tr td').map((i, section) => {
            return $(section).text();
        }).get();
        results.paginate = texts[texts.length - 2];

        // get firstpage images
        texts = $('.gdtm').map((i, section) => {
            return $(section).children("div").children("a").attr("href");
        }).get();

        for (var j = 0; j < texts.length; j++) {
            results.images.push(texts[j])
        }

        // get images on the other pages
        for (var i = 1; i < results.paginate; i++) {
            html = await fetch(url + "?p=" + i);
            html = await html.text();

            var $ = cheerio.load(html);
            texts = $('.gdtm').map((i, section) => {
                return $(section).children("div").children("a").attr("href");
            }).get();

            for (var j = 0; j < texts.length; j++) {
                results.images.push(texts[j])
            }
        }

        // scrap img src
        console.log("[#] Getting Images ...")
        var imageURL = await imagePages(results);

        if (imageURL.status == "success") {
            var filename = results.title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
            try {
                await fs.unlink("./history/" + filename + ".json");
            } catch (errr) {
                // do nothing
            }

            await fs.writeFile('./history/' + filename + '.json', JSON.stringify(imageURL.data, null, 2))

            console.log("[#] Getting Images URL Successful")
            resolve({
                status: "success",
                message: "",
                data: imageURL.data
            });

            // download files
            console.log("[#] Downloading Images Files ...")
            try {
                try {
                    await fs.mkdir('./downloads/' + imageURL.data.title.toString());
                } catch (err) {
                    await fs.rm('./downloads/' + imageURL.data.title.toString(), { recursive: true, force: true });
                    await fs.mkdir('./downloads/' + imageURL.data.title.toString());
                }

                for (var k = 0; k < imageURL.data.images.length; k++) {
                    var filename = imageURL.data.images[k].split("/").pop();
                    var result = await downloader.imageDownload(imageURL.data.images[k], './downloads/' + imageURL.data.title.toString() + '/' + filename)
                    if (result.status == "success") {
                        console.log("[#] Downloading Image Success: " + filename)
                    } else {
                        console.log("[#] Downloading Image Failed: " + filename)
                    }
                }

                console.log("[#] Downloading Images Files Successful")
                resolve({
                    status: "success",
                    message: "",
                    data: imageURL.data
                });
            } catch (errrr) {
                console.log("[#] Downloading Images Files Failed")
                resolve({
                    status: "error",
                    message: errrr,
                    data: imageURL.data
                });
            }
        } else {
            console.log("[#] Getting Images URL Failed")
            resolve({
                status: "error",
                message: data.message,
                data: {
                    title: results.title,
                    pages: results.pages,
                    paginate: results.paginate,
                    images: results.images
                }
            })
        }
    } catch (err) {
        resolve({
            status: "error",
            message: err,
            data: results
        })
    } 
});

const imagePages = (details) => new Promise (async (resolve, reject) => {
    var results = {
        title: details.title,
        pages: details.pages,
        paginate: details.paginate,
        images: []
    }

    try {
        for (var i = 0; i < details.images.length; i++) {
            var html = await fetch(details.images[i]);
            html = await html.text();
    
            var $ = cheerio.load(html);
            var texts = $('#img').attr("src");
    
            results.images.push(texts)
        }

        resolve({
            status: "success",
            message: "",
            data: results
        })
    } catch (err) {
        resolve({
            status: "error",
            message: err,
            data: results
        })
    }
});

module.exports = {pageReader}