const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

const APPLICATION_KEY = process.env.APPLICATION_KEY;
const API_KEY = process.env.API_KEY;
const MAC = process.env.MAC;

let cachedData = null;
let lastFetch = 0;

async function getData() {
    try {
        const url = `https://api.ambientweather.net/v1/devices/${MAC}?apiKey=${API_KEY}&applicationKey=${APPLICATION_KEY}`;
        const response = await fetch(url);
        const json = await response.json();
        const d = json[0];

        const tempC = ((d.tempf || 0) - 32) * 5 / 9;
        const windKmh = (d.windspeedmph || 0) * 1.60934;
        const gustKmh = (d.windgustmph || 0) * 1.60934;

        cachedData = {
            temp: tempC.toFixed(1),
            feelsLike: (tempC - 2).toFixed(1), // approximate
            humidity: d.humidity || 0,
            pressure: d.baromrelin ? d.baromrelin.toFixed(1) : 0,
            wind: windKmh.toFixed(1),
            gust: gustKmh.toFixed(1),
            winddir: d.winddir || 0,
            rainTotal: (d.dailyrainin || 0) * 25.4,
            rainRate: d.rainRate || 0,
            time: new Date().toLocaleTimeString()
        };
        lastFetch = Date.now();
        return cachedData;
    } catch (e) {
        console.error(e);
        return { error: "No data" };
    }
}

app.get("/api/weather", async (req, res) => {
    if (Date.now() - lastFetch < 30000) {
        return res.json(cachedData || { error: "No data" });
    }
    res.json(await getData());
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
