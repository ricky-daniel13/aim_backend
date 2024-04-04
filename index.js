const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response) => {
  const status = {
    Status: "Running",
  };

  response.send(status);
});

app.post("/pass", async (request, response) => {
    
    const hashedPassword = await bcrypt.hash(request.body.pass, 10);

    let verified = false;

    if(request.body.passHash)
        verified = await bcrypt.compare(request.body.pass, request.body.passHash);

    const status = {
        hashed: hashedPassword,
        verified: verified
      };

  
    response.send(status);
  });

const jsonErrorHandler = (err, req, res, next) => {
    res.status(500).send({ error: err });
  };
app.use(jsonErrorHandler);

const json404Handler = (req, res, next) => {
    res.status(404).send({error:"Route not found"});
  };
app.use(json404Handler);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
  console.log("Server started at: ", new Date(Date.now()).toUTCString());
});
