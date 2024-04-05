var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")


//Routes will go here
module.exports = router;

router.post('/', async function(req, res, next){
    try {
        const con = require('../db/connection.js')();
        if(!req.body.email && !req.body.password){
            res.status(401).send({ error: 'Missing User Data' });
            return;
        }

        var baseQuery = "SELECT * FROM users WHERE email = ?";
        const [rows, fields] = await con.promise().execute(baseQuery, [req.body.email]);

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

        const token = jwt.sign({ email: req.body.email }, process.env.JWT_KEY, { expiresIn: '1h' });

        res.json({authToken:token});

        con.close();

    } catch (error) {
        next(error);
    }
 });