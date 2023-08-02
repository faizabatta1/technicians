const CompletedReservation = require('../models/completedReservation');

exports.getCompletedReservations = async (req, res) => {
  try {
    const completedReservations = await CompletedReservation.find();
    return res.status(200).json(completedReservations);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const User = require('../models/usersModel')
const axios = require('axios')
const Reservation = require("../models/reservationModel");
const NotificationModel = require('../models/notifications')

exports.createCompletedReservation = async (req, res) => {
  const { completeTime, user, technician, category, price, id } = req.body;

  try {
    let isAlreadyCompleted = await Reservation.findOne({ _id: id,status: 'completed'});
    if(isAlreadyCompleted){
      return res.status(400).send("Booking Is Already Completed")
    }

    const completedReservation = await CompletedReservation.create({
      completeTime,
      user,
      technician,
      category,
      price,
    });
    let userX = await User.findOne({ name:user })
    console.log(userX)



    let response = await axios({
      method:"POST",
      url:"https://fcm.googleapis.com/fcm/send",
      headers:{
        'Content-Type':'application/json',
        'Authorization': "key=AAAA5lb3yKE:APA91bFuT_Ut9-5Z0wCJUmYEejppMPdXSgpclNC7kRFz_iLU-JTTsgp5HkAJSlRHuI_K1mh-bopwus4DkdiTf3DCSPHotmAtm_rXUffQq22JbltUljY9G8mtp03-vMFss6LFND-nbm3E"
      },
      data:{
        notification:{
          title: "Zain Development Reservation",
          body: "Your Reservation Is Done"
        },
        to:userX.deviceToken
      }
    })

    let notification = new NotificationModel({
      userId: userX._id,
      title: "Zain Development Reservation",
      body: "Your Reservation Is Done"
    });

    let saved = await notification.save()
    console.log(notification)
    console.log(saved)

    await Reservation.findOneAndUpdate({ _id: id},{
      status: 'completed'
    },{ $new: true });
    return res.status(200).json(completedReservation);
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCompletedReservation = async (req, res) => {
  const { id } = req.params;

  try {
    await CompletedReservation.findByIdAndRemove(id);
    return res.status(200).json({ message: 'Completed reservation deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteAllCompletedReservation = async (req,res) =>{
  try{
    await CompletedReservation.deleteMany({})
    return res.status(200).send("All Completed Reservations Were Deleted")
  }catch (error){
    return res.status(500).send("Failed To Delete Completed Reservations")
  }
}
