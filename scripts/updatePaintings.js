//const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI ;

const addPaintingId = async () => {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB_NAME );
        const collection = db.collection('data');

        // toate documentele din colectie
        const cursor = collection.find();
        while (await cursor.hasNext()) {
            const document = await cursor.next();

            //parcurg cheile
            for (const periodKey in document) {
                if (Array.isArray(document[periodKey])) {
                    // apoi picturile
                    document[periodKey].forEach(painting => {
                        if (painting.artworks && Array.isArray(painting.artworks)) {
                            // pun uuid unic
                            painting.artworks = painting.artworks.map(artwork => ({
                                ...artwork,
                                paintingId: uuidv4()
                            }));
                        }
                    });
                }
            }

            // actualizez doc in bd
            await collection.updateOne(
                { _id: document._id },
                { $set: document }
            );
        }
        console.log('Paintings updated with unique paintingId');
    } catch (err) {
        console.error('Error at updating the paintings', err);
    } finally {
        await client.close();
    }
};

//addPaintingId();
