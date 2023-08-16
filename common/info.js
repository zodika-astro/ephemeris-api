const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json'));


const info = (function () {

    return {
        info,
        health
    };


    function info() {

        return {
            author: pkg.author.name, api: pkg.name, version: pkg.version, status: 'OK',
            'endpoints': ['/api/v1/ephemeris', '/api/v1/planetNames']
        }
    }

    function health() {

        return 'OK'
    }

}());

module.exports = info;