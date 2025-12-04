javascript
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: {
    name: String,
    phone: String
  },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  destination: {
    address: String,
    lat: Number,
    lng: Number
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  fare: {
    type: Number,
    default: 0
  },
  distance: Number,
  estimatedTime: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Ride', rideSchema);
