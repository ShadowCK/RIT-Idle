function lerp(start, end, amt) {
  return start * (1 - amt) + amt * end;
}

function cosineInterpolate(y1, y2, amt) {
  let amt2 = (1 - Math.cos(amt * Math.PI)) / 2;
  return y1 * (1 - amt2) + y2 * amt2;
}

function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

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

function mapValue(value, originalMin, originalMax, mappedMin, mappedMax) {
  // Calculates the ratio of the value in the original range
  let ratio = (value - originalMin) / (originalMax - originalMin);

  // Maps the value to the new range based on the ratio
  return mappedMin + ratio * (mappedMax - mappedMin);
}

function capitalizeFirstChar(string) {
  return string.charAt(0).toUpperCase() + string.substring(1);
}
