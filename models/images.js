const mongoose = require('mongoose');


const Schema = mongoose.Schema;
const imageSchema = new Schema({
    namef: String,
    imgf: {
        data: Buffer,
        contentType: String
    },
    nameb: String,
    imgb: {
        data: Buffer,
        contentType: String
    },
    caption: String,
    author: String
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;