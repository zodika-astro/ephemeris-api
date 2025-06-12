'use strict';

module.exports = {
  compute: function (query) {
    const result = {
      ephemerisQuery: query,
      ephemerides: {
        geo: {
          1: [
            {
              longitude: 273.45,
              latitude: -4.91,
              planet: 1,
              model: 'geo'
            }
          ]
        }
      }
    };

    return Promise.resolve(result);
  }
};

