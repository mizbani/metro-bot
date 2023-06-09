process.env.TZ = "Asia/Tehran";

const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const stationsData = require("./stations.json");

const bot = new TelegramBot("5593931488:AAGf6E2jATOXNi-0Me6o3-7eIGRtABTN5pg");
bot.setWebHook(`https://metro-bot.vercel.app/webhook`);

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 8090;
// Start Express Server
app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});

app.get("/", (req, res) => {
  res.sendStatus(200);
  res.json({ message: "Service is Run!" });
});

app.get("/ping", (req, res) => {
  res.send("pong 🏓");
});

app.get("/run", (req, res) => {
  bot.setWebHook(`https://metro-bot.vercel.app/webhook`);
  res.send("pong 🏓");
});

app.post("/webhook", (req, res) => {
  console.log("on webhook", req.body);
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

console.log("start ...", 700 % 60);
bot.onText(/\/start/, (msg) => {
  console.log("on start ...");

  const chatId = msg.chat.id;
  const stationList = getStationList();

  var keyboard = [[]];

  for (var st = 0; st < stationList.length; st++) {
    var last = keyboard[keyboard.length - 1];
    if (last == undefined) last = [];
    if (last.length >= 3) {
      last = [];
      keyboard.push(last);
    }
    last.unshift(stationList[st]);
  }

  bot.sendMessage(chatId, "به ربات مترو خوش آمدید!");
  bot.sendMessage(chatId, "لطفاً یک ایستگاه را انتخاب کنید:", {
    reply_markup: {
      keyboard: keyboard,
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
});

bot.on("message", (msg) => {
  console.log("on message ...", msg);

  const chatId = msg.chat.id;
  const selectedStation = msg.text;

  const station = findStationByName(selectedStation);
  if (station) {
    const trainArrivalTime = calculateTrainArrivalTime(station);

    bot.sendMessage(
      chatId,
      `ایستگاه : ${station.name}\n` +
        `زمان رسیدن قطار: ${trainArrivalTime[0]} \n ${trainArrivalTime[1]} دیگر`,
      {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              {
                text: "زمان بعدی",
                callback_data: "next-time",
              },
            ],
          ],
        }),
      }
    );
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
  bot.sendMessage(
    chatId,
    `زمان رسیدن قطار: ${trainArrivalTime[0]} \n ${trainArrivalTime[0]} دیگر`
  );
});

bot.on("callback_query", (callbackQuery) => {
  console.log("callbackQuery", callbackQuery);
  const msg = callbackQuery.message;
  bot.answerCallbackQuery(callbackQuery.id);
  bot.sendMessage(msg.chat.id, "You clicked!");
});

function calculateTrainArrivalTime(station) {
  // Get the current time
  var currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Find the next train arrival time
  let nextArrivalTime;
  let nextArrivalDiff;
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

  if (!nextArrivalTime) {
    nextArrivalTime = station.arrivalTimes[0];
    currentTime = new Date();
    currentTime.setDate(currentTime.getDate() + 1);
  }

  const firstTrainTime = new Date(
    currentTime.toDateString() + " " + nextArrivalTime
  );
  const timeDiff = Math.abs(firstTrainTime.getTime() - currentTime.getTime());
  const minutesDiff = Math.ceil(timeDiff / (1000 * 60));

  if (minutesDiff < 60) {
    nextArrivalDiff = minutesDiff + " دقیقه";
  } else {
    nextArrivalDiff =
      Math.floor(minutesDiff / 60) + " ساعت و " + (minutesDiff % 60) + " دقیقه";
  }

  return [nextArrivalTime, nextArrivalDiff];
}

function getStationList() {
  const stationList = stationsData.stations.map((station) => station.name);
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

module.exports = app;
