const TelegramBot = require('node-telegram-bot-api');
const stationsData = require('./stations.json');

const bot = new TelegramBot('5593931488:AAGf6E2jATOXNi-0Me6o3-7eIGRtABTN5pg', { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const stationList = getStationList();

  bot.sendMessage(chatId, 'به ربات مترو خوش آمدید!');
  bot.sendMessage(chatId, 'لطفاً یک ایستگاه را انتخاب کنید:', {
    reply_markup: {
      keyboard: stationList,
      one_time_keyboard: true,
    },
  });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const selectedStation = msg.text;

  const station = findStationByName(selectedStation);
  if (station) {
    const trainArrivalTime = calculateTrainArrivalTime(station);
    bot.sendMessage(chatId, `شما ایستگاه ${station.name} را انتخاب کردید.`);
    bot.sendMessage(chatId, `زمان رسیدن قطار: ${trainArrivalTime}`);
  } else {
    bot.sendMessage(chatId, 'ایستگاه انتخاب شده یافت نشد. لطفاً دوباره تلاش کنید.');
  }
});

bot.onText(/\/nearest/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'لطفاً موقعیت جغرافیایی خود را ارسال کنید.', {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'ارسال موقعیت جغرافیایی',
            request_location: true,
          },
        ],
      ],
      one_time_keyboard: true,
    },
  });
});

bot.on('location', (msg) => {
  const chatId = msg.chat.id;
  const latitude = msg.location.latitude;
  const longitude = msg.location.longitude;

  const nearestStation = findNearestStation(latitude, longitude);
  const trainArrivalTime = calculateTrainArrivalTime(nearestStation);

  bot.sendMessage(chatId, `نزدیک‌ترین ایستگاه: ${nearestStation.name}`);
  bot.sendMessage(chatId, `زمان رسیدن قطار: ${trainArrivalTime}`);
});

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
