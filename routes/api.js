console.log('✅ Entered ephemeris route');
const express = require('express');
const router = express.Router();
const InfoCntlr = require('../common/info');

router.get('/info', function (req, res, next) {
    
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API Info returned';
    res.locals.results = InfoCntlr.info();
    next();
});

router.get('/health', function (req, res, next) {
    
    res.locals.status = 200;
    res.locals.message = 'Ephemeris API Health returned';
    res.locals.results = InfoCntlr.health();
    next();
});

router.use('/v1', require('./vers1.js'));

module.exports = router;
