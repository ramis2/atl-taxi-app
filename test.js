javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');

console.log('✅ All packages loaded successfully!');
console.log('Express:', express ? 'OK' : 'Missing');
console.log('CORS:', cors ? 'OK' : 'Missing');
console.log('Axios:', axios ? 'OK' : 'Missing');
console.log('CSV-Parser:', csv ? 'OK' : 'Missing');
