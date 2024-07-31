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


router.get('/', function (req, res, next) {
  res.send('Hello world!');
});

router.get('/agenda-items', authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const collection = database.collection('Agenda-items');
    const cursor = await collection.find({ userId: userId });
    const documents = await cursor.toArray();

    documents.sort((a, b) => {
      if (a.time === "") return 1;
      if (b.time === "") return -1;

      return a.time.localeCompare(b.time);
    });

    res.json(documents);
  } catch (error) {
    console.error('Error retrieving data from MongoDB:', error);
    res.status(500).json({ error: 'Error retrieving data from MongoDB' });
  }
});

router.get('/agenda-item/:activityId', authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const activityId = req.params.activityId;
    const objectId = new ObjectId(activityId);

    const collection = database.collection(`Agenda-items`);
    const document = await collection.findOne({ _id: objectId, userId: userId });

    res.json(document);
  } catch (error) {
    console.error('Error retrieving data from MongoDB:', error);
    res.status(500).json({ error: 'Error retrieving data from MongoDB' });
  }
});

router.post('/agenda-item/:activityId', authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const activityId = req.params.activityId;
    let objectId;
    if (activityId && ObjectId.isValid(activityId)) {
      objectId = new ObjectId(activityId);
    } else {
      objectId = new ObjectId();
    }

    const collection = database.collection(`Agenda-items`);

    const activity = req.body;
    const document = {
      _id: objectId,
      userId: userId,
      name: activity.name,
      category: activity.category,
      time: activity.time,
      date: activity.date,
      shortDescription: activity.shortDescription,
      label: activity.label,
    };
    await collection.updateOne(
      { _id: document._id },
      { $set: document },
      { upsert: true }
    );
    res.status(201).json({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error inserting data into MongoDB:', error);
    res.status(500).json({ error: 'Error inserting data into MongoDB' });
  }
});

router.delete('/agenda-item/:activityId', authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const activityId = req.params.activityId;
    const objectId = new ObjectId(activityId);

    const collection = database.collection(`Agenda-items`);

    await collection.deleteOne({ _id: objectId, userId: userId });

    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task from MongoDB:', error);
    res.status(500).json({ error: 'Error deleting task from MongoDB' });
  }
});


module.exports = router;
