const playerData_key = "player data";
const HTMLData_key = "HTML data";

//#region Helper Methods
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
 * @param {string} key Key of the localStorage item
 * @param {*} fallback Source object from which to copy paste properties. Will use a hard copy, so no modifying source.
 * TODO: Using a hard copy is not always right (for shared data!)
 * ! And current hardCopy() is not a real hard copy, but an object literal without all the methods!
 * @param {function} postProcess Follow-up function to process loaded properties.
 * @param {string[]} ignores Ignored properties won't be assigned to `base`.
 * @returns Base object with properties loaded from either save data or fallback object
 */
function loadObj(base, key, fallback, postProcess, ...ignores) {
  if (!base) return undefined;

  let parsed = JSON.parse(localStorage.getItem(key));
  if (parsed) {
    // No need to use a copy since it's parsed from save data.
    Object.assign_safe(base, parsed, ignores);
  } else {
    extend(base, fallback, ignores);
  }

  if (postProcess) postProcess();
  return base;
}

//#endregion

//#region IO Process

/**
 * Loads the game from LocalStorage, before creating HTML elements.
 */
function loadGame_beforeHTML() {
  // Loads player data
  let loadedPlayerData = loadObj({}, playerData_key, {});
  Object.assign_safe(PlayerData, loadedPlayerData);

  // No value stored, assigns a default value (as of first run)
  totalGameTime = loadFloat_keep(totalGameTime_key, totalGameTime, 0);

  // We don't want tiger spirits to be kept across reincarnations.
  tigerSpirit = loadFloat(tigerSpirit_key, 0);

  lastSaveTimestamp = loadInt_keep(lastSaveTimestamp_key, lastSaveTimestamp, Date.now());

  // TODO: We can actually store the history highest of a single run (every reincarnation,)
  // so even if the player is offline with no course running, they will get reasonable rewards.
  averageTigerSpiritPerSecond = loadFloat(averageTigerSpiritPerSecond_key, 0);

  reincarnations = loadInt_keep(reincarnations_key, reincarnations, 0);

  reincarnateBonus = loadFloat_keep(reincarnateBonus_key, reincarnateBonus, 1);

  // Loads upgrades
  for (const _key in upgradeConfigs) {
    const key = upgradeConfigs[_key].name;
    upgrades[key] = loadObj(new Upgrade(), key, upgradeConfigs[_key]);
  }

  // Loads attributes
  for (const _key in attributeKeys) {
    // "_key" is dictionary (object literal) key. "key" is attribute key/name. They may be the same but this step is essential.
    const key = attributeKeys[_key];
    attributes[key] = loadObj(new Attribute(), key, attributeConfigs[key]);
  }
  // If the attribute is loaded from save data, the upgrades are object literals.
  // TODO: With the newly added `ignores` parameter, do not load the upgrades (since they will be replaced)
  // * Just push the loaded upgrades to attribute.upgrades to save computations.
  for (const key in attributes) {
    /** @type {Attribute} */
    const attribute = attributes[key];
    for (let i = 0; i < attribute.upgrades.length; i++) {
      const parsedLiteral = attribute.upgrades[i];
      attribute.upgrades[i] = upgrades[parsedLiteral.name];
    }
  }

  // Loads courses
  for (const key in courseConfigs) {
    courses[key] = loadObj(new Course(), key, courseConfigs[key], null, "filters").addConfig();
  }
  for (const key in courses) {
    /** @type {Course} */
    const course = courses[key];
    // If the course is newly created, the pre-reqs are strings. Change them to corresponding course objects.
    course.linkPreReqs();
    // TODO: same as above `TODO`.
    // If the course is loaded from save data, the pre-reqs are object literals. Change them to real course objects.
    for (let i = 0; i < course.preReqs.length; i++) {
      const parsedLiteral = course.preReqs[i];
      course.preReqs[i] = courses[parsedLiteral.name];
    }
  }
}

/**
 * Initializes HTML Elements
 */
function initializeHTML() {
  createAttributes();
  createCourses();
  createUpgrades();
}

/**
 * Deletes all generated game-related HTML elements and generate them again.
 */
function resetHTML() {
  function removeAllChildren(parentElement) {
    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }
  }

  removeAllChildren(HTMLAttributes);
  removeAllChildren(HTMLCourses);
  removeAllChildren(HTMLUpgrades);

  initializeHTML();
}

/**
 * Loads the game from LocalStorage, after creating HTML elements.
 * (for those that depend on/interact with/manage HTML elements)
 */
function loadGame_afterHTML() {
  // Loads previous innerHTML of "main"
  ElementDataManager.instance.loadData();
  // Adds "lost" attributes to the newly-generated elements using loaded data.
  ElementDataManager.instance.restoreData();

  activeCourseName = localStorage.getItem(activeCourseName_key);
  if (isValidString(activeCourseName)) {
    setActiveCourse(activeCourseName);
  }
  activeAttributeName = localStorage.getItem(activeAttributeName_key);
  if (isValidString(activeAttributeName)) {
    setActiveAttribute(activeAttributeName);
  }

  // Because loading takes place before any game loop (where updateInfo() is called),
  // we want the player to already be able to see their tiger spirits and stuff!
  updateInfo();
}

/**
 * Saves the game to LocalStorage.
 */
function saveGame() {
  // Saves player data
  // TODO: All other variables should be stored in PlayerData. And PlayerData thus has to have a singleton for easier serialization & deserialization.
  // * Object.fromEntries() is a rather new method added in ES2019 (ES10.)
  // * Object.entries() is part of ES2017 (ES8) specification.
  localStorage.setItem(playerData_key, JSON.stringify(Object.fromEntries(Object.entries(PlayerData))));

  localStorage.setItem(totalGameTime_key, totalGameTime);
  localStorage.setItem(tigerSpirit_key, tigerSpirit);
  lastSaveTimestamp = Date.now();
  localStorage.setItem(lastSaveTimestamp_key, lastSaveTimestamp);
  localStorage.setItem(averageTigerSpiritPerSecond_key, averageTigerSpiritPerSecond);
  localStorage.setItem(reincarnations_key, reincarnations);
  localStorage.setItem(reincarnateBonus_key, reincarnateBonus);

  // Saves attributes
  for (const attributeKey in attributes) {
    const attribute = attributes[attributeKey];
    localStorage.setItem(attribute.name, JSON.stringify(attribute));
  }
  // Saves courses
  for (const courseKey in courses) {
    const course = courses[courseKey];
    localStorage.setItem(course.name, JSON.stringify(course));
  }
  // Saves upgrades
  for (const upgradeKey in upgrades) {
    const upgrade = upgrades[upgradeKey];
    localStorage.setItem(upgrade.name, JSON.stringify(upgrade));
  }

  // Saves active course and attribute
  localStorage.setItem(activeCourseName_key, activeCourseName);
  localStorage.setItem(activeAttributeName_key, activeAttributeName);

  // Saves current innerHTML of "main"!
  ElementDataManager.instance.saveData();

  console.log(`Game Saved @ ${new Date()}`);
}

/**
 * Saves the game and creates a popup to remind player
 */
function saveGame_notify() {
  saveGame();
  let currentDate = new Date();
  // let time = currentDate.toTimeString();
  // time = time.substring(0, time.indexOf("GMT"));
  let time = currentDate.toLocaleTimeString();
  let date = currentDate.toLocaleDateString();

  createPopUp(
    combatPopupOverlay,
    `Game Saved at ${time} ${date}`,
    3,
    randomCoordinate(50, 150, 20, 60),
    { x: 0, y: -1 },
    10
  ).addTag("important");
}

//#endregion

/**
 * Stores the end-state data of the last session. Generally, manages and processes elements.
 */
class ElementDataManager {
  static _instance = null;
  /** @type {ElementDataManager} */
  static get instance() {
    if (!this._instance) {
      this._instance = new ElementDataManager();
    }
    return this._instance;
  }

  constructor() {
    // Prevents any manual constructor call bypassing the instance() getter.
    if (!ElementDataManager._instance) {
      ElementDataManager._instance = this;
      this.loadData();
    }
    return ElementDataManager._instance;
  }

  /**
   * Saves data of the `<main>` tag for next session.
   */
  saveData() {
    const HTMLData = document.querySelector("main").innerHTML;
    localStorage.setItem(HTMLData_key, HTMLData);
  }

  /**
   * Loads innerHTML data of the `<main>` tag saved last time.
   */
  loadData() {
    let innerHTML = localStorage.getItem(HTMLData_key);
    this.data = innerHTML ? document.createElement("main", null, { innerHTML }) : null;
  }

  /**
   * Because the elements are regenerated (as they should) every session (or manually called,) losing their
   * previous dataset and attributes, this function reverts them to previous statuses.
   * @returns {void} Does nothing if no saved data.
   */
  restoreData() {
    if (!this.data) return;

    // Iterates all elements in previous data.
    for (const element of this.data.querySelectorAll("*")) {
      // Elements with no id has no unique identification and therefore can't give back their data.
      if (!element.id) continue;
      // Gets the element with same `id` in the current document.
      const newElement = document.getElementById(element.id);
      // No element with the same `id` exists
      if (!newElement) {
        throw new Error(`An error occurred in \`restoreData\`: no element with id \`${element.id}\` found.`);
      }
      // Sets back the attributes (`class`, `dataset` are also attributes).
      // * To be precise, `dataset` is wrapped up `data-xxx` attributes.
      for (const attr of Object.values(element.attributes)) {
        newElement.setAttribute(attr.name, attr.value);
      }
    }
  }
}
