const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

//const MongoClient = require('mongodb').MongoClient;
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let processedCount = 0; // Contor pentru imagini procesate
const saveFrequency = 100; // Salvare după fiecare 100 de imagini

// MongoDB connection
const dbURI = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
if (!dbURI) {
    throw new Error('MONGODB_URI is not defined in .env file');
}

async function extractAndOptimizeImages() {
    const { default: pLimit } = await import('p-limit');
    const limit = pLimit(5); // Limitează la 5 operații simultane

    const client = new MongoClient(dbURI);

    try {
        await client.connect();
        console.log("Connected correctly to server");

        const db = client.db(dbName);
        const collection = db.collection('data');

        // Folosim un cursor pentru a parcurge documentele
        const cursor = collection.find();
        let optimizedImages = loadOptimizedImages();
        let promises = [];

        while (await cursor.hasNext()) {
            const document = await cursor.next();
            for (const period in document) {
                if (Array.isArray(document[period])) {  // Ensure it's an array
                    for (const item of document[period]) {
                        if (item.artworks && Array.isArray(item.artworks)) {  // Ensure artworks is an array
                            for (const artwork of item.artworks) {
                                const imageUrl = artwork.image;
                                promises.push(limit(() => processImage(imageUrl, optimizedImages)));

                                if (promises.length >= saveFrequency) {
                                    await Promise.all(promises);
                                    saveBatchResults(optimizedImages);
                                    promises = [];
                                    if (global.gc) global.gc(); // Forțează colectarea gunoiului
                                }
                            }
                        }
                    }
                }
            }
        }

        // Procesăm restul imaginilor rămase
        if (promises.length > 0) {
            await Promise.all(promises);
            saveBatchResults(optimizedImages);
            if (global.gc) global.gc(); // Forțează colectarea gunoiului
        }

        console.log("All images optimized and saved");

    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

function loadOptimizedImages() {
    if (fs.existsSync('optimizedImages.json')) {
        const data = fs.readFileSync('optimizedImages.json');
        return JSON.parse(data);
    }
    return [];
}

function saveBatchResults(optimizedImages) {
    fs.writeFileSync('optimizedImages.json', JSON.stringify(optimizedImages, null, 2));
    console.log(`Optimized images saved to optimizedImages.json`);
}

async function processImage(imageUrl, optimizedImages) {
    try {
        const imageBuffer = await downloadImage(imageUrl);

        // Verifică dacă imaginea este validă
        await sharp(imageBuffer).metadata();

        const optimizedImageBuffer = await optimizeImage(imageBuffer);
        const optimizedImageBase64 = optimizedImageBuffer.toString('base64');
        optimizedImages.push({
            oldUrl: imageUrl,
            newBase64: optimizedImageBase64
        });

        processedCount++;
        if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount} images so far...`);
        }

    } catch (err) {
        console.error(`Failed to process image ${imageUrl}:`, err.message);
        // Optionally, save the failed URL for further inspection
        fs.appendFileSync('failedImages.log', `${imageUrl}\n`);
    }
}

async function optimizeImage(imageBuffer) {
    try {
        const optimizedImageBuffer = await sharp(imageBuffer).resize(800).jpeg({ quality: 80 }).toBuffer();
        // Eliberează memoria pentru buffer-ul original
        imageBuffer = null;
        return optimizedImageBuffer;
    } catch (err) {
        throw new Error(`Failed to optimize image: ${err.message}`);
    }
}

async function downloadImage(url) {
    try {
        const response = await axios({
            url,
            responseType: 'arraybuffer',
            maxContentLength: Infinity,  // No limit on content length
            maxBodyLength: Infinity      // No limit on body length
        });
        return Buffer.from(response.data, 'binary');
    } catch (err) {
        throw new Error(`Failed to download image from ${url}: ${err.message}`);
    }
}

// Log memory usage every 10 seconds
setInterval(() => {
    const used = process.memoryUsage();
    console.log(`Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 10000);

extractAndOptimizeImages().catch(console.dir);
