import express, { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken"
import dbConn from "../db/connection";
import { RowDataPacket } from "mysql2";
import { TokenPayload } from "../types/tokenpayload";


//Routes will go here
const router = express.Router();

router.post('/', async function(req: Request, res: Response, next: NextFunction){
    try {
        const con = dbConn().promise();
        console.log("Trying to log in");
        if(!req.body.email && !req.body.password){
            res.status(400).send({ error: 'Missing User Data' });
            return;
        }

        let baseQuery = "SELECT * FROM users WHERE email = ?";
        const [rows] = await con.query<RowDataPacket[]>(baseQuery, [req.body.email]);

        if(rows.length < 1){
            res.status(401).send({ error: 'Incorrect User Data' });
            return;
        }

        console.log("Result: ", rows);

        const validPassword = await bcrypt.compare(req.body.password, rows[0]['password']);

        if(!validPassword){
            res.status(401).send({ error: 'Incorrect User Data' });
            return;
        }

        let name: string = req.body.email;

        if(rows[0]['is_client']==1){
            baseQuery = "SELECT * FROM clients WHERE user_email = ?";
            const [clientRows] = await con.query<RowDataPacket[]>(baseQuery, [req.body.email]);
            name = clientRows[0]['name'];
        }

        let tokenData: TokenPayload = { email: req.body.email };

        const options: SignOptions = {
            algorithm: 'HS256',
            expiresIn: '1h',

        }

        const token = jwt.sign(tokenData, process.env.JWT_KEY!, options);

        res.json({authToken:token, name:name, isClient:rows[0].is_client==1});

        await con.end();

    } catch (error) {
        next(error);
    }
 });

 export default router;

