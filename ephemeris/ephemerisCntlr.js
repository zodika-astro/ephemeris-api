const EphemerisSvc = require('./ephemerisSvc');
const Utils = require('../common/utils');


const EphemerisCntlr = (function () {

    return {
        get,
        getPlanetNames
    };

    function get(inputs) {

        let models = inputs.models;
        let planets = inputs.planets;
        let startDate = inputs.startDate;
        let endDate = inputs.endDate;
        let count = inputs.count;
        let step = inputs.step;
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


        if (warnings.length) {
            results.warnings = warnings;
        }

        if (errors.length) {
            let { status, message } = Utils.evaluateError(errors[0]);

            return Promise.reject({ status, message, errors, results });
        }

        return Promise.resolve(results);
    }

    function getPlanetNames() {

        let planetNames = {};

        EphemerisSvc.getPlanetNames().forEach((planet, idx) => {
            // filter out those planets that contain a '_' in their names
            // any filtering is possible here
            if (!planet.includes('_')) {
                planetNames[idx] = planet;
            }
        });

        return Promise.resolve(planetNames);
    }

}());


module.exports = EphemerisCntlr;
