const jwt = require('jsonwebtoken');

//Token Middleware
module.exports = async function (req, res, next) {
    if (!req.headers.authorization) {
        res.status(403).send({ error: "Missing Access Token" });
        return;
    }

    let token = req.headers.authorization.split(" ")[1];
    let baseQuery = "SELECT u.email, u.is_client, c.name FROM users AS u LEFT JOIN clients AS C on u.email = c.user_email WHERE email = ?";

    try {
        const con = require('../db/connection.js')();
        const decoCode = jwt.verify(token, process.env.JWT_KEY);
        console.log("Token: ", decoCode)
        
        const [rows, fields] = await con.promise().execute(baseQuery, [decoCode.email]);
 
        if (rows.length < 1) {
            res.status(403).send({ error: "Catastrofic error" });
            return;
        }
 
        req.user = {
            email: rows[0].email,
            isClient: rows[0].is_client == true,
            name: rows[0].name
        }

        console.log(req.user);

        con.close();
        console.log("Returning");
        next();

    } catch (error) {
        console.log("Token decoding error: ", error);
        res.status(403).send({ error: "Invalid Token" });
    } finally {
        console.log("Closing connection");
        
    }
};