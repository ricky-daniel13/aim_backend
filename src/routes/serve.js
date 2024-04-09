const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const s3 = new AWS.S3();



//Routes will go here
module.exports = router;

router.get('/:image', async function (req, res) {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: req.params.image
    };

    s3.headObject(params, function (err, metadata) {
        if (err && err.name === 'NotFound') {
            res.status(404).json({ error: "File doesn't exist" });
        } else if (err) {
            console.log(err);
            res.status(500).json({ error: "Server error, try again later" });
        } else {
            s3.getObject(params, (err, data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({error:'Error retrieving image'});
                }

                // Set appropriate content type for the image
                res.set('Content-Type', data.ContentType);
                // Send the image data
                res.send(data.Body);
            });
        }
    });
});