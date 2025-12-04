javascript
const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  location: {
    lat: Number,
    lng: Number
  },
  rating: {
    type: Number,
    default: 5.0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);
