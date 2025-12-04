Routerpsyment
Js

------
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Ride = require('../models/Ride');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { rideId, amount } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        rideId: rideId.toString(),
        userId: req.userId.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment
router.post('/confirm', auth, async (req, res) => {
  try {
    const { rideId, paymentIntentId, paymentMethod } = req.body;

    const ride = await Ride.findById(rideId).populate('driver');
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Create payment record
    const payment = new Payment({
      ride: rideId,
      customer: req.userId,
      driver: ride.driver._id,
      amount: paymentIntent.amount / 100,
      paymentMethod: paymentMethod || 'card',
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      transactionId: paymentIntent.id
    });

    await payment.save();

    // Update ride payment status
    ride.paymentStatus = 'paid';
    ride.fare = paymentIntent.amount / 100;
    await ride.save();

    res.json({
      message: 'Payment confirmed successfully',
      payment,
      ride
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.userId })
      .populate('ride')
      .populate('driver')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

