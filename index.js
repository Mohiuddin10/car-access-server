const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
    origin: ['http://localhost:5173/'],
    credentials: true
}));
app.use(express.json());


console.log(process.env.DB_Pass);

const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_Pass}@cluster0.yda2co5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db("carAccess").collection("services");
        const bookingCollection = client.db("carAccess").collection("bookings");

        // auth retaled api 

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1h"})
            res
            .cookie("token", token, {
                httpOnly: true,
                secure: false,
                sameSite: "none",
            })
            .send({success: true});
        })
        // services related api 
        app.get("/services", async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            // ja ja lagbe, kich lagle value hobe 1 ar na lagle value hobe 0 
            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 }
            }

            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })

        // booking 
        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })

        app.get("/bookings", async (req, res) => {
            console.log(req.query.email);
            let query = {};
            if (req.query?.email){
                query = {email: req.query.email}
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await bookingCollection.deleteOne(query);
            res.send(result)
        })

        app.patch("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updatedBooking = req.body;
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            }
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("server is running")
})

app.listen(port, () =>
    console.log(`server is running in port: ${port}`))
