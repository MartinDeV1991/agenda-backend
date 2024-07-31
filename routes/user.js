var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const uri = process.env.mongo_path;
const jwtSecret = process.env.JWT_SECRET;

let database;
(async function () {
    const client = new MongoClient(uri);
    await client.connect();
    database = client.db('Agenda');
})();


router.post('/signup', async (req, res) => {

    try {
        const collection = database.collection(`Users`);
        const account = req.body;
        const document = {
            firstName: account.firstName,
            lastName: account.lastName,
            email: account.email,
            password: account.password,
            createdAt: new Date()
        };
        const result = await collection.insertOne(document);
        if (result.acknowledged) {
            res.status(201).json({
                message: 'User account created successfully',
                userId: result.insertedId
            });
        } else {
            throw new Error('Failed to insert document');
        }

    } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
        res.status(500).json({ error: 'Error inserting data into MongoDB' });
    }
});

router.post('/login', async (req, res) => {
    console.log("loggin in");
    const { email, password } = req.body;
    try {
        const collection = database.collection('Users');
        const user = await collection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = password === user.password;
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;