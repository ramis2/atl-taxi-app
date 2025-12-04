const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    color: String,
    licensePlate: String
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'on_ride'],
    default: 'offline'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },
  rating: {
    average: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  earnings: {
    today: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  documents: {
    licensePhoto: String,
    insurancePhoto: String,
    vehiclePhoto: String
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
driverSchema.index({ "currentLocation": "2dsphere" });

module.exports = mongoose.model('Driver', driverSchema);
