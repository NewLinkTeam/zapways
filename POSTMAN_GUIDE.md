# Postman Testing Guide for Flight Booking API

## Setup

1. Open Postman
2. Create a new request
3. Set method to POST
4. Enter URL: `http://localhost:3001/api/bookflight`

## Headers

Set the following headers:
- `Content-Type`: `application/json`

## Request Body

Use the following JSON as your request body:

```json
{
  "flightData": {
    "SessionId": "c1e5afa2-61e9-4f2a-8123-9d4654183df8",
    "CombinationId": 0,
    "RecommendationId": 0,
    "AirItineraryPricingInfo": {
      "ItinTotalFare": {
        "BaseFare": "746.00",
        "TotalFare": "858.00",
        "TotalTax": "112.00",
        "Currency": "USD"
      },
      "PTC_FareBreakdowns": [
        {
          "PassengerFare": {
            "BaseFare": "746.00",
            "TotalFare": "858.00",
            "Taxes": "112.00",
            "Currency": "USD"
          },
          "PassengerTypeQuantity": {
            "Code": "ADT",
            "Quantity": "1"
          }
        }
      ]
    },
    "OriginDestinationInformation": {
      "OriginDestinationOption": [
        {
          "JourneyDuration": "02:00",
          "DepartureDateTime": "2025-06-01T15:25:00",
          "ArrivalDateTime": "2025-06-01T12:55:00",
          "OriginLocation": "KBL",
          "DestinationLocation": "DXB",
          "FlightSegment": [
            {
              "DepartureDateTime": "2025-06-01T15:25:00",
              "ArrivalDateTime": "2025-06-01T12:55:00",
              "FlightNumber": "9855",
              "MarketingAirline": {
                "Code": "TK",
                "CompanyShortName": "Turkish Airlines"
              },
              "OperatingAirline": {
                "Code": "TK",
                "FlightNumber": "9855",
                "CompanyShortName": "Turkish Airlines"
              },
              "CabinClassCode": "Economy"
            }
          ]
        }
      ]
    }
  },
  "passengerDetails": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "birthDate": "1990-01-01",
      "gender": "M",
      "passportNumber": "A12345678",
      "passportExpiry": "2030-01-01",
      "nationality": "AF",
      "passengerType": "ADT"
    }
  ],
  "contactInfo": {
    "email": "john.doe@example.com",
    "phone": "+93700123456"
  }
}
```

## Troubleshooting

If you're still experiencing issues, try the following:

1. **Check Content-Type**: Ensure your Content-Type header is correctly set to `application/json`

2. **Restart Server**: Stop and restart your Node.js server

3. **Check Raw vs JSON**: In Postman, make sure you're in the "raw" tab and have selected "JSON" from the dropdown

4. **Server Logs**: Check the server console for any error messages

5. **Test Script**: Run the test-booking-api.js script using Node.js to test the API directly:
   ```
   node test-booking-api.js
   ```

6. **Clear Cache**: Try clearing Postman's cache or creating a new request

7. **URL Double-Check**: Ensure the URL is correct and the server is running on the expected port 