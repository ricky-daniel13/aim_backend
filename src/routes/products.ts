import express, { Express, Request, Response, NextFunction } from "express";
import { Product } from "../types/product";
import { RowDataPacket } from "mysql2";
import dbConn from "../db/connection";
const router = express.Router();


//Routes will go here
export default router;

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
    if(req.user!.isClient){
        res.status(403).send({ error: 'User isn\'t allowed to make this action' });
        return;
    }

    try {
        const con = dbConn().promise();

        let baseQuery = "SELECT * FROM products";

        try {
            const [rows] = await con.query<RowDataPacket[]>(baseQuery);
            console.log("Result: ", rows);
            const products: Product[] = [];
            rows.forEach(row => {
                products.push({
                    id : row['id'],
                    name : row['name'],
                    price : row['price']
                });
            });

            res.status(200).send(products);
        } catch (error) {
            console.log(error);
            res.status(500).send({error:"Internal Server Error"});
        } finally {
            con.end();
        }

    } catch (error) {
        next(error);
        return;
    }
});