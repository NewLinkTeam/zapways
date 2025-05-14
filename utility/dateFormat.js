/**
 * Date formatting utility for handling Persian calendar conversions
 */

const persianDayNames = {
  'Sat': 'شنبه',
  'Sun': 'یکشنبه',
  'Mon': 'دوشنبه',
  'Tue': 'سه‌شنبه',
  'Wed': 'چهارشنبه',
  'Thu': 'پنج‌شنبه',
  'Fri': 'جمعه'
};

const persianMonthNames = {
  '1': 'حمل',
  '2': 'ثور',
  '3': 'جوزا',
  '4': 'سرظان',
  '5': 'اسد',
  '6': 'سنبله',
  '7': 'میزان',
  '8': 'عقرب',
  '9': 'قوس',
  '10': 'جدی',
  '11': 'دلو ',
  '12': 'حوت'
};

const dateFormat = {
  /**
   * Get Persian day name from English abbreviation
   */
  getDayName: function(dayAbbr) {
    return persianDayNames[dayAbbr] || dayAbbr;
  },
  
  /**
   * Get Persian month name from month number
   */
  getPersianMonth: function(monthNum) {
    return persianMonthNames[monthNum] || monthNum;
  }
};

module.exports = dateFormat; 