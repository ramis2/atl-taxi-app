// server.js - Main backend file
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Models
const User = require('./models/User');
const Driver = require('./models/Driver');
const Ride = require('./models/Ride');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/customers', require('./routes/customers'));

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Driver joins
    socket.on('driver-online', (driverData) => {
        socket.join('drivers');
        // Broadcast to dispatchers
        io.to('dispatchers').emit('driver-status-changed', driverData);
    });

    // Customer requests ride
    socket.on('request-ride', (rideData) => {
        // Find nearby drivers
        io.to('drivers').emit('new-ride-request', rideData);
        // Notify dispatchers
        io.to('dispatchers').emit('new-ride-request', rideData);
    });

    // Driver accepts ride
    socket.on('accept-ride', (data) => {
        io.to('dispatchers').emit('ride-accepted', data);
        io.to(`customer-${data.customerId}`).emit('driver-assigned', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



_____<

Database model


// models/Ride.js
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    pickupLocation: {
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    destination: {
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'driver_arrived', 'in_progress', 'completed', 'cancelled'],
        default: 'requested'
    },
    fare: {
        type: Number,
        default: 0
    },
    estimatedFare: Number,
    distance: Number,
    duration: Number,
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    rating: {
        stars: Number,
        comment: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ride', rideSchema);


_____


Package josn


{
  "name": "taxigo-backend",
  "version": "1.0.0",
  "description": "Taxi Dispatch System Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "socket.io": "^4.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "stripe": "^12.0.0",
    "nodemailer": "^6.9.1",
    "axios": "^1.3.0",
    "geolib": "^3.3.3"
  },
  "devDependencies": {
I    "nodemon": "^2.0.20"
  }
}


______

..env

PORT=5000
MONGODB_URI=mongodb://localhost:27017/taxigo
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taxigo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Socket.io for real-time updates
const activeDrivers = new Map();
const activeRides = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Driver comes online
  socket.on('driver-online', (driverData) => {
    activeDrivers.set(socket.id, {
      ...driverData,
      socketId: socket.id,
      location: driverData.location
    });
    socket.join('drivers');
    io.emit('drivers-updated', Array.from(activeDrivers.values()));
    console.log(`Driver ${driverData.driverId} is now online`);
  });

  // Driver location update
  socket.on('driver-location-update', (data) => {
    const driver = activeDrivers.get(socket.id);
    if (driver) {
      driver.location = data.location;
      activeDrivers.set(socket.id, driver);
      io.emit('driver-location-changed', {
        driverId: driver.driverId,
        location: data.location
      });
    }
  });

  // Customer requests ride
  socket.on('request-ride', async (rideData) => {
    try {
      // Find nearby drivers (in real app, use proper geospatial query)
      const nearbyDrivers = Array.from(activeDrivers.values()).filter(driver => 
        driver.status === 'online'
      );

      // Create ride in database
      const Ride = require('./models/Ride');
      const ride = new Ride({
        customer: rideData.customerId,
        pickupLocation: rideData.pickupLocation,
        destination: rideData.destination,
        estimatedFare: rideData.estimatedFare,
        status: 'requested'
      });
      await ride.save();

      // Store in active rides
      activeRides.set(ride._id.toString(), {
        ...ride.toObject(),
        socketId: socket.id
      });

      // Notify nearby drivers
      io.to('drivers').emit('new-ride-request', {
        rideId: ride._id,
        ...rideData
      });

      // Notify dispatchers
      io.to('dispatchers').emit('new-ride-request', {
        rideId: ride._id,
        ...rideData
      });

      socket.emit('ride-requested', { success: true, rideId: ride._id });
    } catch (error) {
      socket.emit('ride-request-error', { error: error.message });
    }
  });

  // Driver accepts ride
  socket.on('accept-ride', async (data) => {
    try {
      const Ride = require('./models/Ride');
      const ride = await Ride.findById(data.rideId);
      
      if (!ride) {
        socket.emit('ride-accept-error', { error: 'Ride not found' });
        return;
      }

      ride.driver = data.driverId;
      ride.status = 'accepted';
      await ride.save();

      // Update driver status
      const driver = activeDrivers.get(socket.id);
      if (driver) {
        driver.status = 'on_ride';
        activeDrivers.set(socket.id, driver);
      }

      // Notify customer
      io.to(`customer-${ride.customer}`).emit('driver-assigned', {
        rideId: ride._id,
        driver: data.driverInfo,
        estimatedArrival: '5 minutes'
      });

      // Notify dispatchers
      io.to('dispatchers').emit('ride-accepted', {
        rideId: ride._id,
        driver: data.driverInfo
      });

      socket.emit('ride-accepted-success', { rideId: ride._id });
    } catch (error) {
      socket.emit('ride-accept-error', { error: error.message });
    }
  });

  // Ride status updates
  socket.on('ride-status-update', async (data) => {
    try {
      const Ride = require('./models/Ride');
      await Ride.findByIdAndUpdate(data.rideId, { status: data.status });
      
      io.to(`customer-${data.customerId}`).emit('ride-status-changed', {
        rideId: data.rideId,
        status: data.status
      });

      io.to('dispatchers').emit('ride-status-changed', {
        rideId: data.rideId,
        status: data.status
      });
    } catch (error) {
      console.error('Ride status update error:', error);
    }
  });

  // Dispatcher joins
  socket.on('dispatcher-join', () => {
    socket.join('dispatchers');
    console.log('Dispatcher joined');
  });

  socket.on('disconnect', () => {
    const driver = activeDrivers.get(socket.id);
    if (driver) {
      activeDrivers.delete(socket.id);
      io.emit('drivers-updated', Array.from(activeDrivers.values()));
      console.log(`Driver ${driver.driverId} went offline`);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'TaxiGo API Server is running!',
    version: '1.0.0'
  });
});

// Get active drivers (for dispatchers)
app.get('/api/active-drivers', (req, res) => {
  res.json(Array.from(activeDrivers.values()));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
