const express = require('express')
const router = express.Router()
const multer = require('multer')
const uuid = require("uuid");
const {getAllSliderImages, createSliderImage, deleteSliderImage} = require("../controllers/sliderController");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/')
    },
    filename: (req, file, cb) => {
        cb(null, `${uuid.v4()}-${file.originalname}`)
    },
})

const upload = multer({ storage: storage })

router.get('/sliders',getAllSliderImages)
router.post('/sliders', upload.single('image'),createSliderImage)
router.delete('/sliders/:id', deleteSliderImage)

module.exports = router