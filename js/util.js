/**
 * Returns a value between two others at a point on a linear scale
 * @param {number} start Start point / input value
 * @param {number} end End point / target value
 * @param {number} amt 0 = start. 1 = end.
 * @returns A value at `amt` * 100% on the invertal.
 */
function lerp(start, end, amt) {
  return start * (1 - amt) + amt * end;
}

/**
 * Uses cosine interpolation to scale one value to another
 * @param {*} y1 Input value
 * @param {*} y2 Target value
 * @param {*} amt Strength of the interpolation
 * @returns Scaled y1
 */
function cosineInterpolate(y1, y2, amt) {
  let amt2 = (1 - Math.cos(amt * Math.PI)) / 2;
  return y1 * (1 - amt2) + y2 * amt2;
}

/**
 * Limits the given value within [min, max]. This is equivalent to the complex use of Math.min(Math.max(min, value), max)
 * @param {number} value Original value
 * @param {number} min Minimum of the returned value.
 * @param {number} max Maximum of the returned value.
 * @returns Original value clamped within the given range.
 */
function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

/**
 * Gets a random number within range
 * @param {number} min Minimum
 * @param {number} max Maximum
 * @returns random value on interval [min, max]
 */
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * @returns a random 2D unit vector in the form of {x, y}
 */
function getRandomUnitVector() {
  let x = getRandom(-1, 1);
  let y = getRandom(-1, 1);
  let length = Math.sqrt(x * x + y * y);
  if (length == 0) {
    // very unlikely
    x = 1; // point right
    y = 0;
    length = 1;
  } else {
    x /= length;
    y /= length;
  }

  return { x: x, y: y };
}

/**
 * Maps the value using the map reference [Omin,Omax] =>[Mmin,Mmax]
 * @param {number} value
 * @param {number} originalMin
 * @param {number} originalMax
 * @param {number} mappedMin
 * @param {number} mappedMax
 * @returns Mapped value
 */
function mapValue(value, originalMin, originalMax, mappedMin, mappedMax) {
  // Calculates the ratio of the value in the original range
  let ratio = (value - originalMin) / (originalMax - originalMin);

  // Maps the value to the new range based on the ratio
  return mappedMin + ratio * (mappedMax - mappedMin);
}

/**
 * Changes the first character to its upper case.
 * @param {string} string input string
 * @returns modified string
 */
function capitalizeFirstChar(string) {
  return string.charAt(0).toUpperCase() + string.substring(1);
}

/**
 * Trims the trailing zeroes of the string returned by toFixed().
 * @param {number} number Number calling toFixed()
 * @param {number} digits Parameter for toFixed()
 * @returns
 */
function toFixed_trimZeroes(number, digits = 2) {
  return number.toFixed(digits).replace(/\.0+$/, "");
}

/**
 * Uses JSON to hard copy-paste properties of source obj into target obj.
 * @param {*} target Target object (accepts new properties)
 * @param {*} source Source object (provides properties)
 * @returns If the extension is successful.
 */
function extend(target, source) {
  if (target) {
    Object.assign(target, hardCopy(source));
    return true;
  }
  return false;
}

/**
 * Merges two objects into a new one.
 * @param {*} a
 * @param {*} b
 * @returns New object with all a's and b's properties
 */
function merge(a, b) {
  if (!a || !b) {
    return undefined;
  }

  return { ...hardCopy(a), ...hardCopy(b) };
}

/**
 * Returns a hard copy of given object using JSON
 * @param {*} obj
 * @returns Hard copy of obj
 */
function hardCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Gets a time string converted from given time interval
 * @param {*} time time in seconds
 * @returns time string displaying hours, minutes and seconds
 */
function getTimeString(time, cap = 24 * 60 * 60) {
  if (time > cap) {
    time = cap;
  }

  let seconds = Number.parseInt(time);
  let minutes = Number.parseInt(seconds / 60);
  seconds %= 60;
  let hours = Number.parseInt(minutes / 60);
  minutes %= 60;

  return `${hours}h ${minutes}min ${seconds}s`;
}

/**
 * Formats the number with big units and keeps specified demical places
 * @param {number} num Number to be formatted
 * @param {number} digits How many decimal places to keep
 * @param {boolean} useScientificNotation Whether or not to use scientific notation instead of unit
 * @param {boolean} useAbbreviation Whether or not to use the short version of the unit
 */
function formatNumber(
  num,
  digits = 1,
  useScientificNotation = true,
  useAbbreviation = true
) {
  // Note: In JavaScript, a const is a variable that is constant and cannot be reassigned.
  // If we have a large const inside of a function, it will not be recreated every time the function is called.

  // Define the names of the units.
  // https://en.wikipedia.org/wiki/Names_of_large_numbers
  const units = [
    "",
    "K",
    "Million",
    "Billion",
    "Trillion",
    "Quadrillion",
    "Quintillion",
    "Sextillion",
    "Septillion",
    "Octillion",
    "Nonillion",
    "Decillion",
    "Undecillion",
    "Duodecillion",
    "Tredecillion",
    "Quattuordecillion",
    "Quindecillion",
    "Sexdecillion",
    "Septendecillion",
    "Octodecillion",
    "Novemdecillion",
    "Vigintillion",
    "Unvigintillion",
  ];

  // https://crusaders-of-the-lost-idols.fandom.com/wiki/Large_Number_Abbreviations
  const units_abbr = [
    "",
    "K",
    "M",
    "B",
    "t",
    "q",
    "Q",
    "s",
    "S",
    "o",
    "n",
    "d",
    "U",
    "D",
    "T",
    "Qt",
    "Qd",
    "Sd",
    "St",
    "O",
    "N",
    "v",
    "c",
  ];

  // Handle numbers less than 1000.
  if (num < 1000) {
    return toFixed_trimZeroes(num, digits);
  }

  // Handle Infinity
  if (num === Infinity) {
    return "Infinity";
  }

  function scientificNotation(num, digits) {
    let exponent = Math.floor(Math.log10(num));
    let shortNum = toFixed_trimZeroes(num / Math.pow(10, exponent), digits);
    return `${shortNum}e${exponent}`;
  }

  if (useScientificNotation) {
    return scientificNotation(num, digits);
  }

  // Determine the appropriate unit.
  let unitIndex = Math.floor(Math.log10(num) / 3);
  if (unitIndex < units.length) {
    let unit = useAbbreviation ? units_abbr[unitIndex] : units[unitIndex];

    // Divide the number by 1000 raised to the appropriate power and limit its decimal places.
    let shortNum = toFixed_trimZeroes(num / Math.pow(1000, unitIndex), digits);

    // Return the number with the appropriate unit suffix.
    return `${shortNum}${unit.length == 1 ? "" : " "}${unit}`;
  }
  // If no valid unit can be used for this number (too large), uses scientific notation even if it's turned off.
  else {
    return scientificNotation(num, digits);
  }
}

/**
 * Generates random (X, Y) coordinates where X can be within either (-maxX,-minX) or (minX,maxX); Same for Y.
 * @param {} minX
 * @param {*} maxX
 * @param {*} minY
 * @param {*} maxY
 * @returns X,Y coordinates as object literal
 */
function randomCoordinate(minX, maxX, minY, maxY) {
  // Computes X coordinate
  const x = Math.random() * (maxX - minX) + minX;
  const xSign = Math.random() < 0.5 ? -1 : 1;
  const xCoordinate = xSign * x;

  // Computes Y coordinate
  const y = Math.random() * (maxY - minY) + minY;
  const ySign = Math.random() < 0.5 ? -1 : 1;
  const yCoordinate = ySign * y;

  return { x: xCoordinate, y: yCoordinate };
}

/**
 * @param {Array} array
 * @returns The last index of an array
 */
function lastIndex(array) {
  return array.length - 1;
}

/**
 * Writes a variable to the element's dataset.
 * @param {string} key Key for the variable
 * @param {*} value Value of the variable
 */
HTMLElement.prototype.setData = function (key, value = "") {
  this.dataset[key] = value;
};

/**
 * Deletes a variable from the element's dataset (if it exists)
 * @param {string} key Key for the variable
 */
HTMLElement.prototype.removeData = function (key) {
  delete this.dataset[key];
};

/**
 * @param {string} key
 * @returns If the element's dataset contains a variable named as `key`
 */
HTMLElement.prototype.containsData = function (key) {
  return this.dataset[key] || this.dataset[key] === "";
};
