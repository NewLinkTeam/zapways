const soap = require('soap');
const MockOtaService = require('./mock-service');

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

const searchController = {
  index: async (req, res) => {
    try {
      const {
        origin,
        destination,
        departureDate,
        erspUserId,
        agentId,
        agentPassword,
        agentType,
        serviceTarget,
        serviceVersion,
        Code,
        Quantity,
        originDestinations
      } = req.body;

      // Process multi city or multi city and round trip or one way
      const processedOriginDestinationInformation = originDestinations 
        ? originDestinations 
        : Array.isArray(req.body.OriginDestinationInformation)
          ? req.body.OriginDestinationInformation.map((item, index) => ({
              '@RPH': (index + 1).toString(),  
              DepartureDateTime: item.departureDate,
              OriginLocation: {
                '@LocationCode': item.origin,
              },
              DestinationLocation: {
                '@LocationCode': item.destination,
              },
            }))
          : [{
              '@RPH': '1',
              DepartureDateTime: req.body.departureDate,
              OriginLocation: {
                '@LocationCode': req.body.origin,
              },
              DestinationLocation: {
                '@LocationCode': req.body.destination,
              },
            }];

      const requestArgs = {
        airLowFareSearchRQ: {
          '@EchoToken': new Date().getTime().toString(),
          '@Target': serviceTarget,
          '@Version': serviceVersion,
          '@xmlns': 'http://www.opentravel.org/OTA/2003/05',
          POS: {
            Source: {
              '@ERSP_UserID': erspUserId,
              RequestorID: {
                '@Type': agentType,
                '@ID': agentId,
                '@MessagePassword': agentPassword,
              },
            },
          },
          OriginDestinationInformation: processedOriginDestinationInformation,
          TravelerInfoSummary: {
            AirTravelerAvail: {
              PassengerTypeQuantity: {
                '@Code': Code,
                '@Quantity': Quantity,
              },
            },
          },
        },
      };

      // First, try to use the real soap.js client
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
        
        console.log('Attempting to use real SOAP service...');
        const client = await createSoapClient();
        
        // Set request headers
        client.addHttpHeader('Content-Type', 'text/xml; charset=utf-8');
        
        // Use a promise to handle the SOAP call
        const soapCall = () => {
          return new Promise((resolve, reject) => {
            client.AirLowFareSearch(requestArgs, function(err, result) {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        };
        
        const result = await soapCall();
        console.log('SOAP call successful');
        return res.json({ success: true, data: result });
        
      } catch (soapError) {
        // Log the soap.js error
        console.error('SOAP error:', soapError.message || soapError);
        
        // Check if we should use mock fallback
        if (USE_MOCK_FALLBACK) {
          console.log('Falling back to mock service...');
          try {
            const mockService = new MockOtaService({ debug: true });
            const mockResult = await mockService.searchLowFare(req.body);
            return res.json({ 
              success: true, 
              data: mockResult,
              _mock: true // Indicate this is mock data
            });
          } catch (mockError) {
            console.error('Mock service error:', mockError);
            return res.status(500).json({ 
              error: 'Mock service error', 
              details: mockError.message || mockError 
            });
          }
        } else {
          // If mock fallback is disabled, return the original error
          return res.status(500).json({ 
            error: 'SOAP client error', 
            details: soapError 
          });
        }
      }
      
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Unexpected error', details: error.message });
    }
  },
};

module.exports = searchController;
