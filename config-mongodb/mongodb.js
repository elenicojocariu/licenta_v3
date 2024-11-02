const MONGODB_URI = "mongodb+srv://elenicojocariu24:Wfwdx3DFdJBtFxJm@cluster0.kuybvii.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB_NAME = "art";

const MongoClient = require('mongodb').MongoClient;

let db;

const connectToDatabase = async () => {
    if (db) {
        console.log('Using existing MongoDB connection');

        return db;
    } // Returnează conexiunea existentă dacă există

    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(MONGODB_DB_NAME);
        console.log(`Connected to MongoDB database: ${MONGODB_DB_NAME}`);
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

/*
app.get('/test-mongodb', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const result = await db.admin().ping();
        res.status(200).json({ message: 'MongoDB connection is working', result });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        res.status(500).json({ message: 'Failed to connect to MongoDB', error: err });
    }
});
*/

module.exports = {connectToDatabase};