var express = require('express');
var router = express.Router();


//Routes will go here
module.exports = router;

router.get('/', async function (req, res, next) {
    if(req.user.isClient){
        res.status(403).send({ error: 'User isn\'t allowed to make this action' });
        return;
    }

    try {
        const con = require('../db/connection.js')().promise();

        let baseQuery = "SELECT * FROM products";

        try {
            const [rows] = await con.query(baseQuery);
            console.log("Result: ", rows);
            const products = [];
            rows.forEach(row => {
                products.push({
                    id : row.id,
                    name : row.name,
                    price : row.price
                });
            });

            res.status(200).send(products);
        } catch (error) {
            console.log(error);
            res.status(500).send({error:"Internal Server Error"});
        } finally {
            con.close();
        }

    } catch (error) {
        next(error);
        return;
    }
});