const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000
const { ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);

// middleware.....
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


//MonogoDB
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wfpjg4p.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const userCollection = client.db("wwaDB").collection("users");
    const coursesCollection = client.db("wwaDB").collection("courses");
    const instructorsCollection = client.db("wwaDB").collection("instructors");
    const bookingCollection = client.db("wwaDB").collection("bookings");
    const paymentCollection = client.db("wwaDB").collection("payments");

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })


    // Langouses Courses related apis............................
    app.get('/courses', async (req, res) => {
      const email = req.query.email;
      // const id = req.query.id;
      if (email) {
        const query = { email: email }
        const result = await coursesCollection.find(query).toArray();
        res.send(result);
      }
      // else if(id){
      //   const query = { _id: id }
      //   const result = await coursesCollection.find(query).toArray();
      //   res.send(result);
      // }
      else {
        // const result = await coursesCollection.find().toArray();
        const result = await coursesCollection.find().sort({ available_set: 1 }).limit(6).toArray();
        res.send(result);
      }

    })
    app.get('/course/:id', async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) }
      // console.log(id);
      const selectedCoures = await coursesCollection.findOne(quary);
      res.send(selectedCoures);
    })
    // app.get('/courses', async (req, res) => {
    //   const id = req.query.id;
    //   console.log(id)
    //   // const email = req.query.email;
    //   // if (id) {
    //   //   const query = { _id: id }
    //   //   const result = await coursesCollection.find(query).toArray();
    //   //   res.send(result);
    //   // }
    //   // if (email) {
    //   //   const query = { email: email }
    //   //   const result = await coursesCollection.find(query).toArray();
    //   //   res.send(result);
    //   // }

    //   const query = { _id: id }
    //   const result = await coursesCollection.find(query).toArray();
    //   res.send(result);

    // })
    // app.get('/courses', verifyJWT, async (req, res) => {
    //   const email = req.query.email;
    //   // console.log(email)
    //   if (!email) {
    //     res.send([]);
    //   }

    //   // verify...
    //   const decodedEmail = req.decoded.email
    //   if (email !== decodedEmail) {
    //     return res.status(403).send({ error: true, message: 'Porviden access' })
    //   }

    //   const query = { email: email }
    //   const result = await coursesCollection.find(query).toArray();
    //   res.send(result);
    // })
    app.post('/courses', async (req, res) => {
      const newItem = req.body;
      // console.log(newItem)
      const result = await coursesCollection.insertOne(newItem)
      res.send(result);
    })

    app.put('/updateCourse/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      // console.log(data);

      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedCourse = {
        $set: {
          name: data.name,
          disp: data.disp,
          instroctor: data.instroctor,
          price: data.price,
          set: data.set,
          email: data.email
        }
      }

      const result = await coursesCollection.updateOne(filter, updatedCourse, options);
      res.send(result);

    })

    app.patch('/courses/admin/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Approved'
        },
      };

      const result = await coursesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const id = req.query.id;
      console.log(id)
      if (email) {
        const query = { bookerEmail: email }
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      }
      else if (id) {
        const query = { _id: id }
        // const result = await bookingCollection.find(query).toArray();
        // console.log(query)
        // res.send(result);
        try {
          const result = await bookingCollection.find(query).toArray();
          // console.log(result);
          res.send(result);
        } catch (error) {
          // console.log(error);
          // Handle the error accordingly
        }
      }

    })
    // app.get('/bookings', async (req, res) => {
    //   const email = req.query.email;
    //   // console.log(email)
    //   if (!email) {
    //     res.send([]);
    //   }
    //   const query = { bookerEmail: email }
    //   const result = await bookingCollection.find(query).toArray();
    //   res.send(result);
    // })
    app.post('/bookings', async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await bookingCollection.insertOne(item);
      res.send(result);
    })
    app.get('/payments', async (req, res) => {
      const email = req.query.email;
      // console.log(email)
      if (!email) {
        res.send([]);
      }
      const query = { email: email }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })
    // create payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = price * 100
      // console.log(amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })
    // payment related api
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);

      const query = { _id: { $in: payment.bookingItems.map(id => new ObjectId(id)) } }
      const deleteResult = await bookingCollection.deleteMany(query)

      res.send({ insertResult, deleteResult });
      // res.send(insertResult)
    })




    // Instructors related apis................................

    app.get('/instructors', async (req, res) => {
      // const result = await instructorsCollection.find().toArray();
      const result = await instructorsCollection.find().sort({ studentNumber: -1 }).limit(6).toArray();
      res.send(result);
    })




    // users related apis..........................................

    app.get('/users', async (req, res) => {
      const email = req.query.email;
      if (email) {
        const query = { email: email }
        const result = await userCollection.find(query).toArray();
        res.send(result);
      } else {
        const result = await userCollection.find().toArray();
        res.send(result);
      }

    });

    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const user = await userCollection.findOne(query);
      res.send(user);
    })

    // app.post('/users', async (req, res) => {
    //   const user = req.body;
    //   // console.log(user);
    //   const query = { email: user.email }
    //   const existingUser = await userCollection.findOne(query);

    //   if (existingUser) {
    //     return res.send({ message: 'User already exists' })
    //   }

    //   const result = await userCollection.insertOne(user);
    //   res.send(result);
    // })
    // app.get('/users', async (req, res) => {
    //   const email = req.query.email;
    //   console.log(email)
    //   if (!email) {
    //     res.send([]);
    //   }

    //   const query = { email: email }
    //   const result = await userCollection.find(query).toArray();
    //   res.send(result);
    // })

    // Admin Panel API................................. ................. 

    // security layer: verifyJWT
    // email same
    // check admin
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'Admin' }
      res.send(result);
    })
    app.get('/users/instructor/:email', verifyJWT,  async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'Instructor' }
      res.send(result);
    })

    // Define the route to handle the PATCH request
    app.patch('/users/:id', async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;
      // console.log(id, role)

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
   
    });


    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Admin'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Instructor'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })



    //All Delete API is here................................. ................. 

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const result = await userCollection.deleteOne(query);
      res.send(result)
    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) }
      // console.log(query)
      const result = await bookingCollection.deleteOne(query);
      // console.log(result)
      res.send(result)
    })

    app.delete('/courses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const result = await coursesCollection.deleteOne(query);
      res.send(result)
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
  res.send('Hello form WWA Project Service')
})

app.listen(port, () => {
  console.log(`The website API is runing For  WWA Project Service: ${port}`)
})
