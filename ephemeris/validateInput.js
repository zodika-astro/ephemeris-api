const Utils = require('../common/utils');


const ValidateInput = (function () {

    return {validate};

    function validate(req, res, next) {

        let models = req.query.models || ['geo'];
        let planets = req.query.planets || [1];
        let startDate = req.query.startDate || new Date().toISOString();
        let count = +req.query.count;
        let endDate = req.query.endDate;
        let step = 1;

        res.locals.errors = [];
        res.locals.warnings = [];


        // ****
        // **** begin input validation
        // ****

        // validate models
        if (!Array.isArray(models)) {
            models = models.split(',');
        }
        for (let i = (models.length - 1); i >= 0; i--) {
            if (!['geo', 'helio'].includes(models[i])) {
                res.locals.warnings.push('Model \'' + models[i] + '\' is not a valid astronomical model and will be ignored.');
                models.splice(i, 1);
            }
        }
        if (models.length < 1) {
            res.locals.errors.push('No valid models specified in query.');
        }

        // validate planets
        if (!Array.isArray(planets)) {
            planets = planets.split(',');
        }
        for (let i = (planets.length - 1); i >= 0; i--) {
            let tmpNum = +planets[i];
            // check that the number is a valid integer
            if (isNaN(tmpNum) || !Number.isInteger(tmpNum)) {
                res.locals.warnings.push('Planet \'' + planets[i] + '\' is not an integer and will be ignored.');
                planets.splice(i, 1);
                continue;
            }
            // check that the number is within range 0-14
            if ((tmpNum < 0) || (tmpNum > 14)) {
                res.locals.warnings.push('Planet \'' + planets[i] + '\' is not within the range [0-14] and will be ignored.');
                planets.splice(i, 1);
            }
        }
        if (planets.length < 1) {
            res.locals.errors.push('No valid planets specified in query.');
        }

        // valid start date
        try {
            startDate = new Date(startDate).toISOString();

        } catch (err) {

            res.locals.errors.push(err.message + ': startDate = ' + startDate);
        }

        // validate count
        if (isNaN(count) || !Number.isInteger(count) || count < 1) {
            if (req.query.count) {
                res.locals.warnings.push('Requested \'count\' is not a positive integer and will default to 1.');
            }
            count = 1;
        }

        // validate end date
        // if endDate was omitted set to startDate + count
        endDate = endDate || Utils.addDays(startDate, (count * (1 / step) - 1));
        try {
            endDate = new Date(endDate).toISOString();

        } catch (err) {
            res.locals.errors.push(err.message + ': endDate = ' + endDate);
        }

        // validate endDate is after startDate and date range is less than 731 days
        let startTime = new Date(startDate).getTime();
        let endTime = new Date(endDate).getTime();
        if (endDate < startDate) {
            res.locals.errors.push('endDate is prior to startDate. Computation is not possible.');
        } else {
            count = (endTime - startTime) / 86400000; // 24 * 60 * 60 * 1000 = milliseconds in a day
            count = count + 1; // endTime - startTime is a 0 indexed time, and count is a 1 indexed time
            if (count > 730) {
                res.locals.warnings.push('Date range is greater than 730, truncating request');
                count = 730;
                endDate = Utils.addDays(startDate, (count - 1)).toISOString();
            }
        }

        // ****
        // **** end validation
        // ****

        // short circuit on res.locals.errors
        if (res.locals.errors.length) {
            next({ status: 400, message: 'See \'errors\' property for details.' }); // send status = 400 because of Bad Request
        }

        // copy inputs for controller
        res.locals.models = models;
        res.locals.planets = planets;
        res.locals.startDate = startDate;
        res.locals.count = count;
        res.locals.endDate = endDate;
        res.locals.step = step;

        next();
    }

}());

module.exports = ValidateInput;