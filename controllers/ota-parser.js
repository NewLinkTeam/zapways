/* eslint-disable require-unicode-regexp */
/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable max-statements */
const moment = require('moment');
const lodash = require('lodash');
const momentJalaali = require('moment-jalaali');
const dateFormat = require('../utility/dateFormat');
const airports = require('../utility/airportListRedisCache');
const airlines = require('../utility/airlineRedisCache');
const airplanes = require('../utility/airplaneRedisCache');
const async = require('async');

let self = {
    ota(results, request, SessionId, callback) {
        let output = [];
        let all = self.getAllAirportAirplaneAirline(results);
        let uniqueAirport = all.airport.filter((v, i, a) => a.indexOf(v) === i);
        let uniqueAirline = all.airline.filter((v, i, a) => a.indexOf(v) === i);
        async.map(uniqueAirport, self.initParallelAirportInfo, (err1, airportList) => {
            if (err1) console.log(err1);
            async.map(uniqueAirline, self.initParallelAirlineInfo, (err2, airline) => {
                if (err2) console.log(err2);
                for (let i = 0, len = results.length; i < len; i++) {
                    let baggageInfo = [];
                    let PTCArray = results[i].AirItineraryPricingInfo.PTC_FareBreakdowns.filter((PTCItem) => PTCItem.PassengerTypeQuantity.Code === 'ADT');
                    if (PTCArray.length > 0) {
                        baggageInfo = PTCArray[0].BaggageInfo;
                    }
                    output.push({
                        SessionId: SessionId.uuid,
                        CombinationId: i,
                        RecommendationId: 0,
                        SubsystemName: '5kflight',
                        AirItineraryPricingInfo: {
                            ItinTotalFare: self.getItinerary(results[i].AirItineraryPricingInfo),
                                // eslint-disable-next-line camelcase
                            PTC_FareBreakdowns: self.getFareBreakdowns(results[i].AirItineraryPricingInfo, request)
                        },
                            // Define functions to get Origin Destination Option
                        OriginDestinationInformation: {
                            OriginDestinationOption: self.getOriginDestinationOption(results[i], airportList, airline, baggageInfo)
                        }
                    });
                }

                callback(null, output);
            });
        });
    },
    initParallelAirportInfo(item, callback) {
        let out = {};
        airports.cache(item, (err, result) => {
            if (err) {
                //console.log(err);
                callback(null, null);
            } else if (typeof result === 'object') {
                out = result;
            }
            callback(null, out);
        });
    },
    initParallelAirlineInfo(item, callback) {
        let out = {};
        airlines.cache(item, (err, result) => {
            if (err) {
                // console.log(err);
                callback(null, null);
            } else if (typeof result === 'object') {
                out = result;
            }
            callback(null, out);
        });
    },
    isForeignFlight(origin, destination) {
        let isForeignObject = {};
        let isForeign = true;
        let flightType = 'charter';
        if (origin !== 'undefined' && destination !== 'undefined') {
            if (origin.countryCode === 'IR' && destination.countryCode === 'IR') {
                isForeign = false;
                if (origin.airportCode !== 'KIH' && destination.airportCode !== 'KIH' && origin.airportCode !== 'GSM' && destination.airportCode !== 'GSM') {
                    flightType = 'float';
                }
            }
        }
        isForeignObject = {
            isForeign,
            flightType
        };

        return isForeignObject;

    },
    initParallelAirplaneInfo(item, callback) {
        let out = {};
        airplanes.cache(item, (err, result) => {
            if (err) {
                // console.log(err);
                callback(null, null);
            } else if (typeof result === 'object') {
                out = result;
            }
            // console.log(out);
            callback(null, out);
        });
    },
    getAllAirportAirplaneAirline(prmResults) {
        let airline = [];
        let airport = [];
        // let airplane = [];
        for (let k = 0; k < prmResults.length; k++) {
            for (let x = 0; x < prmResults[k].OriginDestinationOptions.length; x++) {
                for (let z = 0; z < prmResults[k].OriginDestinationOptions[x].FlightSegments.length; z++) {
                    airport.push(prmResults[k].OriginDestinationOptions[x].FlightSegments[z].DepartureAirportLocationCode);
                    airport.push(prmResults[k].OriginDestinationOptions[x].FlightSegments[z].ArrivalAirportLocationCode);
                    airline.push(prmResults[k].OriginDestinationOptions[x].FlightSegments[z].MarketingAirlineCode);
                    airline.push(prmResults[k].OriginDestinationOptions[x].FlightSegments[z].OperatingAirline.Code);
                    // airplane.push(prmResults[k].OriginDestinationOptions[x].FlightSegments[z].equipment);
                   
                }
            }
        }

        return {
            airline,
            airport

        };
    },

   
    getItinerary(result) {
        return {
            BaseFare: result.ItinTotalFare.BaseFare.Amount,
            TotalFare:result.ItinTotalFare.TotalFare.Amount,
            Original: 0,
            // adultCommission * adult + childCommission * child + infantCommission * infant
            TotalCommission: 0,
            TotalTax: result.ItinTotalFare.TotalTax.Amount,
            ServiceTax: 0,
            Currency:result.ItinTotalFare.BaseFare.CurrencyCode
        };
    },
    getFareBreakdowns(result, request) {
        let output = [];
        // Check if TravelerInfoSummary exists and has required properties
        if (request.TravelerInfoSummary && 
            request.TravelerInfoSummary.AirTravelerAvail && 
            request.TravelerInfoSummary.AirTravelerAvail.PassengerTypeQuantity) {
            
            // Handle both array and single object cases
            let passengerTypes = request.TravelerInfoSummary.AirTravelerAvail.PassengerTypeQuantity;
            if (!Array.isArray(passengerTypes)) {
                passengerTypes = [passengerTypes];
            }
            
            passengerTypes.forEach((item) => {
                let PTCArray = result.PTC_FareBreakdowns.filter((PTCItem) => 
                    PTCItem.PassengerTypeQuantity && PTCItem.PassengerTypeQuantity.Code === item.Code);
                
                if (PTCArray.length > 0) {
                    output.push({
                        PassengerFare: {
                            BaseFare: PTCArray[0].PassengerFare.BaseFare.Amount,
                            TotalFare: PTCArray[0].PassengerFare.TotalFare.Amount,
                            Original: 0,
                            Commission: 0,
                            Taxes: PTCArray[0].PassengerFare.TotalTax.Amount,
                            ServiceTax: 0,
                            Currency: PTCArray[0].PassengerFare.BaseFare.CurrencyCode
                        },
                        PassengerTypeQuantity: {
                            Code: item.Code,
                            Quantity: item.Quantity
                        }
                    });
                } else {
                    output.push({
                        PassengerFare: {
                            BaseFare: 0,
                            TotalFare: 0,
                            Original: 0,
                            Commission: 0,
                            Taxes: 0,
                            ServiceTax: 0,
                            Currency: ''
                        },
                        PassengerTypeQuantity: {
                            Code: item.Code,
                            Quantity: item.Quantity
                        }
                    });
                }
            });
        } else {
            // Default passenger if TravelerInfoSummary is not properly structured
            output.push({
                PassengerFare: {
                    BaseFare: result.ItinTotalFare.BaseFare.Amount,
                    TotalFare: result.ItinTotalFare.TotalFare.Amount,
                    Original: 0,
                    Commission: 0,
                    Taxes: result.ItinTotalFare.TotalTax.Amount,
                    ServiceTax: 0,
                    Currency: result.ItinTotalFare.BaseFare.CurrencyCode
                },
                PassengerTypeQuantity: {
                    Code: 'ADT',
                    Quantity: '1'
                }
            });
        }

        return output;
    },

    // eslint-disable-next-line max-statements
    getOriginDestinationOption(results, airportList, airline, baggageInfo) {
        let output = [];
        for (let i = 0; i < results.OriginDestinationOptions.length; i++) {
            let originObj = lodash.find(airportList, { 'airportCode': results.OriginDestinationOptions[i].FlightSegments[0].DepartureAirportLocationCode });
            let destinationObj = lodash.find(airportList, { 'airportCode': results.OriginDestinationOptions[i].FlightSegments[results.OriginDestinationOptions[i].FlightSegments.length - 1].ArrivalAirportLocationCode  });
            
            // Default values if airport info is not found
            if (!originObj) {
                originObj = { 
                    airportCode: results.OriginDestinationOptions[i].FlightSegments[0].DepartureAirportLocationCode,
                    cityNameEn: results.OriginDestinationOptions[i].FlightSegments[0].DepartureAirportLocationCode,
                    cityNameFa: results.OriginDestinationOptions[i].FlightSegments[0].DepartureAirportLocationCode,
                    countryCode: 'XX'
                };
            }
            
            if (!destinationObj) {
                destinationObj = {
                    airportCode: results.OriginDestinationOptions[i].FlightSegments[results.OriginDestinationOptions[i].FlightSegments.length - 1].ArrivalAirportLocationCode,
                    cityNameEn: results.OriginDestinationOptions[i].FlightSegments[results.OriginDestinationOptions[i].FlightSegments.length - 1].ArrivalAirportLocationCode,
                    cityNameFa: results.OriginDestinationOptions[i].FlightSegments[results.OriginDestinationOptions[i].FlightSegments.length - 1].ArrivalAirportLocationCode,
                    countryCode: 'XX'
                };
            }
            
            let departureDate = moment(results.OriginDestinationOptions[i].FlightSegments[0].DepartureDateTime, 'DD-MM-YYYYTHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss');
            let arrivalDate = moment(results.OriginDestinationOptions[i].FlightSegments[results.OriginDestinationOptions[i].FlightSegments.length - 1].ArrivalDateTime, 'DD-MM-YYYYTHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss');
            
            let ArrivalDateJ = '';
            try {
                ArrivalDateJ = dateFormat.getDayName(momentJalaali(arrivalDate).format('ddd')) + ' ' + momentJalaali(arrivalDate).format('jD ') + dateFormat.getPersianMonth(momentJalaali(arrivalDate).format('jM'));
            } catch (error) {
                // console.log error and continue
            }
            
            let JourneyDurationPerMinute = 0;
            for (let j = 0; j < results.OriginDestinationOptions[i].FlightSegments.length; j++) {
                let conTime = 0;
                if (j < results.OriginDestinationOptions[i].FlightSegments.length - 1) {
                    const datetime1 = moment(results.OriginDestinationOptions[i].FlightSegments[j].ArrivalDateTime);
                    const datetime2 = moment(results.OriginDestinationOptions[i].FlightSegments[j + 1].DepartureDateTime);
                    
                    // Calculate the difference in minutes
                    conTime = datetime2.diff(datetime1, 'minutes');
                }
                JourneyDurationPerMinute += results.OriginDestinationOptions[i].FlightSegments[j].JourneyDuration;
                JourneyDurationPerMinute += conTime;
            }
            
            let baggageArray = [];
            for (let k = 0; k < baggageInfo.length; k++) {
                if (k < i + results.OriginDestinationOptions[i].FlightSegments.length) {
                    baggageArray.push(baggageInfo[k]);
                }
            }
            
            output.push({
                JourneyDuration: (Math.floor(JourneyDurationPerMinute / 60) < 10 ? '0' + Math.floor(JourneyDurationPerMinute / 60).toString() : Math.floor(JourneyDurationPerMinute / 60).toString()) + ':' + (Math.floor(JourneyDurationPerMinute % 60) < 10 ? '0' + Math.floor(JourneyDurationPerMinute % 60).toString() : Math.floor(JourneyDurationPerMinute % 60).toString()),
                JourneyDurationPerMinute,
                DepartureDateJ: dateFormat.getDayName(momentJalaali(departureDate.substr(0, 10)).format('ddd')) + ' ' + momentJalaali(departureDate.substr(0, 10)).format('jD ') + dateFormat.getPersianMonth(momentJalaali(departureDate.substr(0, 10)).format('jM')),
                DepartureDateG: moment(departureDate).format('MMMM D'),
                ArrivalDateTime: arrivalDate,
                ArrivalDateG: moment(arrivalDate).format('MMMM D'),
                ArrivalDateJ,
                OriginLocation: results.OriginDestinationOptions[i].FlightSegments[0].DepartureAirportLocationCode,
                DestinationLocation: results.OriginDestinationOptions[i].FlightSegments[results.OriginDestinationOptions[i].FlightSegments.length - 1].ArrivalAirportLocationCode,
                DepartureDateTime: departureDate,
                // eslint-disable-next-line camelcase
                TPA_Extensions: {
                    OriginFa: originObj.cityNameFa ? originObj.cityNameFa : originObj.cityNameEn,
                    DestinationFa: destinationObj.cityNameFa ? destinationObj.cityNameFa :  destinationObj.cityNameEn,
                    Origin: originObj.cityNameEn,
                    Destination: destinationObj.cityNameEn,
                    FlightType: 'system',
                    AgencyCode: null,
                    IsCharter: false,
                    IsForeign: true,
                    IsLock: true,
                    IsCaptcha: false,
                    stop: results.OriginDestinationOptions[i].FlightSegments.length - 1,
                    Note: "",
                    IsNationalIdOptional: 1
                },
                FlightSegment: self.flightSegment(results.OriginDestinationOptions[i].FlightSegments, airportList, airline, baggageArray)
            });
        }

        return output;
    },

    flightSegment(element, airportList, airline, baggageInfo) {
        // Economy, Business, First, Premium
        let output = [];
        for (let i = 0; i < element.length; i++) {
           
            let ConnectionTime = '00:00';
            let ConnectionTimePerMinute = 0;
            if (element.length > i + 1) {
                const datetime1 = moment(element[i].ArrivalDateTime);
                const datetime2 = moment(element[i + 1].DepartureDateTime);
                
                ConnectionTimePerMinute = datetime2.diff(datetime1, 'minutes');
           
            }
            if (ConnectionTimePerMinute > 0) {
                ConnectionTime = (Math.floor(ConnectionTimePerMinute / 60) < 10 ? '0' + Math.floor(ConnectionTimePerMinute / 60).toString() : Math.floor(ConnectionTimePerMinute / 60).toString()) + ':' + (Math.floor(ConnectionTimePerMinute % 60) < 10 ? '0' + Math.floor(ConnectionTimePerMinute % 60).toString() : Math.floor(ConnectionTimePerMinute % 60).toString()).toString();
            }
            
            let BaggageAllowance = {
                UnitOfMeasure: "Kilogram",
                UnitOfMeasureCode: "KG",
                UnitOfMeasureQuantity: null
            };
            
            try {
                if (baggageInfo[i]) {
                    const match = element[i].baggage.toString().toUpperCase().match(/(\d+PC)(\d+KG)/);
                    if (match) {
                        BaggageAllowance = {
                            UnitOfMeasure: "pieces",
                            UnitOfMeasureCode: "PC",
                            UnitOfMeasureQuantity: match[1].match(/\d+/)[0]
                        };
                    } else {
                        const match1 = element[i].baggage.toUpperCase().match(/(\d+PC)/);
                        if (match1) {
                            BaggageAllowance = {
                                UnitOfMeasure: "pieces",
                                UnitOfMeasureCode: "PC",
                                UnitOfMeasureQuantity: match1[0].match(/\d+/)[0]
                            };
                        } else {
                            const match2 = element[i].baggage.toUpperCase().match(/(\d+KG)/);
                            if (match2) {
                                BaggageAllowance = {
                                    UnitOfMeasure: "Kilogram",
                                    UnitOfMeasureCode: "KG",
                                    UnitOfMeasureQuantity: match2[0].match(/\d+/)[0]
                                };
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(4444, error);
            }
           
            let originObj = lodash.find(airportList, { 'airportCode': element[i].DepartureAirportLocationCode });
            let destinationObj = lodash.find(airportList, { 'airportCode': element[i].ArrivalAirportLocationCode });
            
            // Default values if airport info is not found
            if (!originObj) {
                originObj = { 
                    airportCode: element[i].DepartureAirportLocationCode,
                    airportNameEn: element[i].DepartureAirportLocationCode,
                    cityNameEn: element[i].DepartureAirportLocationCode,
                    cityNameFa: element[i].DepartureAirportLocationCode,
                    countryCode: 'XX'
                };
            }
            
            if (!destinationObj) {
                destinationObj = {
                    airportCode: element[i].ArrivalAirportLocationCode,
                    airportNameEn: element[i].ArrivalAirportLocationCode,
                    cityNameEn: element[i].ArrivalAirportLocationCode,
                    cityNameFa: element[i].ArrivalAirportLocationCode,
                    countryCode: 'XX'
                };
            }
            
            let iata = element[i].MarketingAirlineCode;

            let departureDate = moment(element[i].DepartureDateTime, 'DD-MM-YYYYTHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss');
            let arrivalDate = moment(element[i].ArrivalDateTime, 'DD-MM-YYYYTHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss');
            let ArrivalDateJ = '';
            let ArrivalDateG = '';
            try {
                ArrivalDateG = moment(arrivalDate).format('MMMM D');
                ArrivalDateJ = dateFormat.getDayName(momentJalaali(arrivalDate).format('ddd')) + ' ' + momentJalaali(arrivalDate).format('jD ') + dateFormat.getPersianMonth(momentJalaali(arrivalDate).format('jM'));
            } catch (error) {
                // Ignore error
            }
            
            let airlineObj = lodash.find(airline, { iata });
            let airlineObj1 = lodash.find(airline, { iata: element[i].OperatingAirline.Code ? element[i].OperatingAirline.Code : iata });
            
            output.push({
                DepartureDateTime: departureDate,
                ArrivalDateTime: arrivalDate,
                FlightNumber: element[i].FlightNumber,
                ResBookDesigCode: element[i].CabinClassText, 
                JourneyDuration: (Math.floor(element[i].JourneyDuration / 60) < 10 ? '0' + Math.floor(element[i].JourneyDuration / 60).toString() : Math.floor(element[i].JourneyDuration / 60).toString()) + ':' + (Math.floor(element[i].JourneyDuration % 60) < 10 ? '0' + Math.floor(element[i].JourneyDuration % 60).toString() : Math.floor(element[i].JourneyDuration % 60).toString()).toString(),
                JourneyDurationPerMinute: element[i].JourneyDuration,
                ConnectionTime,
                ConnectionTimePerMinute,
                DepartureAirport: {
                    LocationCode: element[i].DepartureAirportLocationCode,
                    AirportName: originObj.airportNameEn,
                    Terminal: element[i].departureTerminal,
                    Gate: null,
                    CodeContext: null
                },
                ArrivalAirport: {
                    LocationCode: element[i].ArrivalAirportLocationCode,
                    AirportName: destinationObj.airportNameEn,
                    Terminal: element[i].ArrivalTerminal,
                    Gate: null,
                    CodeContext: null
                },
                MarketingAirline: {
                    Code: iata,
                    CompanyShortName: airlineObj ? airlineObj.name : iata
                },
                CabinClassCode: element[i].CabinClassText === 'Y' ? 'Economy' : 'Business',
                OperatingAirline: {
                    Code: element[i].OperatingAirline.Code ? element[i].OperatingAirline.Code : iata,
                    FlightNumber: element[i].OperatingAirline.FlightNumber ? element[i].OperatingAirline.FlightNumber : element[i].FlightNumber,
                    CompanyShortName: airlineObj1 ? airlineObj1.name : iata
                },
                // eslint-disable-next-line camelcase
                TPA_Extensions: {
                    OriginFa: originObj.cityNameFa ? originObj.cityNameFa : originObj.cityNameEn,
                    DestinationFa: destinationObj.cityNameFa ? destinationObj.cityNameFa : destinationObj.cityNameEn,
                    Origin: originObj.cityNameEn,
                    Destination: destinationObj.cityNameEn,
                    DepartureDateG: moment(departureDate.substr(0, 10)).format('MMMM D'),
                    DepartureDateJ: dateFormat.getDayName(momentJalaali(departureDate.substr(0, 10)).format('ddd')) + ' ' + momentJalaali(departureDate.substr(0, 10)).format('jD ') + dateFormat.getPersianMonth(momentJalaali(departureDate.substr(0, 10)).format('jM')),
                    ArrivalDateG,
                    ArrivalDateJ,
                    FlightTime: departureDate.substr(11, 5),
                    ArrivalTime: arrivalDate.substr(11, 5),
                    AirlineNameFa: airlineObj ? airlineObj.language : ''
                },
                Comment: '',
                Equipment: {
                    AircraftTailNumber: null,
                    AirEquipType: null,
                    ChangeofGauge: null
                },
                SeatsRemaining: element[i].SeatsRemaining,
                comment: '',
                BookingClassAvail: {
                    ResBookDesigCode: element[i].CabinClassText,
                    ResBookDesigQuantity: null,
                    ResBookDesigStatusCode: null,
                    Meal: null
                },
                MarketingCabin: {
                    Meal: null,
                    FlightLoadInfo: {
                        AuthorizedSeatQty: null,
                        RevenuePaxQty: null
                    },
                    BaggageAllowance
                }
            });
        }

        return output;
    }
};

module.exports = self; 