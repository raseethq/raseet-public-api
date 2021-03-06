const express = require('express');
var cors = require("cors");
var bodyParser = require("body-parser");

const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PUBLIC_API_PORT;

//imports
const hspaRoutes = require('./hspa/routes/hspaRoutes')
const euaRoutes = require('./eua/routes/euaRoutes')
// pool takes the object above -config- as parameter
const pool = require('./dbconn')
const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use('/hspa', hspaRoutes)
app.use('/eua', euaRoutes)

app.get('/', (req, res) => {
  res.send({ message: 'endpoint working' });
});

app.get('/eau', (req, res) => {
  console.log(req.query)
  res.send({ message: 'endpoint working'})
})
app.post('/eau', (req, res) => {
  console.log(req.body)
  res.send({ message: 'endpoint working'})
})

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});
