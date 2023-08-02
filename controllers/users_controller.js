const bcrypt = require('bcrypt');
const User = require('../models/usersModel');
const jwt = require('jsonwebtoken');
const { sendResetPasswordEmail, generateOTP } = require('../utils/emailService');

exports.sendResetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();

    // Send email with OTP
    sendResetPasswordEmail(email, otp);

    // Save the OTP in the user's document
    user.resetPasswordOTP = otp;
    await user.save();

    return res.status(200).json({ message: 'Reset password email sent successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyResetPasswordOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const token = req.headers.token;
    const decodedToken = jwt.verify(token, 'ManagerLoginKey');
    const role = decodedToken.role;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = await User.find({}, { __v: false });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteAllUsers = async (req, res) =>{
  try{
    await User.deleteMany({});
    return res.status(200).send("All Users Were Deleted")
  }catch (error){
    return res.status(500).send("Failed To Delete All Users")
  }
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, location, phone } = req.body;
    console.log(req.body);

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(401).send('Email already exists');
    }

    const existingPhone = await User.findOne(({phone: phone}));
    if(existingPhone){
      return res.status(402).send('Phone Already Exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      location: location,
      phone:phone
    });

    const savedUser = await newUser.save();



    return res.status(200).json(savedUser);
  } catch (error) {
    return res.status(500).send('Internal server error');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, deviceToken } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: 'user' },
        'your-secret-key',
        { expiresIn: '30d' }
      );

      await User.findOneAndUpdate({ email:email },{
        deviceToken:deviceToken
      },{$new:true})

      return res.status(200).json({ token: token, user: user });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUserNotifications = async (req,res) => {
  try{
    const { token } = req.headers
    let decodedToken = await jwt.verify(token,'your-secret-key');

    let user = await User.findOne({ _id: decodedToken.userId })


    return res.status(200).json(user.notifications)
  }catch (error){
    return res.sendStatus(500)
  }
}

exports.getUser = async (req, res) => {
  try {
    const { token } = req.headers
    const decodedToken = jwt.verify(token, 'your-secret-key');

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;


    const deletedUser = await User.findByIdAndDelete(userId);

    if (deletedUser) {
      return res.status(200).json({ message: 'User deleted successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;

    const existingUser = await User.findOne({ email: email });

    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ error: 'Email already exists with another user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: name, email: email },
      { new: true }
    );

    if (updatedUser) {
      return res.status(200).json(updatedUser);
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const bucket = require('../utils/firebase')

const uuid = require("uuid");
const { Storage } = require('@google-cloud/storage');


exports.uploadImage = async (req, res) => {
  try {
    const userId = req.params.id;

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

    const url = `https://firebasestorage.googleapis.com/v0/b/zainfinal-b9de0.appspot.com/o/${req.file.filename}?alt=media&token=${token}5`


    let updated = await User.findOneAndUpdate({ _id:userId },{
      image:url
    },{ $new:true })

    return res.status(200).json(updated)

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const Technician = require('../models/technicianModel')

exports.getAllFavoriteTechnicians = async (req,res) =>{
  try{
    const { token } = req.headers
    let decodedToken = await jwt.verify(token,'your-secret-key');
    let user = await User.findOne({ _id: decodedToken.userId })

    let techs = user.favorites

    let techsArr = []


    for(let tech of techs){
      try{
        if(tech != null){
          let data = await Technician.findOne({ _id:tech }).populate({
            path:'category',
            ref:'Category'
          });
          techsArr.push(data)
        }
      }catch(error){}
    }

    return res.status(200).json(techsArr)
  }catch (error){
    console.log(error.message)
    return res.status(500).send("Internal Server Error")
  }
}


exports.createFavoriteTech = async (req,res) =>{
  const { id } = req.body
  const { token } = req.headers
  let decodedToken = jwt.verify(token, 'your-secret-key')




  try{
    let user = await User.findOne({ _id:decodedToken.userId })
    let techs = user.favorites
    techs.push(id)

    await User.findOneAndUpdate({_id:decodedToken.userId},{
      favorites:techs
    },{$new:true})

    res.json(techs)
  }catch(error){
    console.log(error.message)
    res.status(500).send('something went wrong')
  }
}

exports.deleteFavoriteTech = async (req,res) =>{
  const { id } = req.params
  const { token } = req.headers
  let decodedToken = jwt.verify(token, 'your-secret-key')


  try{
    let user = await User.findOne({ _id:decodedToken.userId })
    let techs = user.favorites
    let filtered = techs.filter(t => t != id)

    await User.findOneAndUpdate({_id:decodedToken.userId},{
      favorites:filtered
    },{new:true})

    res.json(filtered)
  }catch{
    res.status(500).send('something went wrong')
  }


}

exports.isFavoriteTechnician = async (req,res) =>{
  try{
    const { token, technicianid } = req.headers
    console.log(req.headers)
    let decodedToken = await jwt.verify(token,'your-secret-key');
    let user = await User.findOne({ _id: decodedToken.userId })
    console.log(technicianid)
    if(user.favorites.some((e) => e == technicianid)){
      return res.status(200).send(true)
    }else{
      return res.status(404).send(false)
    }
  }catch (error){

  }
}

exports.validateToken = (req,res) =>{
  try{
    const { token } = req.headers
    jwt.verify(token, 'your-secret-key',{

    },(error,cb) => {
      if(error){
        return res.status(400).send(error)
      }else{
        return res.status(200).send(cb)
      }
    })
  }catch (error){
    return res.status(500).send(error.message)
  }
}
