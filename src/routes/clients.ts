import express, { Express, Request, Response, NextFunction } from "express";
import { RowDataPacket } from "mysql2";
import dbConn from "../db/connection";
import { Client } from "../types/clients";
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

        let baseQuery = "SELECT clients.user_email, clients.name, MIN(invoices.date) AS oldest_invoice_date, MAX(total_amount) AS most_expensive_invoice_total FROM clients LEFT JOIN (\
SELECT invoices.client_email, invoices.id, SUM((invoices_products.unit_price * invoices_products.quantity) * (1 - (invoices.discount / 100))) AS total_amount FROM invoices\
 LEFT JOIN invoices_products ON invoices.id = invoices_products.invoice_id GROUP BY invoices.id ) AS invoice_totals ON clients.user_email = invoice_totals.client_email LEFT JOIN\
 invoices ON invoice_totals.id = invoices.id GROUP BY clients.user_email";

        try {
            const [rows] = await con.query<RowDataPacket[]>(baseQuery);
            const clients: Client[] = [];

            rows.forEach(row => {
                let allowedDiscount = 0;

                if(row['most_expensive_invoice_total']!=null){
                    if(row['most_expensive_invoice_total'] > 2000)
                        allowedDiscount = 45;
                    if(row['most_expensive_invoice_total'] < 1000)
                        allowedDiscount = 10;
                }

                let dateDif = new Date(Date.now() - (row['oldest_invoice_date'] == null ? Date.now() : row['oldest_invoice_date'].getTime())).getUTCFullYear() - 1970; //restamos la unix timestamp de hoy y la de la fecha de la compra mas vieja. Eso nos da la diferencia de años + 1970

                if(dateDif>=3)
                    allowedDiscount = 30;

                clients.push({
                    email : row['user_email'],
                    name : row['name'],
                    allowedDiscount : allowedDiscount
                });
            });

            res.status(200).send(clients);
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