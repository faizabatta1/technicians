const Manager = require('../models/Managers')
const jwt = require('jsonwebtoken')

exports.login = async (req,res) =>{
    try{
        const { email,password } = req.body
        console.log(email);

        const manager = await Manager.findOne({ email:email,password:password })
    
        if(!manager){
            return res.status(400).send("Invalid Email or Password")
        }

        const token = jwt.sign({
            email:email,
            role:manager.role,
            id:manager._id
        },'ManagerLoginKey',{ expiresIn:'30d' })
       return res.status(200).json({
            token:token,
            user:{
                email:email,
                username:manager.username
            }
        })


    }catch(error){
        console.log(error.message)
        return  res.status(500).send("Internal Server Error")
    }
}

exports.updateCredentials = async (req,res) =>{
    const { username, email, password } = req.body

    try{
        const manager = await Manager.findOne({ email })
        if(!manager){
            return res.status(404).send('no manager was found')
        }
    
        let updated = await Manager.findOneAndUpdate({ email },{
            email:email,
            password:password,
            username:username
        },{ new:true })
        
        console.log(updated);

        return res.status(200).json(updated)
    }catch(error){
        return res.status(500).send(error.message)
    }
}