const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');
dotenv.config();

const uri = 'mongodb+srv://elenicojocariu24:Wfwdx3DFdJBtFxJm@cluster0.kuybvii.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
;

if (!uri) {
    throw new Error("MongoDB connection string is not defined. Please set the connection string.");
}

MongoClient.connect(uri, async (err, client) => {
    if (err) throw err;

    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection("data");

    const cursor = collection.find();
    const bulkOps = [];

    while (await cursor.hasNext()) {
        const doc = await cursor.next();

        let uniqueArtworks = [];
        let seen = new Set();
        let hasDuplicates = false;

        for (const periodKey in doc) {
            if (Array.isArray(doc[periodKey])) {
                doc[periodKey].forEach(artist => {
                    if (artist.artworks && Array.isArray(artist.artworks)) {
                        artist.artworks.forEach(artwork => {
                            const uniqueKey = `${artwork.title}_${artwork.image}`;
                            if (seen.has(uniqueKey)) {
                                hasDuplicates = true;
                                console.log(`Found duplicate artwork: ${uniqueKey}`);
                            } else {
                                seen.add(uniqueKey);
                                uniqueArtworks.push(artwork);
                            }
                        });
                        artist.artworks = uniqueArtworks;
                        uniqueArtworks = [];
                        seen.clear();
                    }
                });
            }
        }

        if (hasDuplicates) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: doc }
                }
            });
            console.log(`Duplicates found for document with _id: ${doc._id}. Adding to bulkOps for update.`);
        }

        if (bulkOps.length === 1000) {
            await collection.bulkWrite(bulkOps);
            bulkOps.length = 0;
            console.log("Bulk write operation performed.");
        }
    }

    if (bulkOps.length > 0) {
        await collection.bulkWrite(bulkOps);
        console.log("Final bulk write operation performed.");
    }

    console.log("Duplicates processed and removed.");
    client.close();

});
