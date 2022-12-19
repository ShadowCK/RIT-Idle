/**
 * Loads a float from localStorage. If no value is stored, uses the fallback instead.
 * @param {string} key Key of the localStorage item
 * @param {*} fallback Returned value if item not found or parsed NaN. In most cases, the default value
 * @returns Valid stored value or the fallback
 */
function loadFloat(key, fallback) {
  let parsed = Number.parseFloat(localStorage.getItem(key));
  return parsed ? parsed : fallback;
}

/**
 * Loads a float from localStorage. If no value is stored and the variable already has a value, keep it as is.
 * Otherwise, uses the fallback. This allows the variable to retain its value across soft resets/reincarnations.
 * @param {string} key Key of the localStorage item
 * @param {*} variable Returned if item not found and `variable` has a valid value.
 * @param {*} fallback Returned if item not found and `variable` has no valid value.
 * @returns Valid stored value, variable or the fallback
 */
function loadFloat_keep(key, variable, fallback) {
  let parsed = Number.parseFloat(localStorage.getItem(key));
  return parsed ? parsed : variable ? variable : fallback;
}

/**
 * Loads an integer from localStorage. If no value is stored, uses the fallback instead.
 * @param {string} key Key of the localStorage item
 * @param {*} fallback Returned value if item not found or parsed NaN. In most cases, the default value
 * @returns Valid stored value or the fallback
 */
function loadInt(key, fallback) {
  let parsed = Number.parseInt(localStorage.getItem(key));
  return parsed ? parsed : fallback;
}

/**
 * Loads an integer from localStorage. If no value is stored and the variable already has a value, keep it as is.
 * Otherwise, uses the fallback. This allows the variable to retain its value across soft resets/reincarnations.
 * @param {string} key Key of the localStorage item
 * @param {*} variable Returned if item not found and `variable` has a valid value.
 * @param {*} fallback Returned if item not found and `variable` has no valid value.
 * @returns Valid stored value, variable or the fallback
 */
function loadInt_keep(key, variable, fallback) {
  let parsed = Number.parseInt(localStorage.getItem(key));
  return parsed ? parsed : variable ? variable : fallback;
}

/**
 * Loads an object from localStorage. Must provide a "base" object of the type,
 * because JSON couldn't convert functions via stringify (no easy workarounds.)
 * Otherwise, (if we directly use the parsed obj,) the obj won't have any function.
 * If item not found, use the "fallback" object as source.
 * @param {*} base Typically a new instance of a type
 * @param {*} key Key of the localStorage item
 * @param {*} fallback Source object from which to copy paste properties. Will use a hard copy, so no modifying source.
 * @returns Base object with properties loaded from either save data or fallback object
 */
function loadObj(base, key, fallback) {
  if (!base) return undefined;

  let parsed = JSON.parse(localStorage.getItem(key));
  if (parsed) {
    // No need to use a copy since it's parsed from save data.
    Object.assign(base, parsed);
  } else {
    extend(base, fallback);
  }
  return base;
}
