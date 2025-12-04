// MongoDB API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend URL

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Get all drivers from MongoDB
async function getAllDrivers() {
    try {
        return await apiRequest('/drivers');
    } catch (error) {
        console.error('Failed to fetch drivers from MongoDB:', error);
        alert('⚠️ Backend connection failed. Using demo data.');
        // Fallback to demo data
        return [
            {
                driverId: 'MA',
                name: 'Mike Anderson',
                email: 'mike@taxigo.com',
                phone: '404-555-1001',
                vehicleType: 'comfort',
                licensePlate: 'ATL-1234',
                status: 'online',
                rating: 4.8,
                totalRides: 247,
                location: 'Downtown',
                coordinates: { lat: 33.7550, lng: -84.3900 }
            },
            {
                driverId: 'ED', 
                name: 'Emily Davis',
                email: 'emily@taxigo.com',
                phone: '404-555-1002',
                vehicleType: 'economy', 
                licensePlate: 'ATL-5678',
                status: 'riding',
                rating: 4.7,
                totalRides: 189,
                location: 'Midtown',
                coordinates: { lat: 33.7866, lng: -84.3873 }
            }
        ];
    }
}

// Register new driver in MongoDB
async function registerDriver(driverData) {
    return await apiRequest('/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData),
    });
}

// Update driver status in MongoDB
async function updateDriverStatus(driverId, status) {
    return await apiRequest(`/drivers/${driverId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
}

// Update driver panels with data from MongoDB
async function updateDriverPanels() {
    try {
        const drivers = await getAllDrivers();
        
        // Update dashboard driver list
        const dashboardDriverList = document.querySelector('#dashboard-view .card-body .driver-list');
        if (dashboardDriverList) {
            dashboardDriverList.innerHTML = drivers.map(driver => `
                <div class="driver-item">
                    <div class="driver-info">
                        <div class="driver-avatar">${driver.driverId}</div>
                        <div class="driver-details">
                            <h4>${driver.name}</h4>
                            <div class="driver-rating">
                                ⭐ ${driver.rating} (${driver.totalRides} rides)
                            </div>
                            <div class="driver-stats">
                                ${driver.location} • ${getVehicleTypeName(driver.vehicleType)}
                            </div>
                        </div>
                    </div>
                    <div class="driver-status status-${driver.status === 'online' ? 'online' : 'riding'}">
                        ${driver.status === 'online' ? 'Online' : 'On Ride'}
                    </div>
                </div>
            `).join('');
        }
        
        // Update map driver panel
        const mapDriverList = document.querySelector('.driver-panel .driver-list');
        if (mapDriverList) {
            mapDriverList.innerHTML = drivers.map(driver => `
                <div class="driver-item" data-driver="${driver.driverId}">
                    <div class="driver-avatar">${driver.driverId}</div>
                    <div class="driver-info">
                        <h4>${driver.name}</h4>
                        <div class="driver-stats">⭐ ${driver.rating} • ${driver.location}</div>
                    </div>
                    <div class="driver-status status-${driver.status === 'online' ? 'online' : 'riding'}">
                        ${driver.status === 'online' ? 'Online' : 'On Ride'}
                    </div>
                </div>
            `).join('');
        }
        
        // Update stats
        const onlineDrivers = drivers.filter(d => d.status === 'online').length;
        document.querySelector('.stat-number.online').textContent = onlineDrivers;
        document.querySelector('.stat-number.rides').textContent = drivers.filter(d => d.status === 'riding').length;
        
        return drivers;
    } catch (error) {
        console.error('Failed to update driver panels:', error);
    }
}

// Enhanced form submission with MongoDB
newDriverForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = newDriverForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        
        const formData = {
            name: document.getElementById('driverName').value,
            email: document.getElementById('driverEmail').value,
            phone: document.getElementById('driverPhone').value,
            vehicleType: document.getElementById('vehicleType').value,
            licensePlate: document.getElementById('licensePlate').value
        };
        
        if (!formData.name || !formData.email || !formData.phone || !formData.vehicleType || !formData.licensePlate) {
            throw new Error('Please fill in all fields');
        }
        
        // Register driver in MongoDB
        const newDriver = await registerDriver(formData);
        
        alert(`🚗 Driver ${newDriver.name} registered successfully!\n\n📧 Email: ${newDriver.email}\n📞 Phone: ${newDriver.phone}\n🚙 Vehicle: ${getVehicleTypeName(newDriver.vehicleType)}\n🔢 License: ${newDriver.licensePlate}\n🆔 Driver ID: ${newDriver.driverId}\n\nDriver saved in MongoDB!`);
        
        await updateDriverPanels();
        
        if (window.mapInitialized && window.mapInstance) {
            await refreshMapDrivers();
        }
        
        newDriverModal.style.display = 'none';
        newDriverForm.reset();
        
    } catch (error) {
        alert(`❌ Registration failed: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Refresh map drivers from MongoDB
async function refreshMapDrivers() {
    if (!window.mapInstance || !window.driverMarkers) return;
    
    try {
        const drivers = await getAllDrivers();
        
        window.driverMarkers.clearLayers();
        
        drivers.forEach(driver => {
            const marker = L.marker([driver.coordinates.lat, driver.coordinates.lng])
                .bindPopup(`
                    <div style="text-align: center; min-width: 220px;">
                        <strong>${driver.name}</strong><br>
                        <small>ID: ${driver.driverId}</small><br>
                        ⭐ ${driver.rating} • ${driver.totalRides} rides<br>
                        <small>${getVehicleTypeName(driver.vehicleType)}</small><br>
                        <small>${driver.licensePlate}</small><br>
                        <small>📍 ${driver.location}</small><br>
                        <button onclick="assignDriverToNearestRide('${driver.driverId}')" 
                                style="margin-top: 8px; padding: 5px 10px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Assign to Nearest Ride
                        </button>
                    </div>
                `);
            
            const icon = L.divIcon({
                className: `driver-marker ${driver.status === 'riding' ? 'riding' : ''}`,
                html: '<i class="fas fa-car" style="color: white; font-size: 10px; margin-top: 3px;"></i>',
                iconSize: [24, 24]
            });
            
            marker.setIcon(icon);
            window.driverMarkers.addLayer(marker);
        });
    } catch (error) {
        console.error('Failed to refresh map drivers:', error);
    }
}

// Helper function
function getVehicleTypeName(type) {
    const types = {
        'economy': 'Economy Sedan',
        'comfort': 'Comfort Sedan', 
        'premium': 'Premium Vehicle',
        'suv': 'SUV'
    };
    return types[type] || type;
}

// Update map initialization to use MongoDB drivers
async function initializeMapWithDrivers() {
    try {
        const drivers = await getAllDrivers();
        // Use drivers from MongoDB
        console.log('Loaded drivers from MongoDB:', drivers.length);
    } catch (error) {
        console.error('Failed to load drivers from MongoDB:', error);
    }
}

// Enhanced assign driver function with MongoDB update
window.assignDriver = async function(rideId) {
    try {
        const ride = window.rideRequestsData.find(r => r.id === rideId);
        const drivers = await getAllDrivers();
        const availableDrivers = drivers.filter(d => d.status === 'online');
        
        if (availableDrivers.length > 0) {
            const closestDriver = availableDrivers.reduce((closest, driver) => {
                const distance = Math.sqrt(
                    Math.pow(driver.coordinates.lat - ride.pickup[0], 2) + 
                    Math.pow(driver.coordinates.lng - ride.pickup[1], 2)
                );
                return !closest || distance < closest.distance ? { driver, distance } : closest;
            }, null);

            if (closestDriver) {
                await updateDriverStatus(closestDriver.driver.driverId, 'riding');
                alert(`✅ Assigned ${closestDriver.driver.name} to ${ride.customer}'s ride!\n\nStatus updated in MongoDB.`);
                await updateDriverPanels();
                if (window.mapInitialized) {
                    await refreshMapDrivers();
                }
            }
        } else {
            alert('No available drivers at the moment!');
        }
    } catch (error) {
        alert(`❌ Assignment failed: ${error.message}`);
    }
};

// Initialize when page loads
updateDriverPanels();
