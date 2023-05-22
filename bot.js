const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const stationsData = require("./stations.json");

const app = express();
const bot = new TelegramBot("5593931488:AAGf6E2jATOXNi-0Me6o3-7eIGRtABTN5pg");

app.use(bodyParser.json());

bot
  .setWebHook("https://metro-bot.vercel.app/webhook")
  .then(() => {
    console.log("Webhook has been set successfully");
  })
  .catch((error) => {
    console.error("Error setting webhook:", error);
  });

app.get("/", (req, res) => {
  res.sendStatus(200);
  res.json({ message: "Service is Run!" });
});
app.get("/ping", (req, res) => {
  res.send("pong 🏓");
});

app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

console.log("start ...");
bot.onText(/\/start/, (msg) => {
  console.log("on start ...");

  const chatId = msg.chat.id;
  const stationList = getStationList();

  bot.sendMessage(chatId, "به ربات مترو خوش آمدید!");
  bot.sendMessage(chatId, "لطفاً یک ایستگاه را انتخاب کنید:", {
    reply_markup: {
      keyboard: stationList,
      one_time_keyboard: true,
    },
  });
});

bot.on("message", (msg) => {
  console.log("on message ...");

  const chatId = msg.chat.id;
  const selectedStation = msg.text;

  const station = findStationByName(selectedStation);
  if (station) {
    const trainArrivalTime = calculateTrainArrivalTime(station);
    bot.sendMessage(chatId, `شما ایستگاه ${station.name} را انتخاب کردید.`);
    bot.sendMessage(chatId, `زمان رسیدن قطار: ${trainArrivalTime}`);
  } else {
    bot.sendMessage(
      chatId,
      "ایستگاه انتخاب شده یافت نشد. لطفاً دوباره تلاش کنید."
    );
  }
});

bot.onText(/\/nearest/, (msg) => {
  console.log("on nearest ...");
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "لطفاً موقعیت جغرافیایی خود را ارسال کنید.", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "ارسال موقعیت جغرافیایی",
            request_location: true,
          },
        ],
      ],
      one_time_keyboard: true,
    },
  });
});

bot.on("location", (msg) => {
  console.log("on location ...");
  const chatId = msg.chat.id;
  const latitude = msg.location.latitude;
  const longitude = msg.location.longitude;

  const nearestStation = findNearestStation(latitude, longitude);
  const trainArrivalTime = calculateTrainArrivalTime(nearestStation);

  bot.sendMessage(chatId, `نزدیک‌ترین ایستگاه: ${nearestStation.name}`);
  bot.sendMessage(chatId, `زمان رسیدن قطار: ${trainArrivalTime}`);
});

function calculateTrainArrivalTime(station) {
  // Get the current time
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Find the next train arrival time
  let nextArrivalTime;
  for (let i = 0; i < station.arrivalTimes.length; i++) {
    const arrivalTime = station.arrivalTimes[i].split(":");
    const hour = parseInt(arrivalTime[0]);
    const minute = parseInt(arrivalTime[1]);

    if (
      hour > currentHour ||
      (hour === currentHour && minute >= currentMinute)
    ) {
      nextArrivalTime = station.arrivalTimes[i];
      break;
    }
  }

  if(!nextArrivalTime)
  {
    nextArrivalTime = station.arrivalTimes[0];
  }

  return nextArrivalTime;
}

function getStationList() {
  const stationList = stationsData.stations.map((station) => [station.name]);
  return stationList;
}

function findStationByName(stationName) {
  const station = stationsData.stations.find(
    (station) => station.name === stationName
  );
  return station;
}

function findNearestStation(latitude, longitude) {
  let nearestStation;
  let minDistance = Infinity;

  for (const station of stationsData.stations) {
    const stationLatitude = station.latitude;
    const stationLongitude = station.longitude;

    const distance = calculateDistance(
      latitude,
      longitude,
      stationLatitude,
      stationLongitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }

  return nearestStation;
}

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Server started on port " + port);
});

module.exports = app;
