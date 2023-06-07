const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000


// middleware.....
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello form WWA Project Service')
})

app.listen(port, () => {
  console.log(`The website API is runing For  WWA Project Service: ${port}`)
})
