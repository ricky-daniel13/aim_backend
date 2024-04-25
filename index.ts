import express, { Express, Request, Response, NextFunction } from "express";
import cors from 'cors';
import dotenv from "dotenv";
dotenv.config();

process.env.TZ = 'UTC';

const app: Express = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//Import the login router
import login from "./src/routes/login";
app.use('/login', login);

app.get("/", (request: Request, response: Response) => {
  const status = {
    Status: "Running",
  };

  response.send(status);
});

//Import the auth middleware
import auth from "./src/middleware/auth";
app.use(auth);

app.get("/authed", (request: Request, response: Response) => {
  const status = {
    Status: "Authed",
  };

  response.send(status);
});
/*
//------- Any routes forward need to be authorized -------
var inv = require('./src/routes/invoices.js');
app.use('/invoices', inv);

var clients = require('./src/routes/clients.js');
app.use('/clients', clients);

var products = require('./src/routes/products.js');
app.use('/products', products); */

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
const jsonErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log("Error: ", err);
  res.status(500).send({ error: err });
};
app.use(jsonErrorHandler);
const json404Handler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).send({ error: "Route not found" });
};
app.use(json404Handler);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
  console.log("Server started at: ", new Date(Date.now()).toUTCString());
});
