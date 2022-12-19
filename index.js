const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tbyvndu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('aqibAmanAcademyDb').collection('services');
        const reviewCollection = client.db('aqibAmanAcademyDb').collection('reviews');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        });
        app.get('/homeServices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const homeServices = await cursor.sort({ _id: -1 }).limit(3).toArray();
            console.log(homeServices);
            res.send(homeServices);
        });
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.sort({ _id: -1 }).toArray();
            res.send(services);
        });
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });
        app.post('/services', async (req, res) => {
            const addservice = req.body;
            const result = await serviceCollection.insertOne(addservice);
            res.send(result);
        });
        app.get('/reviews', async (req, res) => {
            let query = {};
            if (req.query.training_id) {
                query = {
                    training_id: req.query.training_id
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.sort({ _id: -1 }).toArray();
            res.send(reviews);
        })

        app.post('/reviews', async (req, res) => {
            const addreview = req.body;
            const result = await reviewCollection.insertOne(addreview);
            res.send(result);

        });

        app.get('/myreviews', verifyJWT, async (req, res) => {
            const query = { email: req.query.email }
            const cursor = reviewCollection.find(query);
            const services = await cursor.sort({ _id: -1 }).toArray()
            res.send(services);
        });

        app.delete('/myreviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        app.put("/myreviews/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const oldReview = req.body;
            const option = { upsert: true }
            const updatedReview = {
                $set: {
                    training_id: oldReview.training_id,
                    title: oldReview.title,
                    rating: oldReview.rating,
                    review: oldReview.review,
                    displayName: oldReview.displayName,
                    email: oldReview.email,
                    photoURL: oldReview.photoURL
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedReview, option)
            res.send(result);
        })
    }

    finally {

    }
}

run().catch(e => console.error(e))



app.get('/', (req, res) => {
    res.send('Aqib Aman Academy server is running')
})

app.listen(port, () => {
    console.log(`Aqib Aman Academy server running on ${port}`);
})