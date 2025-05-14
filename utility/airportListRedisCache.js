/**
 * Mock Airport data cache 
 * Simulates a Redis cache for airport information
 */

// Sample airport data for common airports
const airportData = {
  // Middle East
  'DXB': { airportCode: 'DXB', airportNameEn: 'Dubai International Airport', cityNameEn: 'Dubai', cityNameFa: 'دبی', countryCode: 'AE' },
  'AUH': { airportCode: 'AUH', airportNameEn: 'Abu Dhabi International Airport', cityNameEn: 'Abu Dhabi', cityNameFa: 'ابوظبی', countryCode: 'AE' },
  'DOH': { airportCode: 'DOH', airportNameEn: 'Hamad International Airport', cityNameEn: 'Doha', cityNameFa: 'دوحه', countryCode: 'QA' },
  'IST': { airportCode: 'IST', airportNameEn: 'Istanbul Airport', cityNameEn: 'Istanbul', cityNameFa: 'استانبول', countryCode: 'TR' },
  'SAW': { airportCode: 'SAW', airportNameEn: 'Sabiha Gokcen International Airport', cityNameEn: 'Istanbul', cityNameFa: 'استانبول', countryCode: 'TR' },
  
  // Iran
  'IKA': { airportCode: 'IKA', airportNameEn: 'Imam Khomeini International Airport', cityNameEn: 'Tehran', cityNameFa: 'تهران', countryCode: 'IR' },
  'THR': { airportCode: 'THR', airportNameEn: 'Mehrabad International Airport', cityNameEn: 'Tehran', cityNameFa: 'تهران', countryCode: 'IR' },
  'MHD': { airportCode: 'MHD', airportNameEn: 'Mashhad International Airport', cityNameEn: 'Mashhad', cityNameFa: 'مشهد', countryCode: 'IR' },
  'SYZ': { airportCode: 'SYZ', airportNameEn: 'Shiraz International Airport', cityNameEn: 'Shiraz', cityNameFa: 'شیراز', countryCode: 'IR' },
  'KIH': { airportCode: 'KIH', airportNameEn: 'Kish International Airport', cityNameEn: 'Kish Island', cityNameFa: 'کیش', countryCode: 'IR' },
  'GSM': { airportCode: 'GSM', airportNameEn: 'Qeshm International Airport', cityNameEn: 'Qeshm Island', cityNameFa: 'قشم', countryCode: 'IR' },
  
  // Europe
  'LHR': { airportCode: 'LHR', airportNameEn: 'Heathrow Airport', cityNameEn: 'London', cityNameFa: 'لندن', countryCode: 'GB' },
  'CDG': { airportCode: 'CDG', airportNameEn: 'Charles de Gaulle Airport', cityNameEn: 'Paris', cityNameFa: 'پاریس', countryCode: 'FR' },
  'FRA': { airportCode: 'FRA', airportNameEn: 'Frankfurt Airport', cityNameEn: 'Frankfurt', cityNameFa: 'فرانکفورت', countryCode: 'DE' },
  'MAD': { airportCode: 'MAD', airportNameEn: 'Adolfo Suárez Madrid–Barajas Airport', cityNameEn: 'Madrid', cityNameFa: 'مادرید', countryCode: 'ES' },
  
  // Asia
  'PEK': { airportCode: 'PEK', airportNameEn: 'Beijing Capital International Airport', cityNameEn: 'Beijing', cityNameFa: 'پکن', countryCode: 'CN' },
  'HND': { airportCode: 'HND', airportNameEn: 'Haneda Airport', cityNameEn: 'Tokyo', cityNameFa: 'توکیو', countryCode: 'JP' },
  'BKK': { airportCode: 'BKK', airportNameEn: 'Suvarnabhumi Airport', cityNameEn: 'Bangkok', cityNameFa: 'بانکوک', countryCode: 'TH' },
  
  // North America
  'JFK': { airportCode: 'JFK', airportNameEn: 'John F. Kennedy International Airport', cityNameEn: 'New York', cityNameFa: 'نیویورک', countryCode: 'US' },
  'LAX': { airportCode: 'LAX', airportNameEn: 'Los Angeles International Airport', cityNameEn: 'Los Angeles', cityNameFa: 'لس آنجلس', countryCode: 'US' },
  'YYZ': { airportCode: 'YYZ', airportNameEn: 'Toronto Pearson International Airport', cityNameEn: 'Toronto', cityNameFa: 'تورنتو', countryCode: 'CA' },
};

/**
 * Cache lookup for airports
 */
exports.cache = function(airportCode, callback) {
  if (airportData[airportCode]) {
    setTimeout(() => {
      callback(null, airportData[airportCode]);
    }, 10); // Simulate small network delay
  } else {
    // Generate a generic entry for unknown airport codes
    const genericAirport = {
      airportCode: airportCode,
      airportNameEn: `${airportCode} Airport`,
      cityNameEn: airportCode,
      cityNameFa: airportCode,
      countryCode: 'XX' // Unknown country code
    };
    setTimeout(() => {
      callback(null, genericAirport);
    }, 10);
  }
}; 