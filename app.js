const express = require("express");
const app = express();
const mongo = require("mongodb");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const storage = multer.memoryStorage();
const Image = require("./models/images");
const upload = multer({ storage: storage });
const cors = require("cors");
const webpush = require("web-push");
const cron = require("node-cron");
const apiKeys = {
    publicKey:
        "BEtmMjDI1V-07XqGUrl9vQeSuX8XJ0l37h-cDfTxKNqA2cqkWeK_5XD3gPUok1CAbbxvfhdfmwRPj43YAvM_SK0",
    privateKey: "-YhQQ8aC3VvHFZZcVrD4vJd03orz28qETMaa96DzACQ",
};

app.use(express.static(path.join(__dirname, "public")));
webpush.setVapidDetails(
    "mailto:moinuddinshaikh173@gmail.com",
    apiKeys.publicKey,
    apiKeys.privateKey
);

const bodyParser = require("body-parser");
// Increase body-parser limit for larger payloads (e.g., base64 images)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(cors());
app.use(express.json());

const subDatabse = [];

app.post("/save-subscription", (req, res) => {
    subDatabse.push(req.body);
    cron.schedule("*/2 * * * * *", () => {
        subDatabse.forEach((subscription) => {
            webpush
                .sendNotification(subscription, "", {})
                .then((response) =>
                    console.log("Notification sent successfully.")
                )
                .catch((err) =>
                    console.error("Error sending notification:", err)
                );
        });
    });
    res.json({ status: "Success", message: "Subscription saved!" });
});

app.get("/send-notification", (req, res) => {
    webpush.sendNotification(subDatabse[0], "Hello world");
    res.json({ statue: "Success", message: "Message sent to push service" });
});

mongoose
    .connect(
        "mongodb+srv://admin:HTN2024@images.ogr4m.mongodb.net/images?retryWrites=true&w=majority&appName=images"
    )
    .then(() => {
        console.log("Connected to MongoDB...");
        app.listen(8080, () => console.log("Server started on port 8080"));
    })
    .catch((err) => console.error("Could not connect to MongoDB..."));

app.get("/upload", (req, res) => {
    res.sendFile(__dirname + "/views/imageform.html");
});
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

// Route to get all image IDs
app.get("/image-ids", async (req, res) => {
    try {
        const images = await Image.find({}, "_id"); // Find all images and return only the _id field
        const ids = images.map((image) => image._id); // Extract the _id values into an array
        res.json(ids); // Send the IDs as a JSON array
    } catch (err) {
        console.log("error retrieving image ids");
        res.status(500).send("Error retrieving image IDs: " + err);
    }
});

app.get("/image/:id/:field", async (req, res) => {
    const field = req.params.field;
    try {
        // Find the image by ID
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).send("Image not found.");
        }
        console.log(req.params.id);

        // Access the field dynamically (either 'imgf' or 'imgb')
        const imageData = image[field];

        // Check if the requested field exists and has the expected structure
        if (imageData && imageData.data) {
            // Set the content type based on the stored mimetype
            res.contentType(imageData.contentType);
            // Send the image data
            res.send(imageData.data);
        } else {
            res.status(404).send("Image field not found.");
        }
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).send("Error fetching image.");
    }
});

app.get("/:id/", async (req, res) => {
    const id = req.params.id;
    try {
        // Find the image by ID
        const imageObj = await Image.findById(id);

        if (!imageObj) {
            return res.status(404).send("Image not found.");
        }

        // Access the field dynamically (either 'imgf' or 'imgb')
        const imageData = {
            caption: imageObj.caption,
            author: imageObj.author
        }
        
        res.json(imageData);
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).send("Error fetching image.");
    }
});


// fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post(
    "/upload",
    upload.fields([
        { name: "imgf", maxCount: 1 },
        { name: "imgb", maxCount: 1 },
    ]),
    (req, res) => {
        if (!req.files || !req.files["imgf"] || !req.files["imgb"]) {
            return res
                .status(400)
                .json({ error: "No files uploaded or incorrect field names." });
        }

        const newImage = new Image({
            namef: `${
                req.files["imgf"][0].originalname.split(".")[0]
            }_${Date.now()}.${req.files["imgf"][0].originalname
                .split(".")
                .pop()}`,
            imgf: {
                data: req.files["imgf"][0].buffer,
                contentType: req.files["imgf"][0].mimetype,
            },
            nameb: `${
                req.files["imgb"][0].originalname.split(".")[0]
            }_${Date.now()}.${req.files["imgb"][0].originalname
                .split(".")
                .pop()}`,
            imgb: {
                data: req.files["imgb"][0].buffer,
                contentType: req.files["imgb"][0].mimetype,
            },
            caption: req.body.caption,
            author: req.body.author,
        });

        newImage
            .save()
            .then(() =>
                res.json({
                    message:
                        "File uploaded successfully and stored in MongoDB Atlas.",
                })
            )
            .catch((err) =>
                res.status(500).json({ error: "Error uploading file: " + err })
            );
    }
);
