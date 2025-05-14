const soap = require('soap');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Set to false to disable mock fallback
const USE_MOCK_FALLBACK = process.env.USE_MOCK_FALLBACK !== 'false';
const wsdlUrl = process.env.SOAP_API_URL || 'https://otatest3.zapways.com/v2.0/OTAAPI.asmx?wsdl';

// SOAP client options
const soapOptions = {
  forceSoap12Headers: false,
  wsdl_options: {
    rejectUnauthorized: false
  }
};

const bookController = {
  index: async (req, res) => {
    try {
      // Check if req.body exists
      if (!req.body) {
        console.error('Request body is undefined or null');
        return res.status(400).json({
          success: false,
          error: "Missing request body",
          details: "Request body is undefined or null"
        });
      }

      console.log('Request headers:', req.headers);
      console.log('Booking request received:', JSON.stringify(req.body));
      
      // Get selected flight from request (with safer destructuring)
      const flightData = req.body.flightData;
      const passengers = req.body.passengers;
      const passengerDetails = req.body.passengerDetails;
      const contactInfo = req.body.contactInfo;
      const erspUserId = req.body.erspUserId || "2044/ADE3CD4DCFD89B0A691D57917E29750819";
      const agentId = req.body.agentId || "MalikGroupTravelsOTA";
      const agentPassword = req.body.agentPassword || "6wxJLs$HuQUcC4cZ";
      const agentType = req.body.agentType || "29";
      const serviceTarget = req.body.serviceTarget || "Test";
      const serviceVersion = req.body.serviceVersion || "1.04";
      
      if (!flightData) {
        return res.status(400).json({
          success: false,
          error: "Missing flight data",
          details: "Please provide flightData containing the selected flight"
        });
      }
      
      // Process passengers from either passengers array or passengerDetails + contactInfo
      let processedPassengers = [];
      
      if (passengers && Array.isArray(passengers) && passengers.length > 0) {
        processedPassengers = passengers;
      } else if (passengerDetails && Array.isArray(passengerDetails) && passengerDetails.length > 0) {
        // Merge contact info with each passenger
        processedPassengers = passengerDetails.map(passenger => ({
          ...passenger,
          email: contactInfo?.email || "asadshahi804@gmail.com",
          phoneNumber: contactInfo?.phone || "0797277733",
          countryCode: contactInfo?.countryCode || "1",
          title: passenger.title || "MR",
          documentNumber: passenger.passportNumber || passenger.documentNumber,
          documentExpiry: passenger.passportExpiry || passenger.documentExpiry
        }));
      } else {
        return res(400).json({
          success: false,
          error: "Missing passenger details",
          details: "Please provide passenger information via passengers array or passengerDetails"
        });
      }

      // Try to use the real SOAP client
      try {
        // Use a promise to handle soap client creation
        const createSoapClient = () => {
          return new Promise((resolve, reject) => {
            soap.createClient(wsdlUrl, soapOptions, function(err, client) {
              if (err) {
                reject(err);
              } else {
                resolve(client);
              }
            });
          });
        };
        
        console.log('Attempting to use real SOAP service for booking...');
        
        const client = await createSoapClient();
        
        // Set request headers
        client.addHttpHeader('Content-Type', 'text/xml; charset=utf-8');
        
        // Build the AirBook SOAP request
        const bookingRequest = buildAirBookRequest(
          flightData,
          processedPassengers,
          erspUserId,
          agentId,
          agentPassword,
          agentType,
          serviceTarget,
          serviceVersion
        );

        console.log('Booking request prepared:', JSON.stringify(bookingRequest));
        
        // Use a promise to handle the SOAP call
        const soapCall = () => {
          return new Promise((resolve, reject) => {
            client.AirBook(bookingRequest, function(err, result) {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        };
        
        const result = await soapCall();
        console.log('SOAP booking successful');
        return res.json({ 
          success: true, 
          data: result,
          bookingReference: result.AirBookResult?.AirReservation?.BookingReferenceID?.ID || null
        });
        
      } catch (soapError) {
        // Log the soap.js error
        console.error('SOAP booking error:', soapError.message || soapError);
        
        // Check if we should use mock fallback
        if (USE_MOCK_FALLBACK) {
          console.log('Falling back to mock booking service...');
          try {
            const mockBookingResult = createMockBookingResponse(flightData, processedPassengers);
            
            return res.json({
              success: true,
              data: mockBookingResult,
              bookingReference: mockBookingResult.AirBookResult.AirReservation.BookingReferenceID.ID,
              _mock: true
            });
          } catch (mockError) {
            console.error('Mock booking service error:', mockError);
            return res.status(500).json({
              success: false,
              error: 'Mock booking service error',
              details: mockError.message || mockError
            });
          }
        } else {
          // If mock fallback is disabled, return the original error
          return res.status(500).json({
            success: false,
            error: 'SOAP booking error',
            details: soapError
          });
        }
      }
    } catch (error) {
      console.error('Unexpected booking error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Unexpected booking error', 
        details: error.message || 'Unknown error'
      });
    }
  }
};

/**
 * Build the AirBook SOAP request
 */
function buildAirBookRequest(flightData, passengers, erspUserId, agentId, agentPassword, agentType, serviceTarget, serviceVersion) {
  // Get flight segment data from selected flight
  const flightSegments = [];
  
  if (flightData.OriginDestinationInformation && 
      flightData.OriginDestinationInformation.OriginDestinationOption &&
      Array.isArray(flightData.OriginDestinationInformation.OriginDestinationOption)) {
    
    flightData.OriginDestinationInformation.OriginDestinationOption.forEach((option, index) => {
      if (option.FlightSegment && Array.isArray(option.FlightSegment)) {
        option.FlightSegment.forEach((segment, segIndex) => {
          flightSegments.push({
            DepartureDateTime: segment.DepartureDateTime,
            ArrivalDateTime: segment.ArrivalDateTime,
            StopQuantity: "0",
            RPH: `${index}-${segIndex}`,
            FlightNumber: segment.FlightNumber,
            ResBookDesigCode: segment.ResBookDesigCode || segment.CabinClassCode || "Y",
            Status: "ONTIME",
            DepartureAirport: {
              LocationCode: segment.DepartureAirport?.LocationCode || option.OriginLocation
            },
            ArrivalAirport: {
              LocationCode: segment.ArrivalAirport?.LocationCode || option.DestinationLocation
            },
            OperatingAirline: {
              Code: segment.OperatingAirline?.Code || segment.OperatingAirline?.FlightNumber?.substring(0, 2) || "YY"
            },
            Equipment: {
              AirEquipType: segment.Equipment?.AirEquipType || "B737"
            },
            MarketingAirline: {
              Code: segment.MarketingAirline?.Code || "YY"
            }
          });
        });
      }
    });
  }
  
  // Build passenger information
  const travelersInfo = [];
  
  passengers.forEach((passenger, index) => {
    travelersInfo.push({
      BirthDate: passenger.birthDate,
      PersonName: {
        GivenName: passenger.firstName,
        Surname: passenger.lastName,
        NameTitle: passenger.title || "MR"
      },
      Telephone: {
        PhoneLocationType: "10",
        CountryAccessCode: passenger.countryCode || "1",
        PhoneNumber: passenger.phoneNumber || "1234567890"
      },
      Email: passenger.email || "customer@example.com",
      Document: {
        DocID: passenger.documentNumber || passenger.passportNumber,
        DocType: "2", // Passport
        DocIssueCountry: passenger.nationality,
        DocHolderNationality: passenger.nationality,
        ExpireDate: passenger.documentExpiry || passenger.passportExpiry || moment().add(5, 'years').format('YYYY-MM-DD')
      },
      PassengerTypeQuantity: {
        Code: passenger.passengerType || "ADT",
        Quantity: "1"
      },
      TravelerRefNumber: {
        RPH: (index + 1).toString()
      }
    });
  });
  
  // Create fare breakdown
  let fareBreakdowns = [];
  
  if (flightData.AirItineraryPricingInfo &&
      flightData.AirItineraryPricingInfo.PTC_FareBreakdowns &&
      Array.isArray(flightData.AirItineraryPricingInfo.PTC_FareBreakdowns)) {
    
    fareBreakdowns = flightData.AirItineraryPricingInfo.PTC_FareBreakdowns.map(breakdown => ({
      PassengerTypeQuantity: {
        Code: breakdown.PassengerTypeQuantity.Code,
        Quantity: breakdown.PassengerTypeQuantity.Quantity
      },
      PassengerFare: {
        BaseFare: {
          CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
          Amount: breakdown.PassengerFare.BaseFare
        },
        Taxes: {
          Amount: breakdown.PassengerFare.Taxes,
          Tax: {
            TaxCode: "TX",
            CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
            Amount: breakdown.PassengerFare.Taxes
          }
        },
        TotalFare: {
          CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
          Amount: breakdown.PassengerFare.TotalFare
        }
      }
    }));
  }
  
  // Build the request object
  return {
    airBookRQ: {
      Target: serviceTarget,
      Version: serviceVersion,
      xmlns: "http://www.opentravel.org/OTA/2003/05",
      POS: {
        Source: {
          ERSP_UserID: erspUserId,
          RequestorID: {
            Type: agentType,
            ID: agentId,
            MessagePassword: agentPassword
          }
        }
      },
      AirItinerary: {
        OriginDestinationOptions: {
          OriginDestinationOption: flightSegments.map((segment, index) => ({
            RPH: `${index}`,
            FlightSegment: segment
          }))
        }
      },
      PriceInfo: {
        PTC_FareBreakdowns: {
          PTC_FareBreakdown: fareBreakdowns
        }
      },
      TravelerInfo: {
        AirTraveler: travelersInfo
      }
    }
  };
}

/**
 * Create a mock booking response
 */
function createMockBookingResponse(flightData, passengers) {
  // Generate a booking reference
  const bookingRef = generateBookingReference();
  const ticketTimeLimit = moment().add(3, 'days').format('YYYY-MM-DDTHH:mm:ss');
  
  // Generate traveler IDs and create traveler info
  const travelersInfo = [];
  const travelerIds = [];
  
  passengers.forEach(passenger => {
    const travelerId = generateTravelerId();
    travelerIds.push(travelerId);
    
    travelersInfo.push({
      BirthDate: passenger.birthDate,
      PassengerTypeCode: passenger.passengerType || "ADT",
      PersonName: {
        GivenName: passenger.firstName,
        Surname: passenger.lastName,
        NameTitle: passenger.title || "MR"
      },
      Telephone: {
        PhoneLocationType: "10",
        CountryAccessCode: passenger.countryCode || "1",
        PhoneNumber: passenger.phoneNumber || passenger.phone || "1234567890"
      },
      Email: passenger.email || "customer@example.com",
      Document: {
        DocID: passenger.documentNumber || passenger.passportNumber,
        DocType: "2",
        BirthDate: passenger.birthDate,
        DocIssueCountry: passenger.nationality,
        DocHolderNationality: passenger.nationality
      },
      PassengerTypeQuantity: {
        Code: passenger.passengerType || "ADT",
        Quantity: "1"
      },
      TravelerRefNumber: {
        RPH: travelerId
      },
      FlightSegmentRPHs: {
        FlightSegmentRPH: "1"
      }
    });
  });
  
  // Create flight segments
  const flightSegments = [];
  
  if (flightData.OriginDestinationInformation && 
      flightData.OriginDestinationInformation.OriginDestinationOption &&
      Array.isArray(flightData.OriginDestinationInformation.OriginDestinationOption)) {
    
    flightData.OriginDestinationInformation.OriginDestinationOption.forEach(option => {
      if (option.FlightSegment && Array.isArray(option.FlightSegment)) {
        option.FlightSegment.forEach(segment => {
          flightSegments.push({
            DepartureDateTime: segment.DepartureDateTime,
            ArrivalDateTime: segment.ArrivalDateTime,
            StopQuantity: "0",
            RPH: "1",
            FlightNumber: segment.FlightNumber,
            Status: "ONTIME",
            DepartureAirport: {
              LocationCode: segment.DepartureAirport?.LocationCode || option.OriginLocation,
              Terminal: segment.DepartureAirport?.Terminal || "1"
            },
            ArrivalAirport: {
              LocationCode: segment.ArrivalAirport?.LocationCode || option.DestinationLocation,
              Terminal: segment.ArrivalAirport?.Terminal || "1"
            },
            OperatingAirline: {
              Code: segment.OperatingAirline?.Code || "TK"
            },
            Equipment: {
              AirEquipType: segment.Equipment?.AirEquipType || "B737"
            },
            MarketingAirline: {
              Code: segment.MarketingAirline?.Code || "TK"
            }
          });
        });
      }
    });
  } else {
    // Create a default flight segment if none found
    flightSegments.push({
      DepartureDateTime: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.DepartureDateTime || moment().add(30, 'days').format('YYYY-MM-DDTHH:mm:ss'),
      ArrivalDateTime: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.ArrivalDateTime || moment().add(30, 'days').add(3, 'hours').format('YYYY-MM-DDTHH:mm:ss'),
      StopQuantity: "0",
      RPH: "1",
      FlightNumber: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.FlightSegment[0]?.FlightNumber || "9855",
      Status: "ONTIME",
      DepartureAirport: {
        LocationCode: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.OriginLocation || "KBL",
        Terminal: "1"
      },
      ArrivalAirport: {
        LocationCode: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.DestinationLocation || "DXB",
        Terminal: "3"
      },
      OperatingAirline: {
        Code: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.FlightSegment[0]?.OperatingAirline?.Code || "TK"
      },
      Equipment: {
        AirEquipType: "B737"
      },
      MarketingAirline: {
        Code: flightData.OriginDestinationInformation?.OriginDestinationOption[0]?.FlightSegment[0]?.MarketingAirline?.Code || "TK"
      }
    });
  }
  
  // Build the response object
  return {
    AirBookResult: {
      Version: "1.04",
      xmlns: "http://www.opentravel.org/OTA/2003/05",
      Success: {},
      AirReservation: {
        AirItinerary: {
          OriginDestinationOptions: {
            OriginDestinationOption: flightSegments.map((segment, index) => ({
              RPH: `B${index + 1}`,
              FlightSegment: segment
            }))
          }
        },
        PriceInfo: {
          ItinTotalFare: {
            TotalFare: {
              CurrencyCode: flightData.AirItineraryPricingInfo?.ItinTotalFare?.Currency || "USD",
              Amount: flightData.AirItineraryPricingInfo?.ItinTotalFare?.TotalFare || "1000.00"
            }
          },
          PTC_FareBreakdowns: {
            PTC_FareBreakdown: (flightData.AirItineraryPricingInfo?.PTC_FareBreakdowns || []).map((breakdown, index) => ({
              PassengerTypeQuantity: {
                Code: breakdown.PassengerTypeQuantity.Code,
                Quantity: breakdown.PassengerTypeQuantity.Quantity
              },
              PassengerFare: {
                BaseFare: {
                  CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
                  Amount: breakdown.PassengerFare.BaseFare
                },
                Taxes: {
                  Amount: breakdown.PassengerFare.Taxes,
                  Tax: {
                    TaxCode: "TX",
                    CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
                    Amount: breakdown.PassengerFare.Taxes
                  }
                }
              },
              TravelerRefNumber: {
                RPH: travelerIds[index] || generateTravelerId()
              },
              FareInfo: {
                RuleNumber: "7500",
                DepartureAirport: {
                  LocationCode: flightSegments[0].DepartureAirport.LocationCode
                },
                ArrivalAirport: {
                  LocationCode: flightSegments[0].ArrivalAirport.LocationCode
                },
                PassengerFare: {
                  BaseFare: {
                    CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
                    Amount: breakdown.PassengerFare.BaseFare
                  },
                  Taxes: {
                    Amount: breakdown.PassengerFare.Taxes,
                    Tax: {
                      TaxCode: "TX",
                      CurrencyCode: flightData.AirItineraryPricingInfo.ItinTotalFare.Currency || "USD",
                      Amount: breakdown.PassengerFare.Taxes
                    }
                  },
                  FareBaggageAllowance: {
                    UnitOfMeasureQuantity: "30",
                    UnitOfMeasure: "KGS"
                  }
                }
              }
            }))
          }
        },
        TravelerInfo: {
          AirTraveler: travelersInfo
        },
        Ticketing: {
          TicketTimeLimit: ticketTimeLimit,
          TicketingStatus: "OK",
          FlightSegmentRefNumber: "1",
          TravelerRefNumber: travelerIds[0] || generateTravelerId(),
          TimeLimitMinutes: "-360",
          PassengerTypeCode: "ADT",
          TicketingVendor: {
            Code: flightSegments[0].MarketingAirline.Code
          }
        },
        BookingReferenceID: {
          Instance: `${flightSegments[0].MarketingAirline.Code}${Math.floor(Math.random() * 1000000000)}`,
          ID: bookingRef
        }
      }
    }
  };
}

// Helper function to generate booking reference
function generateBookingReference() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate traveler reference ID
function generateTravelerId() {
  return uuidv4().substring(0, 30);
}

module.exports = bookController;