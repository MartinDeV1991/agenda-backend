var express = require('express');
var router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403);

        req.user = user;
        next();
    });
};

const uri = process.env.mongo_path;
let database;
(async function () {
    const client = new MongoClient(uri);
    await client.connect();
    database = client.db('Agenda');
})();


router.get('/finance-items', authenticateToken, async (req, res) => {
    try {
        const userId = new ObjectId(req.user.userId);
        const collection = database.collection('Finance-items');
        const cursor = await collection.find({ userId: userId });
        const documents = await cursor.toArray();
        res.json(documents);
    } catch (error) {
        console.error('Error retrieving data from MongoDB:', error);
        res.status(500).json({ error: 'Error retrieving data from MongoDB' });
    }
});

router.get('/account-mapping', authenticateToken, async (req, res) => {
    try {
        const userId = new ObjectId(req.user.userId);
        const collection = database.collection('Account-mapping');
        const cursor = await collection.find({ userId: userId });
        const documents = await cursor.toArray();
        res.json(documents);
    } catch (error) {
        console.error('Error retrieving data from MongoDB:', error);
        res.status(500).json({ error: 'Error retrieving data from MongoDB' });
    }
});

router.post('/finance-item/:financeId', authenticateToken, async (req, res) => {
    try {
        const userId = new ObjectId(req.user.userId);
        const financeId = req.params.financeId;
        let objectId;

        if (financeId && ObjectId.isValid(financeId)) {
            objectId = new ObjectId(financeId);
        } else {
            objectId = new ObjectId(); // Generate a new ObjectId if financeId is null or invalid
        }
        const collection = database.collection(`Finance-items`);

        const document = {};
        for (let propertyName in req.body) {
            if (req.body.hasOwnProperty(propertyName)) {
                document[propertyName] = req.body[propertyName];
            }
        }
        document.userId = userId

        delete document._id;
        await collection.updateOne(
            { _id: objectId },
            { $set: document },
            { upsert: true }
        );
        res.status(201).json({ message: 'Data inserted successfully' });
    } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
        res.status(500).json({ error: 'Error inserting data into MongoDB' });
    }
});


module.exports = router;
