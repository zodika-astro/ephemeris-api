const Utils = require('../common/utils');
const swisseph = require('swisseph');


// path to ephemeris data
swisseph.swe_set_ephe_path('./ephe');

const SE_BASE_FLAG = swisseph.SEFLG_SPEED | swisseph.SEFLG_SWIEPH | swisseph.SE_GREG_CAL;

const planetNames = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
    'mean_node',
    'true_node',
    'mean_apog',
    'oscu_apog',
    'earth'
];


const EphemerisSvc = (function () {

    return {
        getEphemeridesForPlanet,
        getPlanetNames,
        getJulianDate
    }

    function getEphemeridesForPlanet(planet, startDate, endDate, options) {

        let results = {};

        options = options || {};
        let count = options.count || 1;
        let step = options.step || 1;
        let model = options.model || 'geo';

        if (isNaN(parseInt(planet))) {
            planet = 0;
        }
        startDate = startDate || new Date().toISOString();
        endDate = endDate || Utils.addDays(startDate, (count * (1 / step) - 1));

        let flgs = SE_BASE_FLAG;

        // turn date strings into Date objects
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        if (endDate < startDate) {
            endDate = startDate;
            results.error = { message: 'EndDate prior to StartDate. EndDate ignored.' };
        }

        let julianStartDate = getJulianDate(startDate);
        let julianEndDate = getJulianDate(endDate);

        // recompute count based on julian dates
        let julianDiff = julianEndDate - julianStartDate;
        count = Math.round(julianDiff / step) + step;

        results.ephemerisQuery = { planet, model, startDate, endDate, julianStartDate, julianEndDate, count, step };
        results.ephemerides = [];

        if (model === 'helio') {
            flgs = flgs | swisseph.SEFLG_HELCTR;
        } else {
            flgs = flgs & ~swisseph.SEFLG_HELCTR;
        }


        let list = [];

        for (let i = 0; i < count; i++) {

            let jDate = julianStartDate + (i * step);
            let tDateObj = swisseph.swe_jdut1_to_utc(jDate, flgs);
            let tDate = new Date(Date.UTC(tDateObj.year, (tDateObj.month - 1), tDateObj.day, tDateObj.hour, tDateObj.minute, tDateObj.second));

            swisseph.swe_calc_ut(jDate, parseInt(planet), flgs, function (body) {

                if (!body.error) {

                    body.julianDate = jDate;
                    body.dt = tDate;
                    body.planet = planet;
                    body.model = model;
                } else {
                    results.error = body.error;
                }
                list.push(body);
            });
        }

        results.ephemerides = list;

        return results;
    }

    function getPlanetNames() {

        return planetNames;
    }

    function getJulianDate(dtStr) {

        let dt = new Date(dtStr);
        let hr = 0;

        if (!isNaN(dt)) {

            let julianDate2 = swisseph.swe_utc_to_jd(dt.getUTCFullYear(), (dt.getUTCMonth() + 1), dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes(), dt.getUTCSeconds(), swisseph.SE_GREG_CAL);

            return julianDate2.julianDayUT;
        }

        return undefined;
    }

}());

module.exports = EphemerisSvc;