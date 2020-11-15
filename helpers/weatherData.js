const fetch = require("node-fetch");

const weatherData = async (lat, lng) => {
  const response = await fetch(
    `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.openWeatherApiKey}`
  )
    .then((res) => res.json()) // expecting a json response
    .then((data) => data.weather);

    return response[0];
};

module.exports = weatherData;
