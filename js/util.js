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
