const mongoose = require('mongoose')

const SliderImageSchema = new mongoose.Schema({
    link:{
        type: String,
        require: true
    }
})

const SliderImageModel = mongoose.model('SliderImage', SliderImageSchema)

module.exports = SliderImageModel