const SliderImageModel = require('../models/sliderImage')
const uuid = require("uuid");
const bucket = require("../utils/firebase");

const getAllSliderImages = async (req,res) =>{
    try{
        let images = await SliderImageModel.find({})
        return res.status(200).json(images)
    }catch (error){
        return res.status(500).send('Failed To Load Images')
    }
}

const deleteSliderImage = async (req,res) =>{
    try{
        const { id } = req.params
        await SliderImageModel.findOneAndDelete({_id: id})
        return res.status(200).send('Image Was Deleted')
    }catch (error){
        return res.status(500).send(error.message)
    }
}

const createSliderImage = async (req,res) =>{
    try{
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const token = uuid.v4();

        const metadata = {
            metadata: {
                // This line is very important. It's to create a download token.
                firebaseStorageDownloadTokens: token,
            },
            contentType: req.file.mimeType,
            cacheControl: `public, max-age=${Date.now() + 10 * 60 * 60 * 24 * 30 * 365}`,
        };

        await bucket.upload(`images/${req.file.filename}`, {
            // Support for HTTP requests made with `Accept-Encoding: gzip`
            gzip: true,
            metadata: metadata,
        });

        const link = `https://firebasestorage.googleapis.com/v0/b/zainfinal-b9de0.appspot.com/o/${req.file.filename}?alt=media&token=${token}5`
        const sliderImage = new SliderImageModel({ link })
        await sliderImage.save()

        return res.status(200).send('Image Was Created')
    }catch (error){
        return res.status(500).send(error.message)
    }
}


module.exports = { createSliderImage, deleteSliderImage, getAllSliderImages }