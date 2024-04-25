import express, { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { VerifyOptions } from "jsonwebtoken"
import dbConn from "../db/connection";
import { RowDataPacket } from "mysql2";
import { TokenPayload } from "../types/tokenpayload";

//Token Middleware
export default async function (req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        res.status(401).send({ error: "Missing Access Token" });
        return;
    }

    let bearer = req.headers.authorization.split(" ")

    if (bearer.length!=2 || bearer[0].toLowerCase()!='bearer') {
        res.status(401).send({ error: "Malformed Access Token" });
        return;
    }

    let token = bearer[1];
    let baseQuery = "SELECT u.email, u.is_client, c.name FROM users AS u LEFT JOIN clients AS C on u.email = c.user_email WHERE email = ?";

    try {
        const con = dbConn().promise();
        const options: VerifyOptions = {
            algorithms:['HS256']
        }
        const tokenDeco = jwt.verify(token, process.env.JWT_KEY!,options);
        console.log("Token: ", tokenDeco);

        const payload = tokenDeco as TokenPayload;
        
        const [rows] = await con.query<RowDataPacket[]>(baseQuery, [payload.email]);
 
        if (rows.length < 1) {
            res.status(500).send({ error: "Catastrofic error" });
            return;
        }
 
        req.user = {
            email: rows[0]['email'],
            isClient: rows[0]['is_client'] == true,
            name: rows[0]['name']
        }

        console.log(req.user);

        await con.end();
        console.log("Returning");
        next();

    } catch (error) {
        console.log("Token decoding error: ", error);
        res.status(401).send({ error: "Invalid Token" });
    } finally {
        console.log("Closing connection");
        
    }
};