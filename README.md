# Ephemeris API

The ephemeris-api is a simple Node ExpressJS application that provides an interface to the [Swiss Ephemeris](https://www.astro.com/swisseph/) ephemeris.

## Endpoints

It provides two main endpoints:
```
/api/v1/ephemeris
/api/v1/planetNames
```
## Usage

### /api/v1/ephemeris

Can be called without any query parameters and it will return the current day's data for the Moon. But you can specify several optional parameters.

#### Optional Parameters:

<table>
<thead>
<tr><th>Parameter</th><th>Values</th></tr>
</thead>
<tbody>
<tr><td>models</td><td>Geo, Helio</td></tr>
<tr><td>planets</td><td>Integers from 0 to 14</td></tr>
<tr><td>startDate</td><td>Date string, i.e. "2023-06-10"</td></tr>
<tr><td>endDate</td><td>Like startDate, but must be after startDate</td></tr>
<tr><td>count</td><td>Number of days from startDate</td></tr>
<tbody>
</table>

### /api/v1/planetNames

This returns an object of key/value pairs, where the key is the planet number and the value is the planet's name.

---

## Notes

This project was built to support a demonstration frontend. As such, it does not provide full access to all the wonderful features of the Swiss Ephemeris. This can easily be extended. The code follows the basic middleware pattern of ExpressJS and you can add routes with controllers to expose new features.

<br>
<br>

## Project Setup

```sh
npm install
```
You may need Python and C/C++ for this step. YMMV


### Start the API

```sh
npm start
```
the API uses Port 9010 by default and you can check it's status by calling http://localhost:9010/api/info