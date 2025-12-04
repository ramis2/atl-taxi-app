const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb://localhost:27017/atltaxidata';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

const tripSchema = new mongoose.Schema({
  trip_id: String,
  driver_id: String,
  passenger_count: Number,
  pickup_location: String,
  dropoff_location: String,
  fare_amount: Number,
  trip_distance: Number,
  timestamp: { type: Date, default: Date.now }
});

const Trip = mongoose.model('Trip', tripSchema);

app.get('/', (req, res) => {
  res.json({ 
    message: 'ATL Taxi Data API is running!',
    endpoints: [
      'GET /health',
      'GET /process-csv', 
      'GET /trips',
      'GET /stats',
      'POST /trips'
    ]
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'OK', 
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/process-csv', (req, res) => {
  const results = [];
  
  if (!fs.existsSync('taxi-data.csv')) {
    return res.status(404).json({ 
      error: 'taxi-data.csv file not found. Create it in the project folder.' 
    });
  }
  
  fs.createReadStream('taxi-data.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        await Trip.deleteMany({});
        const savedTrips = await Trip.insertMany(results);
        res.json({
          message: 'CSV data saved to MongoDB!',
          records: savedTrips.length,
          database: 'atltaxidata',
          collection: 'trips'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    .on('error', (error) => {
      res.status(500).json({ error: error.message });
    });
});

app.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.find().limit(50);
    res.json({
      count: trips.length,
      data: trips
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const totalFareResult = await Trip.aggregate([
      { $group: { _id: null, total: { $sum: '$fare_amount' } } }
    ]);
    const avgPassengersResult = await Trip.aggregate([
      { $group: { _id: null, avg: { $avg: '$passenger_count' } } }
    ]);

    res.json({
      total_trips: totalTrips,
      total_fare: totalFareResult[0] ? totalFareResult[0].total : 0,
      average_passengers: avgPassengersResult[0] ? avgPassengersResult[0].avg : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/trips', async (req, res) => {
  try {
    const newTrip = new Trip(req.body);
    const savedTrip = await newTrip.save();
    res.json({
      message: 'Trip added successfully',
      data: savedTrip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚕 Server running on http://localhost:${PORT}`);
});
