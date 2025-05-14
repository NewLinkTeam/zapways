/**
 * Mock Airplane data cache 
 * Simulates a Redis cache for aircraft information
 */

// Sample aircraft data
const aircraftData = {
  // Boeing aircraft
  '737': { code: '737', name: 'Boeing 737', capacity: 160 },
  '738': { code: '738', name: 'Boeing 737-800', capacity: 180 },
  '739': { code: '739', name: 'Boeing 737-900', capacity: 180 },
  '747': { code: '747', name: 'Boeing 747', capacity: 410 },
  '772': { code: '772', name: 'Boeing 777-200', capacity: 310 },
  '773': { code: '773', name: 'Boeing 777-300', capacity: 370 },
  '77W': { code: '77W', name: 'Boeing 777-300ER', capacity: 386 },
  '788': { code: '788', name: 'Boeing 787-8 Dreamliner', capacity: 242 },
  '789': { code: '789', name: 'Boeing 787-9 Dreamliner', capacity: 290 },
  '78X': { code: '78X', name: 'Boeing 787-10 Dreamliner', capacity: 330 },
  
  // Airbus aircraft
  '319': { code: '319', name: 'Airbus A319', capacity: 140 },
  '320': { code: '320', name: 'Airbus A320', capacity: 180 },
  '321': { code: '321', name: 'Airbus A321', capacity: 220 },
  '332': { code: '332', name: 'Airbus A330-200', capacity: 280 },
  '333': { code: '333', name: 'Airbus A330-300', capacity: 300 },
  '339': { code: '339', name: 'Airbus A330-900neo', capacity: 300 },
  '359': { code: '359', name: 'Airbus A350-900', capacity: 325 },
  '35K': { code: '35K', name: 'Airbus A350-1000', capacity: 366 },
  '380': { code: '380', name: 'Airbus A380', capacity: 525 },
  'A380': { code: 'A380', name: 'Airbus A380', capacity: 525 },
  
  // Embraer aircraft
  'E70': { code: 'E70', name: 'Embraer E170', capacity: 80 },
  'E75': { code: 'E75', name: 'Embraer E175', capacity: 88 },
  'E90': { code: 'E90', name: 'Embraer E190', capacity: 100 },
  'E95': { code: 'E95', name: 'Embraer E195', capacity: 124 },
  
  // Other aircraft
  'AT7': { code: 'AT7', name: 'ATR 72', capacity: 70 },
  'DH8': { code: 'DH8', name: 'Bombardier Dash 8', capacity: 78 },
  'CR7': { code: 'CR7', name: 'Bombardier CRJ700', capacity: 78 }
};

/**
 * Cache lookup for aircraft
 */
exports.cache = function(aircraftCode, callback) {
  if (aircraftData[aircraftCode]) {
    setTimeout(() => {
      callback(null, aircraftData[aircraftCode]);
    }, 10); // Simulate small network delay
  } else {
    // Generate a generic entry for unknown aircraft codes
    const genericAircraft = {
      code: aircraftCode,
      name: `Aircraft ${aircraftCode}`,
      capacity: 180 // Default capacity
    };
    setTimeout(() => {
      callback(null, genericAircraft);
    }, 10);
  }
}; 