const soap = require('soap');

const wsdlUrl = 'https://otatest3.zapways.com/v2.0/OTAAPI.asmx?wsdl';

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
      } = req.body;

      const requestArgs = {
        airLowFareSearchRQ: {
          '@EchoToken': new Date().getTime().toString(), // dynamic token
          '@Target': serviceTarget,
          '@Version': serviceVersion,
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
          OriginDestinationInformation: {
            '@RPH': '1',
            DepartureDateTime: departureDate,
            OriginLocation: {
              '@LocationCode': origin,
            },
            DestinationLocation: {
              '@LocationCode': destination,
            },
          },
          TravelerInfoSummary: {
            AirTravelerAvail: {
              PassengerTypeQuantity: {
                '@Code': 'ADT',
                '@Quantity': '1',
              },
            },
          },
        },
      };

      soap.createClient(wsdlUrl, function (err, client) {
        if (err) {
          console.error('SOAP client error:', err);
          return res.status(500).json({ error: 'SOAP client error', details: err });
        }

        client.AirLowFareSearch(requestArgs, function (err, result) {
          if (err) {
            console.error('SOAP call error:', err.body || err.message);
            return res.status(500).json({ error: 'SOAP call failed', details: err });
          } else {
            return res.json({ message: 'Success', result });
          }
        });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Unexpected error', details: error.message });
    }
  },
};

module.exports = searchController;
