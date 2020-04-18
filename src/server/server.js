// Express to run server and routes
const express = require('express');

// Start up an instance of app
const app = express();

/* Dependencies */
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request-promise');
const { check, validationResult } = require('express-validator');


/* Middleware*/

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cors for cross origin allowance
app.use(cors());

// Initialize the main project folder
app.use(express.static('dist'));

// Spin up the server
const port = 3000;
app.listen(port, listening);

// Callback to debug
function listening() {
    console.log(`running on localhost: ${port}`);
}

// Post Route - Travel data form / Validation
app.post('/travel',
    [
        check('destination').not().isEmpty(),
        check('datefrom').not().isEmpty(),
        check('country').not().isEmpty()
    ],
    (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            req.body.status = "ERROR";
            req.body.error = "";

            console.log('___ERRORS___');

            errors.array().forEach(function (obj) {

                if (req.body.error !== '') {
                    req.body.error += ', ';
                }

                switch (obj.param) {
                    case 'destination':
                        req.body.error += 'Destination is empty';
                        break;
                    case 'datefrom':
                        req.body.error += 'Departing date is empty';
                        break;
                    case 'country':
                        req.body.error += 'Country is empty';
                        break;
                }

            });

        } else {
            req.body.status = "SUCCESS";
            req.body.error = "";
        }

        processTravelData(req, res);

    });

// Process travel data - Validate Input, call APIs, return weather data, image link, errors
async function processTravelData(req, res) {

    // variables
    let longitude;
    let latitude;
    let weatherSummary;
    let weatherIcon;
    let imageLink;
    let geonamesSuccess = false;
    let weatherBitSuccess = false;

    // calculate countdown
    let presentDate = new Date();
    let travelDate = new Date(req.body.datefrom);
    let countDownDays = Math.floor((travelDate.getTime() - presentDate.getTime()) / (1000 * 3600 * 24)) + 1;

    // get location from Geonames API and fetch first entry
    // Username in process.env.GEONAMES_USERNAME
    let geoNamesUrl = 'http://api.geonames.org/postalCodeSearchJSON?placename_startsWith=' +
        req.body.destination +
        '&countryCode=' +
        req.body.country +
        '&maxRows=1&username=' +
        process.env.GEONAMES_USERNAME;

    await request(geoNamesUrl, function (err, response, body) {
        if (err) {
            req.body.error = "Error in call to Geonames API";
        } else {
            let geonamesData = JSON.parse(body);
            if (geonamesData.postalCodes[0] == undefined) {
                req.body.error = "Location of destination not found, try again with different destination/country";
            } else {
                longitude = geonamesData.postalCodes[0].lng;
                latitude = geonamesData.postalCodes[0].lat;
                geonamesSuccess = true;
            }
        }
    });

    let weatherBitUrl = 'https://api.weatherbit.io/v2.0/current?lat=' + latitude + '&lon=' + longitude + '&key=' + process.env.WEATHER_BIT_API_KEY;

    if (geonamesSuccess) {
        console.log("::: Now get the Dark Sky Data :::", weatherBitUrl);

        await request(weatherBitUrl, function (err, response, body) {
            if (err) {
                req.body.error = "Error in call to Dark Sky API";
            } else {
                let weatherBitData = JSON.parse(body);
                if (weatherBitData.data[0] == undefined) {
                    req.body.error = "Weather data point daily not found - API error";
                }
                else {
                    weatherSummary = weatherBitData.data[0].weather.description;
                    weatherIcon = weatherBitData.data[0].weather.icon;
                    weatherBitSuccess = true;
                }
            }
        });
    }

    // get image link from Pixabay API
    let pixabayUrl = 'https://pixabay.com/api/?key=' +
        process.env.PIXABAY_API_KEY +
        '&q=' +
        req.body.destination +
        ' &image_type=photo';

    if (weatherBitSuccess) {
        console.log("::: Now get the Pixabay image :::", pixabayUrl);

        await request(pixabayUrl, function (err, response, body) {
            if (err) {
                req.body.error = "Error in call to Pixabay API";
            } else {
                let pixabayData = JSON.parse(body);
                if (pixabayData.hits[0] == undefined) {
                    req.body.error = "No Image found";
                } else {
                    imageLink = pixabayData.hits[0].webformatURL;
                }
            }
        });
    }

    // set error status
    if (req.body.error !== "") {
        req.body.status = 'ERROR';
    }

    let travelData = {
        destination: req.body.destination,
        country: req.body.country,
        datefrom: req.body.datefrom,
        daysleft: "Your Trip to " + req.body.destination + " starts in " + countDownDays + " days",
        summary: weatherSummary,
        icon: weatherIcon,
        imagelink: imageLink,
        status: req.body.status,
        error: req.body.error
    }

    console.log('::: POST Data :::');
    console.log(travelData);

    return res.send(travelData);

}









