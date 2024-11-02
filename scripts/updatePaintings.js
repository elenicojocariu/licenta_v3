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

        // Găsește toate documentele din colecție
        const cursor = collection.find();
        while (await cursor.hasNext()) {
            const document = await cursor.next();

            // Parcurge fiecare cheie de perioadă din document
            for (const periodKey in document) {
                if (Array.isArray(document[periodKey])) {
                    // Parcurge fiecare pictură din perioada respectivă
                    document[periodKey].forEach(painting => {
                        if (painting.artworks && Array.isArray(painting.artworks)) {
                            // Actualizează fiecare lucrare cu un UUID unic
                            painting.artworks = painting.artworks.map(artwork => ({
                                ...artwork,
                                paintingId: uuidv4()// Adaugă un UUID fiecărei lucrări
                            }));
                        }
                    });
                }
            }

            // Actualizează documentul în baza de date
            await collection.updateOne(
                { _id: document._id },
                { $set: document }
            );
        }
        console.log('Picturile au fost actualizate cu paintingId-uri unice.');
    } catch (err) {
        console.error('Eroare la actualizarea picturilor:', err);
    } finally {
        await client.close();
    }
};

//addPaintingId();
