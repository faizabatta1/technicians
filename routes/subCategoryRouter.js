const express = require('express')
const router = express.Router()
const SubCategory = require('../models/subCategories')

router.get('/subCategories/:id',async (req,res) =>{
    try{
        const { id } = req.params
        let subCategories = await SubCategory.find({ parentCategory: id }).populate({
            path:'parentCategory',
            ref:'Category'
        })

        return res.status(200).json(subCategories)
    }catch (error){
        return res.status(500).send("Internal Server Error")
    }
})

router.get('/subCategories/self/:id',async (req,res) =>{
    try{
        const { id } = req.params
        let subCategories = await SubCategory.findOne({ _id: id }).populate({
            path:'parentCategory',
            ref:'Category'
        })

        return res.status(200).json(subCategories)
    }catch (error){
        return res.status(500).send("Internal Server Error")
    }
})

const Technician = require('../models/technicianModel')
router.get('/subCategories/:id/technicians',async (req,res) =>{
    try{
        const { id } = req.params
        let subCategories = await Technician.find({subCategory : {$in : id}})
        console.log(subCategories)
        return res.status(200).json(subCategories)
    }catch (error){
        return res.status(500).send("Internal Server Error")
    }
})

router.post('/subCategories',async (req,res) =>{
    try{
        const { price, parentCategory, name, nameAr} = req.body
        console.log(req.body)

        if(parentCategory === undefined || name === undefined){
            return res.status(400).send("Missing Data Name Or ParentCategory")
        }

        let subCat = new SubCategory({ price, parentCategory, name, nameAr })
        await subCat.save()

        return res.status(201).send(`Sub Category ${name} Was Created`)
    }catch (error){
        console.error(error.message)
        return res.status(500).send("Internal Server Error")
    }
})

router.delete('/subCategories/:id', async (req,res) =>{
    try{
        await SubCategory.deleteOne({ _id:req.params.id })
        return res.status(200).send("SubCategory Was Deleted")
    }catch (error){
        return res.status(500).send("Internal Server Error")
    }
})

router.delete('/subCategories/parentCategory/:id', async (req,res) =>{
    try{
        await SubCategory.deleteMany({ parentCategory:req.params.id })
        return res.status(200).send("SubCategories Were Deleted")
    }catch (error){
        return res.status(500).send("Internal Server Error")
    }
})

router.put('/subCategories/:id', async (req,res) =>{
    try{
        const { name,nameAr, price, parentCategory } = req.body
        let isExisting = await SubCategory.find({ name })
        if(!isExisting){
            return res.status(404).send("SubCategory Doesn't Exist")
        }

        await SubCategory.findOneAndUpdate({ _id: req.params.id },{
            name, price, parentCategory, nameAr
        },{ $new: true })

        return res.status(200).send(`SubCategory ${name} Was Updated`)
    }catch (error){
        return res.status(500).send("Internal Server Error")
    }
})

const Category = require('../models/categoryModel')
router.get('/subCategories/parentCategoryName/:id', async (req, res) =>{
    try{
        const { id } = req.params.id
        console.log(id)
        let category = await Category.findOne({ _id: id })
        if(!category){
            return res.status(404).send("Unknown")
        }

        return res.status(200).send(category.name)
    }catch (error){
        return res.status(500).send("Error")
    }
})

module.exports = router