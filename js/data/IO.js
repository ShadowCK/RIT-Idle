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
 * @param {function} postProcess follow-up function to process loaded properties.
 * @returns Base object with properties loaded from either save data or fallback object
 */
function loadObj(base, key, fallback, postProcess) {
  if (!base) return undefined;

  let parsed = JSON.parse(localStorage.getItem(key));
  if (parsed) {
    // No need to use a copy since it's parsed from save data.
    Object.assign_safe(base, parsed);
  } else {
    extend(base, fallback);
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

  // Loads attributes
  for (const _key in attributeKeys) {
    // "_key" is dictionary (object literal) key. "key" is attribute key/name. They may be the same but this step is essential.
    const key = attributeKeys[_key];
    attributes[key] = loadObj(new Attribute(), key, attributeConfigs[key]);
  }
  // Loads courses
  for (const key in courseConfigs) {
    courses[key] = loadObj(new Course(), key, courseConfigs[key]).addConfig();
  }
  for (const key in courses) {
    const course = courses[key];
    // If the course is newly created, the pre-reqs are strings. Change them to corresponding course objects.
    course.linkPreReqs();
    // If the course is loaded from save data, the pre-reqs are object literals. Change them to real course objects.
    for (let i = 0; i < course.preReqs.length; i++) {
      const parsedLiteral = course.preReqs[i];
      course.preReqs[i] = courses[parsedLiteral.name];
    }
  }

  // Loads upgrades
  for (const _key in upgradeConfigs) {
    const key = upgradeConfigs[_key].name;
    upgrades[key] = loadObj(new Upgrade(), key, upgradeConfigs[_key]);
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
  localStorage.setItem(totalGameTime_key, totalGameTime);
  localStorage.setItem(tigerSpirit_key, tigerSpirit);
  lastSaveTimestamp = Date.now();
  localStorage.setItem(lastSaveTimestamp_key, lastSaveTimestamp);
  localStorage.setItem(averageTigerSpiritPerSecond, averageTigerSpiritPerSecond_key);
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

  //console.log(`Game Saved @ ${new Date()}`);
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
  ).markAsImportant();
}

//#endregion
