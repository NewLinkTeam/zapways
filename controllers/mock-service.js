/**
 * Mock SOAP service for development and testing
 * Use this while the real service is unavailable
 */
const moment = require('moment');
const momentJalaali = require('moment-jalaali');
const { v4: uuidv4 } = require('uuid');

class MockOtaService {
  constructor(options = {}) {
    this.debug = options.debug || false;
  }
  
  log(...args) {
    if (this.debug) {
      console.log('[MockService]', ...args);
    }
  }
  
  /**
   * Mock air low fare search response
   */
  async searchLowFare(params) {
    this.log('Processing mock flight search request:', params);
    
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extract the flight information from params based on available format
    let flightSegments = [];
    
    if (params.originDestinations && Array.isArray(params.originDestinations)) {
      // Process originDestinations format
      flightSegments = params.originDestinations.map(segment => ({
        origin: segment.OriginLocation['@LocationCode'],
        destination: segment.DestinationLocation['@LocationCode'],
        departureDate: segment.DepartureDateTime
      }));
    } else if (params.OriginDestinationInformation && Array.isArray(params.OriginDestinationInformation)) {
      // Process OriginDestinationInformation array format
      flightSegments = params.OriginDestinationInformation.map(segment => ({
        origin: segment.origin,
        destination: segment.destination,
        departureDate: segment.departureDate
      }));
    } else {
      // Use direct properties for simple format
      flightSegments = [{
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate
      }];
    }
    
    // Generate mock results for all segments
    const mockResults = [];
    for (let i = 0; i < flightSegments.length; i++) {
      const segment = flightSegments[i];
      const results = this._generateMockResults(
        segment.origin, 
        segment.destination, 
        segment.departureDate, 
        3
      );
      mockResults.push(...results);
    }
    
    // Generate mock session ID
    const sessionId = { uuid: uuidv4() };

    // Transform the mock results to match the expected OTA format
    const transformedResults = await this._transformToOtaFormat(mockResults, params, sessionId);
    
    return transformedResults;
  }

  /**
   * Generate mock flight search results
   */
  _generateMockResults(origin, destination, departureDate, count = 3) {
    const results = [];
    
    for (let i = 1; i <= count; i++) {
      results.push(this._generateMockFlightResult(origin, destination, departureDate, i));
    }
    
    return results;
  }
  
  /**
   * Generate a single mock flight result
   */
  _generateMockFlightResult(origin, destination, departureDate, id) {
    const airlines = [
      { code: 'EK', name: 'Emirates' },
      { code: 'EY', name: 'Etihad Airways' },
      { code: 'QR', name: 'Qatar Airways' },
      { code: 'TK', name: 'Turkish Airlines' },
      { code: 'KU', name: 'Kuwait Airways' }
    ];
    
    const aircraft = ['738', '77W', '320', '789', 'A380'];
    
    // Random airline
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    
    // Flight number - 3 or 4 digits
    const flightNumber = Math.floor(Math.random() * 9000) + 1000;
    
    // Random aircraft
    const aircraftType = aircraft[Math.floor(Math.random() * aircraft.length)];
    
    // Price calculations
    const basePrice = 300 + Math.floor(Math.random() * 700); // Between $300-$1000
    const taxAmount = Math.round(basePrice * 0.15);
    const totalPrice = basePrice + taxAmount;
    
    // Ensure we have a valid departureDate and extract date
    if (!departureDate) {
      console.error("Missing departureDate for segment", { origin, destination });
      departureDate = moment().format('YYYY-MM-DDTHH:mm:ss'); // Default to current time
    }
    
    // Extract date safely
    const date = departureDate.split('T')[0];
    
    // Flight times
    const hours = 2 + Math.floor(Math.random() * 5); // 2-6 hour flight
    const departHour = 6 + Math.floor(Math.random() * 12); // Depart between 6am and 6pm
    const departTime = `${date}T${departHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
    
    // Calculate arrival time
    const departDate = new Date(departTime);
    const arrivalDate = new Date(departDate.getTime() + (hours * 60 * 60 * 1000));
    const arrivalTime = arrivalDate.toISOString().split('.')[0];
    
    // Format for the OTA structure
    const departureDateTime = moment(departTime).format('DD-MM-YYYYTHH:mm:ss');
    const arrivalDateTime = moment(arrivalTime).format('DD-MM-YYYYTHH:mm:ss');
    
    // Calculate journey duration in minutes
    const journeyDuration = hours * 60;

    // Terminal information
    const departureTerminal = `T${Math.floor(Math.random() * 3) + 1}`;
    const arrivalTerminal = `T${Math.floor(Math.random() * 3) + 1}`;
    
    // Create the mock result
    return {
      AirItineraryPricingInfo: {
        ItinTotalFare: {
          BaseFare: {
            Amount: basePrice.toFixed(2),
            CurrencyCode: "USD"
          },
          TotalFare: {
            Amount: totalPrice.toFixed(2),
            CurrencyCode: "USD"
          },
          TotalTax: {
            Amount: taxAmount.toFixed(2),
            CurrencyCode: "USD"
          }
        },
        PTC_FareBreakdowns: [
          {
            PassengerTypeQuantity: {
              Code: "ADT",
              Quantity: "1"
            },
            PassengerFare: {
              BaseFare: {
                Amount: basePrice.toFixed(2),
                CurrencyCode: "USD"
              },
              TotalFare: {
                Amount: totalPrice.toFixed(2),
                CurrencyCode: "USD"
              },
              TotalTax: {
                Amount: taxAmount.toFixed(2),
                CurrencyCode: "USD"
              }
            },
            BaggageInfo: ["1PC"]
          }
        ]
      },
      OriginDestinationOptions: [
        {
          FlightSegments: [
            {
              DepartureDateTime: departureDateTime,
              ArrivalDateTime: arrivalDateTime,
              FlightNumber: `${flightNumber}`,
              CabinClassText: "Y",
              JourneyDuration: journeyDuration,
              DepartureAirportLocationCode: origin,
              ArrivalAirportLocationCode: destination,
              MarketingAirlineCode: airline.code,
              departureTerminal: departureTerminal,
              ArrivalTerminal: arrivalTerminal,
              OperatingAirline: {
                Code: airline.code,
                FlightNumber: `${flightNumber}`,
                CompanyShortName: airline.name
              },
              SeatsRemaining: 9,
              baggage: "1PC"
            }
          ]
        }
      ]
    };
  }
  
  /**
   * Transform mock results to OTA format
   */
  async _transformToOtaFormat(results, request, sessionId) {
    // Get the OTA parser module
    const parser = require('./ota-parser');
    
    // Use the parser to transform results
    return new Promise((resolve) => {
      parser.ota(results, request, sessionId, (err, transformed) => {
        if (err) {
          console.error("Error transforming results:", err);
          resolve({ error: err });
        } else {
          resolve(transformed);
        }
      });
    });
  }
}

module.exports = MockOtaService; 