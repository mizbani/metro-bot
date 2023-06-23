var stations = [
  "قدس",
  "بهارستان",
  "گلستان",
  "شهید مفتح",
  "شهید علیخانی",
  "جابر",
  "کاوه",
  "شهید چمران",
  "شهید باهنر",
  "شهدا",
  "تختی",
  "امام حسین",
  "انقلاب",
  "سی و سه پل",
  "دکتر شریعتی",
  "آزادی",
  "دانشگاه",
  "کارگر",
  "کوی امام",
  "دفاع مقدس",
];

var steps = [20, 22];
var lags = [];
lags[15 - 1] = 1;
var defaultstep = 11;
var defaultlag = 2;
var result = [];

var firstlag = 0;

for (var index = 0; index < stations.length; index++) {
  var array = [];

  var lag = firstlag;
  console.log(lags[index]);
  firstlag += lags[index] ?? defaultlag;

  var first = [5, 55 + lag];
  if (first[1] >= 60) {
    first[1] -= 60;
    first[0]++;
  }
  array.push(first);

  for (var i = 0; i < 81; i++) {
    var last = [...array[array.length - 1]];

    //last[1] += lag;
    last[1] += steps[i] ?? defaultstep;

    if (last[1] >= 60) {
      last[1] -= 60;
      last[0]++;
    }
    array.push(last);
  }
  var times = array.map(
    (x) =>
      x[0].toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ":" +
      x[1].toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })
  );

  result.push({
    index,
    latitude: 0,
    longitude: 0,
    name: stations[index],
    arrivalTimes: times,
  });
}
//console.log(result);

const fs = require("fs");
fs.writeFileSync("stations.json", JSON.stringify(result, null, 4));
