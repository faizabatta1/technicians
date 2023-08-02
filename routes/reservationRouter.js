const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// Create a reservation
router.post('/reservations', reservationController.createReservation);
router.delete('/reservations', reservationController.deleteAllReservations);

// Get all reservations
router.get('/reservations', reservationController.getReservations);

router.get('/reservations/user', reservationController.getUserReservations);

// Delete a reservation by ID
router.delete('/reservations/:id', reservationController.deleteReservation);

module.exports = router;