const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());

const uri = 'mongodb+srv://job_hunter:WFylTUHg2zhWQV50@cluster0.by2cb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const foodCollection = client.db('foodPortal').collection('foods');
    const subscriberCollection = client.db('foodPortal').collection('subscribers');
    const foodReqCollection = client.db('foodPortal').collection('foodRequest');

    app.get('/foods', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;

      const email = req.query.email;
      let query = {}
      if (email) {
        query = { donatorEmail: email }
      }
      const cursor = foodCollection.find(query).sort({ expiredDateTime: 1 }).limit(limit);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const food = await foodCollection.findOne(query);
      res.send(food)
    })

    app.get('/foodReq', async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query = { email: email };
      }
      const cursor = foodReqCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });


    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.deleteOne(query);
      res.send(result)
    })

    app.post('/foods', async (req, res) => {
      const newFood = req.body;
      const result = await foodCollection.insertOne(newFood);
      res.send(result)
    })

    app.post('/foodReq', async (req, res) => {
      const foodReq = req.body;
      const result = await foodReqCollection.insertOne(foodReq);
      res.send(result)
    })

    app.post('/subscribers', async (req, res) => {
      const email = req.body.email;

      try {
        const existingSubscriber = await subscriberCollection.findOne({ email });

        if (existingSubscriber) {
          return res.status(400).json({ message: 'This email is already subscribed.' });
        }
        const result = await subscriberCollection.insertOne({ email });
        res.status(200).json({ message: 'Subscriber added successfully!' });
      } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    });


    app.patch('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          additionalNotes: data.additionalNotes
        }
      }
      const result = await foodCollection.updateOne(filter, updatedDoc);
      res.send(result)
    })


    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('MealMates Server is Running')
})

app.listen(port, () => {
  console.log(`MealMates Server Running on Port ${port}`)
})