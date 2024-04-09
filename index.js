const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

process.env.TZ = 'UTC';

const app = express();

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Import the login router
var login = require('./src/routes/login.js');
app.use('/login', login);

//Import the S3 serving router
var serve = require('./src/routes/serve.js');
app.use('/serve', serve);

app.get("/", (request, response) => {
  const status = {
    Status: "Running",
  };

  response.send(status);
});

//Import the auth middleware
var auth = require('./src/middleware/token.js');
app.use(auth);

//------- Any routes forward need to be authorized -------
var inv = require('./src/routes/invoices.js');
app.use('/invoices', inv);

var clients = require('./src/routes/clients.js');
app.use('/clients', clients);

var products = require('./src/routes/products.js');
app.use('/products', products);

//Internal function for hashing passwords.
/*
app.post("/pass", async (request, response) => {

  const hashedPassword = await bcrypt.hash(request.body.pass, 10);

  let verified = false;

  if (request.body.passHash)
    verified = await bcrypt.compare(request.body.pass, request.body.passHash);

  const status = {
    hashed: hashedPassword,
    verified: verified
  };


  response.send(status);
});*/



//Error Handler
const jsonErrorHandler = (err, req, res, next) => {
  console.log("Error: ", err);
  res.status(500).send({ error: err });
};
app.use(jsonErrorHandler);
const json404Handler = (req, res, next) => {
  res.status(404).send({ error: "Route not found" });
};
app.use(json404Handler);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
  console.log("Server started at: ", new Date(Date.now()).toUTCString());
});
