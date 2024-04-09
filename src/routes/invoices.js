const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const path = require('path');


//Routes will go here
module.exports = router;

router.get('/', async function (req, res, next) {
    /*if(req.user.isClient){
        res.status(403).send({ error: 'User isn\'t allowed to make this action' });
        return;
    }*/

    try {
        const con = require('../db/connection.js')().promise();

        let baseQuery = "SELECT i.id, i.client_email, c.name AS client_name, i.date, i.discount, i.voucher_url, i_p.product_id, i_p.quantity, i_p.unit_price, p.name AS product_name FROM (SELECT * FROM invoices";

        const page = req.query.page == undefined ? 0 : Number.parseInt(req.query.page);
        const limit = req.query.limit == undefined ? 5 : Number.parseInt(req.query.limit);

        if (Number.isNaN(page) || Number.isNaN(limit)) {
            res.status(400).send({ error: 'Bad query data' });
            return;
        }


        const params = [];
        if (req.user.isClient) {
            baseQuery += " WHERE client_email = ?";
            params.push(req.user.email);
        }

        baseQuery += " ORDER BY id DESC LIMIT ? OFFSET ?) AS i LEFT JOIN invoices_products AS i_p ON i_p.invoice_id = i.id LEFT JOIN products AS p ON p.id = i_p.product_id LEFT JOIN clients AS c ON i.client_email = c.user_email";
        params.push(limit, page * limit);

        try {
            const [rows] = await con.query(baseQuery, params);
            const countParams = [];

            baseQuery = "SELECT count(*) as row_count FROM invoices";
            if (req.user.isClient) {
                baseQuery += " WHERE client_email = ?";
                params.push(req.user.email);
            }
            const [countRows] = await con.query(baseQuery, params);

            console.log("Result: ", countRows);

            const invoices = [];

            let currentId = -1;
            let currentInvoice = null;
            rows.forEach(row => {
                if (currentId != row.id) {
                    currentInvoice = {
                        id: row.id,
                        clientName: row.client_name,
                        clientEmail: row.client_email,
                        date: row.date.getTime(),
                        discount: row.discount,
                        imageUrl: row.voucher_url ? process.env.URL + path.join("serve",row.voucher_url) : null,
                        products: []
                    };
                    invoices.push(currentInvoice);
                    currentId = row.id;
                }
                currentInvoice.products.push({
                    id: row.product_id,
                    quantity: row.quantity,
                    unitPrice: row.unit_price,
                    name: row.product_name
                });
            });

            res.status(200).send({
                rowCount: countRows[0].row_count,
                invoices: invoices
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal Server Error" });
        } finally {
            con.close();
        }

    } catch (error) {
        next(error);
        return;
    }
});

router.post('/', async function (req, res, next) {
    if (req.user.isClient) {
        res.status(403).send({ error: 'User isn\'t allowed to make this action' });
        return;
    }

    if (req.body.clientEmail === undefined || req.body.date === undefined ||
        req.body.products === undefined || req.body.products.length < 1 ||
        req.body.discount === undefined) {
        res.status(400).send({ error: 'Missing Data' });
        return;
    }

    try {
        const con = require('../db/connection.js')().promise();

        await con.query('START TRANSACTION');
        let baseQuery = "INSERT INTO invoices (client_email, date, discount) VALUES (?, ?, ?)";
        //

        console.log("Inserting date: " + new Date(req.body.date).toISOString().slice(0, 19).replace('T', ' '));
        let datetime = new Date(req.body.date).toISOString().slice(0, 19).replace('T', ' ');
        const [rows] = await con.query(baseQuery, [req.body.clientEmail, datetime, req.body.discount]);

        if (rows.length < 1) {
            res.status(401).send({ error: 'Incorrect User Data' });
            return;
        }

        console.log("Result: ", rows);

        req.body.products.forEach(async product => {
            let productQuery = "INSERT INTO invoices_products (invoice_id, product_id, quantity, unit_price) VALUES (?, ?, ?, (SELECT price FROM products WHERE id = ?))";
            const [prodRows] = await con.query(productQuery, [rows.insertId, product.id, product.quantity, product.id]);
        });

        res.status(201).send({ created: true, id: rows.insertId });

        await con.query('COMMIT');

        con.close();
    } catch (error) {
        next(error);
        return;
    }
});

router.post('/:id/image', async function (req, res, next) {
    try {
        if (req.user.isClient) {
            res.status(403).send({ error: 'User isn\'t allowed to make this action' });
            return;
        }

        const con = require('../db/connection.js')().promise();

        let baseQuery = "SELECT voucher_url FROM invoices WHERE id = ?";
        const [rows] = await con.query(baseQuery, [parseInt(req.params.id)]);
        if (rows.length < 1) {
            res.status(404).send({ error: "Invoice doesn't exist" });
            return;
        }

        if (rows[0].voucher_url) {
            res.status(400).send({ error: "Invoice already has image" });
        }

        const form = new formidable.IncomingForm({ maxFiles: 1 });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.log(err);
                next(err);
                return;
            }

            if (files.file == null) {
                res.status(400).send({ error: "No image in form." });
                return;
            }

            const fileContent = fs.readFileSync(files.file[0].filepath);

            const params = {
                Bucket: process.env.AWS_BUCKET,
                Key: files.file[0].newFilename+path.extname(files.file[0].originalFilename),
                Body: fileContent,
            };

            s3.upload(params, (err, data) => {
                if (err) {
                    console.error('Error uploading file:', err);
                } else {
                    console.log(`File uploaded successfully. ${data.Location}`);
                }
            });

            let query = "UPDATE invoices SET voucher_url = ? WHERE id = ?";
            const [rowsUpload] = await con.query(query, [files.file[0].newFilename+path.extname(files.file[0].originalFilename), parseInt(req.params.id)]);

            res.json({ submitted: true });
            return;
        });

        return;
    } catch (error) {
        console.error(error);
        res.status(500).send({ submitted: false });
    }
});
