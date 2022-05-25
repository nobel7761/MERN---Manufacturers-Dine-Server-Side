const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("manufacturers");
});

app.listen(port, () => {
  console.log("Server Running...");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.65d9i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("manufacturers-dine").collection("tools");
    const ordersCollection = client
      .db("manufacturers-dine")
      .collection("orders");
    const reviewsCollection = client
      .db("manufacturers-dine")
      .collection("reviews");
    const userCollection = client.db("manufacturers-dine").collection("users");

    //getting all the tools
    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });

    //getting tool by id
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await toolsCollection.findOne(query);
      res.send(product);
    });

    //placing an order
    app.post("/order-placing", async (req, res) => {
      const newOrder = req.body;
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result);
    });

    //getting all reviews
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //create users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //updating user profile
    app.put("/userprofile/:email", async (req, res) => {
      const email = req.params.email;
      const updateInfo = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          address: updateInfo.address,
          education: updateInfo.education,
          phone: updateInfo.phone,
          linkedin: updateInfo.linkedin,
        },
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    //getting single user by the email!
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const product = await userCollection.findOne(query);
      res.send(product);
    });
  } finally {
  }
}

run().catch(console.dir);
