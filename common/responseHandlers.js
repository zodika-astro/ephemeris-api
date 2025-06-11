/**
 * Created by lhovind on 3/18/16.
 */
'use strict';

var responseHandlers = (function () {

    return {
        handleResponse: handleResponse,
        handleErrorResponse: handleErrorResponse
    };

    function buildResponseEnvelope(res, req) {
        var response = {
            outcome: {}
        };

        if (req && req.query && Object.keys(req.query).length) {
            response.queryParams = {};
            Object.keys(req.query).forEach(key => {
                response.queryParams[key] = req.query[key];
            })
        }

        response.outcome.statusCode = res.locals.status;
        // TODO - if there is no specified message, then lookup message form table of std responses
        response.outcome.message = res.locals.message;

        if (res.locals.errors && res.locals.errors.length > 0) {
            response.outcome.errors = res.locals.errors;
        }
        if (res.locals.warnings && res.locals.warnings.length > 0) {
            response.outcome.warnings = res.locals.warnings;
        }
        if (res.locals.info && res.locals.info.length > 0) {
            response.outcome.info = res.locals.info;
        }

        if (res.locals.results) {
            
            response.content = res.locals.results;
        }

        return response;
    }

    function handleResponse(req, res, next) {

        // set response status
        res.status(res.locals.status || 404);
        res.locals.message = res.locals.message || 'No local message found.';

        // handle redirect
        if (res.locals.redirect_url) {

            res.redirect(res.locals.status, res.locals.redirect_url);

        } else {
            if (res.locals.status) {
                res.json(buildResponseEnvelope(res, req));
            } else {
                res.send('404 - Not Found');
            }
        }
    }

    function handleErrorResponse(err, req, res, next) {
        console.log('ERROR - ', err);
        console.log('  errors:', res.locals.errors);
        console.log('  warnings:', res.locals.warnings);

        // set status
        res.locals.status = res.locals.status || err.status || 500;
        res.status(res.locals.status);

        res.locals.message = res.locals.message || err.message || 'Express.App catching: Internal Server error';

        if (res.locals.errors && res.locals.errors.length == 0) {
            res.locals.errors.push(err);    
        } else {
         res.locals.errors = (res.locals.errors || []).concat(err && err.errors ? err.errors : [err]);
        }

        // build envelope
        res.json(buildResponseEnvelope(res, req));
    }

}());

module.exports = responseHandlers;
