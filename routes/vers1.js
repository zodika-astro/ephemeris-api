const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../ephemeris/ephemerisCntlr');
const Validator = require('../ephemeris/validateInput');

router.get('/ephemeris', Validator.validate, function (req, res, next) {

    EphemerisCntlr.get(res.locals)
        .then(function (results) {

            res.locals.status = 200;
            res.locals.message = 'Ephemerides returned';

            if (results.warnings) {
                res.locals.warnings = res.locals.warnings.concat(results.warnings);
                delete results.warnings;
            }

            res.locals.results = results;
            next();
        })
        .catch(function (err) {

            if (err.errors) {
                res.locals.errors = res.locals.errors.concat(err.errors);
            }

            if (err.warnings) {
                res.locals.warnings = res.locals.warnings.concat(err.warnings);
                delete err.warnings;
            }

            if (err.results) {
                res.locals.results = err.results;
                delete err.results;
            }

            res.locals.status = err.status || 500;
            res.locals.message = err.message || 'Unspecified Error getting Ephemerides.';

            next(err);
        })
        ;
});

router.get('/planetNames', function (req, res, next) {

    EphemerisCntlr.getPlanetNames()
        .then(function (results) {

            res.locals.status = 200;
            res.locals.message = 'Planet Names returned';

            res.locals.results = results;
            next();
        })
        .catch(function (err) {

            res.locals.errors = err.errors || [];

            res.locals.results = err.results;
            delete err.results;

            res.locals.status = err.status || 500;
            res.locals.message = err.message || 'Unspecified Error getting Ephemerides.';

            next(err);
        })
        ;
})


module.exports = router;