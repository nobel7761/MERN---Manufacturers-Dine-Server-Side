const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("manufacturers");
});

app.listen(port, () => {
  console.log("Server Running on PORT....");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.65d9i.mongodb.net/?retryWrites=true&w=majority`;
console.log(process.env.DB_USER, process.env.DB_PASSWORD);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("manufacturers-dine").collection("tools");
    const ordersCollection = client.db("manufacturers-dine").collection("orders");
    const reviewsCollection = client.db("manufacturers-dine").collection("reviews");
    const userCollection = client.db("manufacturers-dine").collection("users");










    /* ===========================================
               POST METHODS
   ==============================================*/
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

    //getting all reviews
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //getting all users
    app.get("/users", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    //getting single user by the email!
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const product = await userCollection.findOne(query);
      res.send(product);
    });

    //getting my orders by email
    app.get("/myOrders", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decoded = req.decoded.email;
      if (email === decoded) {
        const query = { email: email };
        const cursor = ordersCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    });

    //getting all orders
    app.get("/orders", async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    //getting single order using id
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });












    /* ===========================================
                POST METHODS
    ==============================================*/


    //add a review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    //add new tool
    app.post("/tool", async (req, res) => {
      const tool = req.body;
      const result = await toolsCollection.insertOne(tool);
      res.send(result);
    });

    //add an order
    app.post("/order-placing", async (req, res) => {
      const newOrder = req.body;
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result);
    });




    /* ===========================================
                PUT METHODS
    ==============================================*/




    //updating user profile
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const updateInfo = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: updateInfo,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });


    //update order shipment condition to shipped
    app.put("/shipmentCondition/:id", async (req, res) => {
      const id = req.params.id;
      const updateInfo = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: updateInfo,
      };
      const result = await ordersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send({ result, token });
    });




    //updating user as admin
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updatedDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updatedDoc);

        res.send(result);
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    });





    /* ===========================================
                DELETE METHODS
    ==============================================*/




    //remove single tool
    app.delete("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    })










    /*=================================================== 
    payment
    =====================================================*/
    app.get('/order', async (req, res) => {
      const query = {}
      const result = await BookingCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/order', async (req, res) => {
      const email = req.query.email
      const query = { userEmail: email }
      const result = await BookingCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/pay/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.findOne(query);
      res.send(result)
    })





    app.put('/order/:id', async (req, res) => {
      const payment = req.body
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.TransactionID
        }
      }
      const result = await BookingCollection.updateOne(filter, updateDoc, options);

      res.send(result)
    })

    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const result = await BookingCollection.deleteOne(query);
      res.send(result)
    })




  } finally {
  }
}

run().catch(console.dir);
