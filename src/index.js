const scrapper = require('./scrapper.js')

const fs = require('fs').promises;
const readline = require('readline-sync')
const ping = require('ping')

async function exists (path) {  
    try {
        await fs.access(path)
        return true
    } catch {
        return false
    }
}

const readFile = () => new Promise (async (resolve, reject) => {
    try {
        // checking directory
        if (await exists("./downloads") == false) {
            await fs.mkdir('./downloads');
        }

        if (await exists("./history") == false) {
            await fs.mkdir('./history');
        }

        // checking url file
        var urls = await fs.readFile('./url.txt', 'utf8');
        urls = urls.toString().split('\r\n');

        while(urls.length == 1 && urls[0] == "") {
            console.log("[#] URL File is Empty")
            var terminal = readline.question("[#] Insert URL On url.txt, Press ENTER to Continue ...")

            urls = await fs.readFile("./url.txt", "utf8");
            urls = urls.toString().split("\r\n");
        }

        resolve({
            status: "success",
            message: "Read File Success",
            data: urls
        })
    } catch (err) {
        await fs.writeFile("./url.txt", "", "utf8");
        var urls = await fs.readFile("./url.txt", "utf8");
        urls = urls.toString().split('\r\n');

        while (urls.length == 1 && urls[0] == "") {
            console.log("[#] URL File is Empty")
            var terminal = readline.question("[#] Insert URL On url.txt, Press ENTER to Continue ...")

            urls = await fs.readFile("./url.txt", "utf8");
            urls = urls.toString().split('\r\n');
        }

        resolve({
            status: "success",
            message: "Write File Success",
            data: urls
        })
    }
});

(async () => {
    console.log("[#] Checking Connection ...")
    var connection = await ping.promise.probe('e-hentai.org');
    if (connection.host != connection.inputHost) {
        console.log("[#] Your Connection is Not Secure, Try to Use VPN Connection")
    } else {
        console.log("[#] Connection Secure")        
        console.log("[#] Reading URL File ...")
        var read = await readFile();
        if (read.status == "success") {
            console.log("[#] Reading File Successful");

            for (var i = 0; i < read.data.length; i++) {
                await scrapper.pageReader(read.data[i]);
            }
        } else {
            console.log("[#] Reading File Failed");
        }
    }
})();