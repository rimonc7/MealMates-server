require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }

    req.user = decoded;
    next();
  });
};


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Password}@cluster0.by2cb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({ success: true });
    });


    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      })
        .send({ success: true })
    })

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

    app.get('/foods/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const food = await foodCollection.findOne(query);
      res.send(food)
    })

    app.get('/foodReq', verifyToken, async (req, res) => {
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

    app.patch('/foodRequest/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: data.status
        }
      }
      const result = await foodReqCollection.updateOne(filter, updatedDoc);
      res.send(result)
    })

    app.put('/updateFood/:id', async (req, res) => {
      const { id } = req.params
      const food = req.body;
      const filter = { _id: new ObjectId(id) }
      const updateFood = {
        $set: {
          foodName: food.foodName,
          foodImage: food.foodImage,
          foodQuantity: food.foodQuantity,
          pickupLocation: food.pickupLocation,
          expiredDateTime: food.expiredDateTime,
          additionalNotes: food.additionalNotes,
          donatorImage: food.donatorImage,
          donatorName: food.donatorName,
          donatorEmail: food.donatorEmail,
          foodStatus: food.foodStatus
        }
      }
      const result = await foodCollection.updateOne(filter, updateFood)
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