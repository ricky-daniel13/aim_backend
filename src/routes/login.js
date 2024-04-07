var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")


//Routes will go here
module.exports = router;

router.post('/', async function(req, res, next){
    try {
        const con = require('../db/connection.js')();
        console.log("Trying to log in");
        if(!req.body.email && !req.body.password){
            res.status(400).send({ error: 'Missing User Data' });
            return;
        }

        let baseQuery = "SELECT * FROM users WHERE email = ?";
        const [rows] = await con.promise().query(baseQuery, [req.body.email]);

        if(rows.length < 1){
            res.status(401).send({ error: 'Incorrect User Data' });
            return;
        }

        console.log("Result: ", rows);

        const validPassword = await bcrypt.compare(req.body.password, rows[0].password);

        if(!validPassword){
            res.status(401).send({ error: 'Incorrect User Data' });
            return;
        }

        let name = req.body.email;

        if(rows[0].is_client==1){
            baseQuery = "SELECT * FROM clients WHERE user_email = ?";
            const [clientRows] = await con.promise().query(baseQuery, [req.body.email]);
            name = clientRows[0].name;
        }

        const token = jwt.sign({ email: req.body.email }, process.env.JWT_KEY, { expiresIn: '1h' });

        res.json({authToken:token, name:name, isClient:rows[0].is_client==1});

        con.close();

    } catch (error) {
        next(error);
    }
 });