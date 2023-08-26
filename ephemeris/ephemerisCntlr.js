const EphemerisSvc = require('./ephemerisSvc');
const Utils = require('../common/utils');


const EphemerisCntlr = (function () {

    return {
        get,
        getPlanetNames
    };

    function get(req, res, next) {

        let models = res.locals.models;
        let planets = res.locals.planets;
        let startDate = res.locals.startDate;
        let endDate = res.locals.endDate;
        let count = res.locals.count;
        let step = res.locals.step;
        let errors = [];
        let warnings = [];
        let results = { ephemerisQuery: {}, ephemerides: {} };

        results.ephemerisQuery.models = models;
        results.ephemerisQuery.planets = planets;
        results.ephemerisQuery.startDate = startDate;
        results.ephemerisQuery.endDate = endDate;
        results.ephemerisQuery.count = count;
        results.ephemerisQuery.step = step;

        models.forEach(model => {

            results.ephemerides[model] = {};

            planets.forEach(planet => {

                let options = { model, count, step };

                let tmp = EphemerisSvc.getEphemeridesForPlanet(planet, startDate, endDate, options);

                if (tmp.error) {
                    errors.push({ planet, model: models[j], error: tmp.error });

                } else {

                    results.ephemerides[model][planet] = tmp.ephemerides;
                }
            });

        });

        res.locals.results = results;

        if (warnings.length) {
            res.locals.warnings = warnings;
        }

        if (errors.length) {
            res.locals.errors = errors;

            let { status, message } = Utils.evaluateError(errors[0]);
            next({ status, message });
        }

        res.locals.status = 200;
        res.locals.message = 'Ephemerides returned';
        next();
    }

    function getPlanetNames(req, res, next) {

        let planetNames = {};

        EphemerisSvc.getPlanetNames().forEach((planet, idx) => {
            // filter out those planets that contain a '_' in their names
            // any filtering is possible here
            if (!planet.includes('_')) {
                planetNames[idx] = planet;
            }
        });

        res.locals.results = planetNames;
        res.locals.status = 200;
        res.locals.message = 'Planet Names returned';
        next();
    }

}());


module.exports = EphemerisCntlr;
