const utils = (function () {
    return {
        addDays,
        evaluateError
    };
    function addDays(date, days) {
        var tmpDt = new Date(date);
        tmpDt.setDate(tmpDt.getDate() + days);
        return tmpDt;
    }

    function evaluateError(err) {
        let message = '';
        let status = undefined;
        if (err instanceof Error) {
            message = err.message;
        }
        if (err.error) {
            message = err.error.message || err.error || 'Specific message unavailable.';
            status = err.error.status;
        }
        if (typeof err == 'string') {
            message = err;
        }

        status = status || 400;
        return { status, message }
    }
}());
module.exports = utils;
