/**
 * Mock Airline data cache 
 * Simulates a Redis cache for airline information
 */

// Sample airline data
const airlineData = {
  // Middle East Airlines
  'EK': { iata: 'EK', name: 'Emirates', language: 'امارات' },
  'EY': { iata: 'EY', name: 'Etihad Airways', language: 'اتحاد' },
  'QR': { iata: 'QR', name: 'Qatar Airways', language: 'قطر ایرویز' },
  'TK': { iata: 'TK', name: 'Turkish Airlines', language: 'ترکیش ایرلاینز' },
  'KU': { iata: 'KU', name: 'Kuwait Airways', language: 'هواپیمایی کویت' },
  'SV': { iata: 'SV', name: 'Saudia', language: 'سعودی' },
  'ME': { iata: 'ME', name: 'Middle East Airlines', language: 'خاورمیانه' },
  'LY': { iata: 'LY', name: 'EL AL', language: 'ال عال' },
  'RJ': { iata: 'RJ', name: 'Royal Jordanian', language: 'رویال جردن' },
  
  // Iranian Airlines
  'IR': { iata: 'IR', name: 'Iran Air', language: 'ایران ایر' },
  'EP': { iata: 'EP', name: 'Iran Aseman Airlines', language: 'آسمان' },
  'W5': { iata: 'W5', name: 'Mahan Air', language: 'ماهان ایر' },
  'QB': { iata: 'QB', name: 'Qeshm Air', language: 'قشم ایر' },
  'Y9': { iata: 'Y9', name: 'Kish Air', language: 'کیش ایر' },
  'IV': { iata: 'IV', name: 'Caspian Airlines', language: 'کاسپین' },
  'Z3': { iata: 'Z3', name: 'Zagros Airlines', language: 'زاگرس' },
  'I3': { iata: 'I3', name: 'ATA Airlines', language: 'آتا' },
  'B9': { iata: 'B9', name: 'Iran Airtour', language: 'ایران ایرتور' },
  'SA': { iata: 'SA', name: 'Saha Airlines', language: 'ساها' },
  'ZV': { iata: 'ZV', name: 'Taban Air', language: 'تابان' },
  
  // European Airlines
  'BA': { iata: 'BA', name: 'British Airways', language: 'بریتیش ایرویز' },
  'AF': { iata: 'AF', name: 'Air France', language: 'ایر فرانس' },
  'LH': { iata: 'LH', name: 'Lufthansa', language: 'لوفت‌هانزا' },
  'AZ': { iata: 'AZ', name: 'Alitalia', language: 'آلیتالیا' },
  'IB': { iata: 'IB', name: 'Iberia', language: 'ایبریا' },
  'KL': { iata: 'KL', name: 'KLM', language: 'کی‌ال‌ام' },
  'OS': { iata: 'OS', name: 'Austrian Airlines', language: 'اتریشی' },
  'LX': { iata: 'LX', name: 'SWISS', language: 'سوئیس' },
  
  // Asian Airlines
  'CX': { iata: 'CX', name: 'Cathay Pacific', language: 'کاتای پاسیفیک' },
  'SQ': { iata: 'SQ', name: 'Singapore Airlines', language: 'سنگاپور ایرلاینز' },
  'MH': { iata: 'MH', name: 'Malaysia Airlines', language: 'مالزی ایرلاینز' },
  'TG': { iata: 'TG', name: 'Thai Airways', language: 'تای ایرویز' },
  'JL': { iata: 'JL', name: 'Japan Airlines', language: 'ژاپن ایرلاینز' },
  'NH': { iata: 'NH', name: 'All Nippon Airways', language: 'آل نیپون' },
  'OZ': { iata: 'OZ', name: 'Asiana Airlines', language: 'آسیانا ایرلاینز' },
  'KE': { iata: 'KE', name: 'Korean Air', language: 'کره‌ایر' },
  'CA': { iata: 'CA', name: 'Air China', language: 'ایر چاینا' },
  'CZ': { iata: 'CZ', name: 'China Southern Airlines', language: 'چاینا ساترن' },
  'MU': { iata: 'MU', name: 'China Eastern Airlines', language: 'چاینا ایسترن' },
  
  // North American Airlines
  'AA': { iata: 'AA', name: 'American Airlines', language: 'امریکن ایرلاینز' },
  'UA': { iata: 'UA', name: 'United Airlines', language: 'یونایتد ایرلاینز' },
  'DL': { iata: 'DL', name: 'Delta Air Lines', language: 'دلتا ایرلاینز' },
  'AC': { iata: 'AC', name: 'Air Canada', language: 'ایر کانادا' }
};

/**
 * Cache lookup for airlines
 */
exports.cache = function(airlineCode, callback) {
  if (airlineData[airlineCode]) {
    setTimeout(() => {
      callback(null, airlineData[airlineCode]);
    }, 10); // Simulate small network delay
  } else {
    // Generate a generic entry for unknown airline codes
    const genericAirline = {
      iata: airlineCode,
      name: `${airlineCode} Airways`,
      language: airlineCode
    };
    setTimeout(() => {
      callback(null, genericAirline);
    }, 10);
  }
}; 