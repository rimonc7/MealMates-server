const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');


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

    app.post('/foods', async (req, res) => {
      const newFood = req.body;
      const result = await foodCollection.insertOne(newFood);
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