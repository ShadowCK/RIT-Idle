"use strict";

// Post-mortem: Should store the HTMLElements in their corresponding objects instead of an array.
// Arrays make the structure discrete, because object & element are not connected.
// Currently I access the element in the array by using object's key/name and store the object's key in HTML dataset. Kinda dumb.

//#region Game Variables

// ********** Metrics **********
let deltaTime; // Time elapsed between frames
let totalRunTime; // Time elapsed since startup
let previousTotalRunTime; // Time elapsed from startup to last frame
let fps; // Frames per second

let lastSaveTimestamp; // Used to calculated the left time.
const lastSaveTimestamp_key = "last save timestamp";

let paused = false; // If paused, gameLoop (and most other tasks) will not be executed.

// ********** Game-specific Stats **********
let totalGameTime; // Player's time spent across runs.
const totalGameTime_key = "total game time";

let tigerSpirit;
const tigerSpirit_key = "tiger spirit";

let averageTigerSpiritPerSecond;
const averageTigerSpiritPerSecond_key = "average tiger spirit per second";
const tigerSpiritIncomeTracker = [];

let reincarnations;
let reincarnations_key = "reincarnations";

let reincarnateBonus; // A unique multiplier that doesn't depend on Upgrade System
let reincarnateBonus_key = "reincarnate bonus";

const attributes = {}; // Object literal as dictionary

const courses = {};

const upgrades = {};

// For display purpose
// It's actually unnecessary (but convenient) to remember active course and attribute,
// because all the attribute properties are stored (so is .active).
// What it actually does/needs is to set the corresponding HTML Element's dataset-active to be true as well.

let activeCourseName;
let activeCourseName_key = "active course name";
let activeAttributeName;
let activeAttributeName_key = "active attribute name";

let activeCourseSpeedMultiplier;

//#endregion

//#region HTML Elements (for graphics and interactions)
let navbar = document.querySelector("#navbar");
let HTMLAttributes = document.querySelector("#attributes ul");
let HTMLUpgrades = document.querySelector("#upgrades div");
let HTMLCourses = document.querySelector("#courses ul");
let infoBoard = document.querySelector("#infoBoard");
let combatPopupOverlay = document.querySelector("#combat .popupOverlay");
let pausedPrompt = document.querySelector("#paused");

let resumeButton = document.querySelector("#paused .button");
registerButton(resumeButton, resumeGame);

let saveButton = document.querySelector("#gameTab-main .navbar .button.save");
registerButton(saveButton, saveGame_notify);

let pauseButton = document.querySelector("#gameTab-main .navbar .button.pause");
registerButton(pauseButton, pauseGame);

let studyButton = document.querySelector("#gameTab-main .navbar .button.study");
registerButton(studyButton, (e) => {
  if (hasActiveCourse()) {
    getActiveCourse().addProgress(0.4);
  } else {
    createPopUp(
      combatPopupOverlay,
      `You must select a course to study!`,
      2,
      randomCoordinate(50, 150, 20, 60),
      { x: 0, y: -1 },
      10
    ).markAsImportant();
  }
});

let trainButton = document.querySelector("#gameTab-main .navbar .button.train");
registerButton(trainButton, (e) => {
  if (hasActiveAttribute()) {
    getActiveAttribute().addProgress(0.4);
  } else {
    createPopUp(
      combatPopupOverlay,
      `You must select an attribute to train!`,
      2,
      randomCoordinate(50, 150, 20, 60),
      { x: 0, y: -1 },
      10
    ).markAsImportant();
  }
});

let reincarnateButton = document.querySelector(
  "#gameTab-main .navbar .button.reincarnate"
);
registerButton(reincarnateButton, reincarnate);
reincarnateButton.addEventListener("mouseenter", (e) => {
  let newBonus = computeReincarnateBonus();
  let hasMetRequirement = canReincarnate();
  let isHigherBonus = newBonus >= reincarnateBonus + 0.01;
  updateInfoBoard(
    `Expected Bonus: <span class="option-value">${formatNumber(
      computeReincarnateBonus()
    )}X</span><br>
    Requirement:<br>
    <span style="color:${
      hasMetRequirement ? "rgb(55, 155, 55)" : "rgb(212, 33, 44)"
    }">1) Complete IGME-202 once.</span><br>
    <span style="color:${
      isHigherBonus ? "rgb(55, 155, 55)" : "rgb(212, 33, 44)"
    }">2) New reincarnation bonus is higher.</span></div>
    ${
      hasMetRequirement && isHigherBonus
        ? `<div style="color:rgb(55,155,55); color:rgb(55,155,55);font-size:1.2em; margin-top:10px">Good to go!</div>`
        : `<div style="color:rgb(212,33,44);font-size:1.2em; margin-top:10px">Should wait a bit.`
    }`
  );
});
reincarnateButton.addEventListener("mouseleave", (e) => {
  clearInfoBoard();
});

let idleProgressBar = document.querySelector("#idleBar .progress");

//#endregion

// When all HTML is loaded, start initialization.
window.onload = init;

/**
 * Resets LocalStorage (thus all game data) and reloads the page
 */
function hardReset() {
  if (document.readyState === "complete") {
    for (const key in localStorage) {
      localStorage.removeItem(key);
    }
    //console.log("local storage cleared");
    //console.log("performs reload...");
    document.location.reload();
  } else {
    //console.log("window has not loaded!");
  }
}

/**
 * @WARNING not fully tested.
 * Clears LocalStorage without reloading the page, keeping existing data. Basically the same as hardReset (yet.)
 */
function softReset() {
  if (document.readyState === "complete") {
    for (const key in localStorage) {
      localStorage.removeItem(key);
    }
    //console.log("local storage cleared");
    loadGame_beforeHTML();
    resetHTML();
    loadGame_afterHTML();
  } else {
    //console.log("window has not loaded!");
  }
}

/**
 * Initializes game
 */
function init() {
  // Loads data from LocalStorage
  loadGame_beforeHTML();

  // Initializes HTML elements
  initializeHTML();

  // Loads data from LocalStorage
  loadGame_afterHTML();

  // Displays a default message to the player at its initial state.
  initializeInfoBoard();

  // Gives player offline income after coming back! (= on new session)
  calculateOfflineIncome();

  // Starts game
  previousTotalRunTime = 0;
  // Uses gameLoop as a fallback function to make the game loop in-sync with window repaints.
  window.requestAnimationFrame(gameLoop);

  // Processes those less urgent, but maybe heavier tasks every second.
  setInterval(processHeavyTasks, 1000);

  // Saves game data to localStorage every 60s.
  setInterval(() => {
    // Do not show pop up when paused or the page is not an active tab (where gameLoop is not called)
    // They'll stack because popups rely on game loops
    if (paused || document.visibilityState == "hidden") {
      saveGame();
    } else {
      saveGame_notify();
    }
  }, 60000);

  // For the first few seconds, don't play sounds.
  setTimeout(() => {
    silent = false;
  }, 500);

  // Display water drops on the screen to add more immersion.
  setInterval(() => createDrop(2), 100);
  function createDrop(num) {
    const radius = 20;

    for (let i = 0; i < num; i++) {
      // Creates drop
      let drop = document.createElement("div");
      drop.className = "drop";
      // Adds the drop to a container, which is the whole page here.
      let container = document.querySelector("html");
      container.appendChild(drop);
      // Sets a random color;
      let RG = Math.random() * 50 + 173;
      drop.style.backgroundColor = `rgb(${RG}, ${RG}, 255)`;
      // Sets the drop's location
      // By adding a small portion outside of the window that will be clamped to the corners,
      // the water drops look more realistic (otherwise the corners look empty!)
      let xOffset =
        Math.random() *
          (container.offsetWidth - radius + container.offsetWidth * 0.05 * 2) -
        container.offsetWidth * 0.05;
      xOffset = clamp(xOffset, 0, container.offsetWidth - radius);
      drop.style.left = xOffset + "px";
      drop.style.top = `${-radius}px`;
      drop.style.opacity = "1"; // Unnecessary: default value is 1. But here for better readability.

      // Utilizes setTimeOut and CSS transition to realize the "falling" animation;
      // Could have used gameLoop() as well. But there's no actual need to sync with gameLoop(),
      // as the game is in HTML... However, setting a timeout for each drop can be extremely
      // resource-consuming; implementing it in gameLoop() definitely helps.
      drop.style.top = container.offsetHeight + "px"; // Setting top to another value triggers the transition!
      drop.style.opacity = "0"; // Same!
      let delay = Math.random() * 5 + 5;
      drop.style.transition = `all ${delay}s ease-in`;
      setTimeout(() => {
        container.removeChild(drop);
      }, delay * 1000);
    }
  }
}

/**
 * Loads the game from LocalStorage, before creating HTML elements.
 */
function loadGame_beforeHTML() {
  // No value stored, assigns a default value (as of first run)
  totalGameTime = loadFloat_keep(totalGameTime_key, totalGameTime, 0);

  // We don't want tiger spirits to be kept across reincarnations.
  tigerSpirit = loadFloat(tigerSpirit_key, 0);

  lastSaveTimestamp = loadInt_keep(
    lastSaveTimestamp_key,
    lastSaveTimestamp,
    Date.now()
  );

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
    courses[key] = loadObj(new Course(), key, courseConfigs[key]);
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
  if (activeCourseName) {
    setActiveCourse(activeCourseName);
  }
  activeAttributeName = localStorage.getItem(activeAttributeName_key);
  if (activeAttributeName) {
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
  localStorage.setItem(
    averageTigerSpiritPerSecond,
    averageTigerSpiritPerSecond_key
  );
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

/**
 * Continuously updates game data and graphics!
 * @param {*} realtimeSinceStartup time since the page is loaded
 */
function gameLoop(realtimeSinceStartup) {
  if (!paused) {
    // Calculates delta time
    realtimeSinceStartup /= 1000; // To seconds
    totalRunTime = realtimeSinceStartup;
    deltaTime = totalRunTime - previousTotalRunTime;
    previousTotalRunTime = realtimeSinceStartup;
    // If the user left for enough long (without the tab being active),
    // calculates the offline income since I don't know how to make the game run when the tab is inactive
    if (deltaTime > 10) {
      calculateOfflineIncome(deltaTime);
    }
    // In case of any lags, restrict deltaTime to be reasonably large.
    if (deltaTime > 1 / 10) deltaTime = 1 / 10;
    // Updates totalGameTime;
    totalGameTime += deltaTime;
    // Updates FPS
    fps = Math.round(1 / deltaTime);

    // Main body of the update
    updateGame();
  }

  // When the current frame is processed, requests for the next.
  // This must be run even when game is paused (it's a LOOP)
  window.requestAnimationFrame(gameLoop);
}

/**
 * Updates major game data and graphics
 */
function updateGame() {
  updateAttributes();
  updateCourses();
  updateInfo();

  // Updates popups
  for (const popup of popups) {
    popup.update();
  }

  // Updates the idle progress bar
  activityTracker.instance.updateIdleBar();
}

function processHeavyTasks() {
  if (paused) return;

  for (const element of HTMLUpgrades.children) {
    let upgrade = upgrades[element.dataset.upgrade];
    if (!upgrade.canAfford()) {
      element.dataset.cannotAfford = "";
    } else {
      delete element.dataset.cannotAfford;
    }
  }

  averageTigerSpiritPerSecond = computeAverageTigerSpiritPerSecond();
}

/**
 * Called in init(). Creates HTML elements for attributes.
 */
function createAttributes() {
  for (const attributeKey in attributes) {
    const attribute = attributes[attributeKey];
    let li = document.createElement("li");
    li.classList.add("attribute");
    if (attribute.influential) {
      li.classList.add("influential");
    }
    li.dataset["attribute"] = attributeKey;

    li.addEventListener("mouseenter", (e) => {
      let info = `<span style="color:rgb(15,15,155)">${capitalizeFirstChar(
        attributeKey
      )}</span><br><br>${attribute.description}`;
      updateInfoBoard(info);
    });

    li.addEventListener("mouseleave", (e) => {
      clearInfoBoard();
    });

    let text = document.createElement("p");
    text.classList.add("text");
    updateAttributeText(text, attribute);

    let frameBar = document.createElement("div");
    frameBar.classList.add("bar");

    let progressbar = document.createElement("div");
    progressbar.classList.add("progress");

    frameBar.addEventListener("click", (e) => {
      setActiveAttribute_byElement(li);
    });

    frameBar.appendChild(progressbar);
    li.appendChild(frameBar);
    li.appendChild(text);
    HTMLAttributes.appendChild(li);
  }
}

/**
 * Called in init(). Creates HTML elements for courses.
 */
function createCourses() {
  for (const courseKey in courses) {
    const course = courses[courseKey];
    let li = document.createElement("li");
    li.classList.add("course");
    li.dataset["course"] = courseKey;

    li.addEventListener("mouseenter", (e) => {
      let info = `<span style="color:rgb(15,15,155)">${
        course.courseTitle
      }</span><br><br>Reward: <span class="option-value">${formatNumber(
        course.tigerSpiritReward
      )} Tiger Spirits</span><br>Standard Completion Time: <span class="option-value">${
        course.maxProgress
      }s</span><br>Speed Cap: <span class="option-value">${formatNumber(
        course.speedMultiplierCap
      )}X</span><br>`;
      let length = course.reqAttributeNames.length;
      for (let i = 0; i < length; ) {
        info += `Req. <span>${capitalizeFirstChar(
          course.reqAttributeNames[i]
        )}</span>: <span class="option-value">${formatNumber(
          course.reqAttributeValues[i]
        )}</span>`;
        i++;
        if (i < length) {
          info += `<br>`;
        }
      }
      info += `<br><br>${course.description}`;
      updateInfoBoard(info);
    });

    li.addEventListener("mouseleave", (e) => {
      clearInfoBoard();
    });

    let text = document.createElement("p");
    text.classList.add("text");
    updateCourseText(text, course);

    let frameBar = document.createElement("div");
    frameBar.classList.add("bar");

    let indicator = document.createElement("p");
    indicator.classList.add("indicator");

    let progressbar = document.createElement("div");
    progressbar.classList.add("progress");

    frameBar.addEventListener("click", (e) => {
      setActiveCourse_byElement(li);
    });

    frameBar.appendChild(indicator);
    frameBar.appendChild(progressbar);
    li.appendChild(frameBar);
    li.appendChild(text);
    HTMLCourses.appendChild(li);
  }
}

/**
 * Called in init(). Creates HTML elements for upgrades.
 */
function createUpgrades() {
  let index = 0;
  for (const upgradeKey in upgrades) {
    const upgrade = upgrades[upgradeKey];
    let div = document.createElement("div");
    div.classList.add("upgrade");
    div.dataset.upgrade = upgradeKey;
    div.dataset.bought = upgrade.bought;

    div.addEventListener("click", (e) => {
      if (upgrade.buy()) {
        div.dataset.bought = true;
        SFX_buyUpgrade.play();
        // Adds drop-shadow to the upgrade indicating its power!
        let ratio = upgrade.tier / upgrade.getMaxTier();
        div.style.filter = `drop-shadow(0 0 ${2 + ratio * 8}px hsl(${
          (ratio * 25 * 360) % 315
        },100%,50%))`;
        // Refreshes the info board.
        updateInfoBoard_mouseEnterUpgrade(div);
      }
      // Cannot afford or already bought. It's OK to use the same SFX.
      else {
        SFX_cannotAffordUpgrade.play();
      }
    });
    div.addEventListener("mouseenter", (e) =>
      updateInfoBoard_mouseEnterUpgrade(div)
    );
    div.addEventListener("mouseleave", clearInfoBoard);

    let imageOverlay = document.createElement("img");
    imageOverlay.classList.add("overlay");
    imageOverlay.src = `images/upgrade${index}.png`;
    div.appendChild(imageOverlay);

    HTMLUpgrades.appendChild(div);
    index++;
  }
}

/**
 * Sets the active attribute for display purpose
 * @param {*} attributeKey Attribute Name
 */
function setActiveAttribute(attributeKey) {
  for (const element of HTMLAttributes.children) {
    let attribute = attributes[element.dataset.attribute];
    if (element.dataset.attribute == attributeKey) {
      element.dataset.active = true;
      attribute.active = true;
      activeAttributeName = attribute.name;
    } else {
      element.dataset.active = false;
      attribute.active = false;
    }
  }
  SFX_selectAttribute.play();
}

/**
 * Sets the active attribute for display purpose
 * @param {*} attributeElement HTML Element
 */
function setActiveAttribute_byElement(attributeElement) {
  let attributeKey = attributeElement.dataset.attribute;
  setActiveAttribute(attributeKey);
}

/**
 * Updates all player attributes, both frontend and backend
 */
function updateAttributes() {
  // Loops through all HTML elements.
  for (const element of HTMLAttributes.children) {
    // Gets the attribute we are updating
    let attributeKey = element.dataset.attribute;
    let attribute = attributes[attributeKey];

    // Only adds progress to the active attribute
    if (element.dataset.active == "true") {
      attribute.addProgress();
    }

    // Always updates HTML element for visuals (progress and base value may be added in other ways)
    element.querySelector(
      ".progress"
    ).style.width = `${attribute.getProgressPercentage()}%`;

    // When hovered over, shows details about the value
    if (element.querySelector(".bar").matches(":hover")) {
      updateAttributeText_detailed(element.querySelector(".text"), attribute);
    }
    // Normal text update when not hovered over
    else {
      updateAttributeText(element.querySelector(".text"), attribute);
    }
  }
}

/**
 * Updates the HTML display for an attribute
 * @param {*} element Attribute HTMLElement
 * @param {*} attribute Attribute object
 */
function updateAttributeText(element, attribute) {
  element.innerHTML = `${attribute.name}: ${formatNumber(
    attribute.computeValue(),
    2
  )}`;
}

/**
 * Updates the HTML display for an attribute. Includes details.
 * @param {HTMLElement} element Attribute HTMLElement
 * @param {Attribute} attribute Attribute object
 */
function updateAttributeText_detailed(element, attribute) {
  element.innerHTML = `${attribute.name
    .substring(0, 3)
    .toUpperCase()}: (${formatNumber(
    attribute.baseValue,
    2
  )}+<span style="color:rgb(44,124,212)">${formatNumber(
    attribute.getFlatBonus(),
    2
  )}</span>)*<span style="color:rgb(44,124,212)">${formatNumber(
    attribute.getMultiplierBonus(),
    2
  )}</span>=${formatNumber(attribute.computeValue(), 2)}`;
}

/**
 * Sets the active course for display purpose
 * @param {*} courseKey Course Name
 */
function setActiveCourse(courseKey) {
  for (const element of HTMLCourses.children) {
    let course = courses[element.dataset.course];
    if (element.dataset.course == courseKey) {
      element.dataset.active = true;
      course.active = true;
      activeCourseName = course.name;
    } else {
      element.dataset.active = false;
      course.active = false;
      // Removes the speed multiplier indicator;
      element.querySelector(".indicator").innerHTML = "";
    }
  }
  SFX_selectCourse.play();
}

/**
 * Sets the active course for display purpose
 * @param {*} courseElement HTML element
 */
function setActiveCourse_byElement(courseElement) {
  let courseKey = courseElement.dataset.course;
  setActiveCourse(courseKey);
}

/**
 * Updates all courses, both frontend and backend
 */
function updateCourses() {
  let isHoveringOverCourse = false;
  for (const element of HTMLCourses.children) {
    // Gets the element's corresponding course
    let courseKey = element.dataset.course;
    let course = courses[courseKey];

    // Adds progress to the active course (that the player is taking)
    if (element.dataset.active == "true") {
      course.addProgress();
      // Show the current course completion speed multiplier
      element.querySelector(".indicator").innerHTML = `${formatNumber(
        activeCourseSpeedMultiplier
      )}X`;
    }

    // Always updates HTML element for visuals (progress and base value may be added in other ways)
    element.querySelector(
      ".progress"
    ).style.width = `${course.getProgressPercentage()}%`;

    updateCourseText(element.querySelector(".text"), course);

    // If player is hovering over the course, highlight the attributes
    if (element.querySelector(".bar").matches(":hover")) {
      isHoveringOverCourse = true;
      // TODO: Nested loops have low-efficiency. Consider using a dictionary structure for the HTML elements or store them in the object.
      for (const element of HTMLAttributes.children) {
        let text = element.querySelector(".text");
        let worked = false;
        // Looks for the matching required attribute
        for (let i = 0; i < course.reqAttributeNames.length; i++) {
          const key = course.reqAttributeNames[i];
          const attribute = attributes[key];
          if (attribute.name === element.dataset.attribute) {
            text.style.color = "rgb(15, 176, 162)";
            text.style.padding = "2px";
            text.innerHTML = `${attribute.name}: ${formatNumber(
              attribute.computeValue()
            )}<span style="color: rgb(255, 42, 53)">/${formatNumber(
              course.reqAttributeValues[i]
            )}</span><span style="color: rgb(15, 176, 152); font-size: 0.7em"> (at 1X)</span>`;
            worked = true;
            break;
          }
          if (!worked) {
            text.style.color = "";
            text.style.padding = "";
          }
        }
      }
    }

    // Not hovering over any course, remove the inline styles.
    if (!isHoveringOverCourse) {
      for (const element of HTMLAttributes.children) {
        let text = element.querySelector(".text");
        text.style.color = "";
        text.style.padding = "";
      }
    }
  }
}

/**
 * Updates the HTML display for a course
 * @param {*} element HTML element
 * @param {*} course course object
 */
function updateCourseText(element, course) {
  element.innerHTML = `${course.name}: ${formatNumber(course.completions)}`;
}

/**
 * Updates the Info section
 */
function updateInfo() {
  document.querySelector(".tigerSpirits span").innerHTML = `${formatNumber(
    tigerSpirit
  )}<span style="color:rgb(0,128,0)">+${formatNumber(
    averageTigerSpiritPerSecond
  )}/s</span>`;
  document.querySelector(".totalGameTime span").innerHTML =
    getTimeString(totalGameTime);
  document.querySelector(
    ".reincarnationBonus span"
  ).innerHTML = `${formatNumber(reincarnateBonus)}X`;
}

/**
 * Checks if an attribute with the given name exists.
 */
function checkAttribute(name) {
  for (const _key in attributeKeys) {
    let key = attributeKeys[_key];
    if (key == name) return true;
  }
  return false;
}

/**
 * Gets an attribute by key
 * @param {*} name string for the attribute's key
 * @returns retrieved attribute or null if not found
 */
function getAttribute(name) {
  return attributes[name];
}

/**
 * Gets an update by key
 * @param {*} name string for the upgrade's key
 * @returns retrieved upgrade or null if not found
 */
function getUpdate(name) {
  return upgrades[name];
}

/**
 * Displays a default message to the player at its initial state.
 */
function initializeInfoBoard() {
  infoBoard.innerHTML = `<div style="width: 100%; height: 100%; display:flex; align-items:center; justify-content:center; color:inherit;">Hover over an element for tooltip</div>`;
}

/**
 * Updates the InfoBoard with given string by changing its InnerHTML.
 * @param {*} string info to display
 */
function updateInfoBoard(string) {
  clearInfoBoard();
  infoBoard.innerHTML = string;
}

/**
 * A specified differentiation of those updates on the info board.
 * @param {*} div the HTMLElement for an upgrade.
 */
function updateInfoBoard_mouseEnterUpgrade(div) {
  let upgrade = getUpdate(div.dataset.upgrade);
  let canAfford = upgrade.canAfford();
  let purchasePrompt;

  if (upgrade.getNextTier() < upgrade.getMaxTier()) {
    purchasePrompt = canAfford
      ? `<div style="color:rgb(55,155,55);font-size:1.2em; margin-top:10px">Affordable!</div>`
      : `<div style="color:rgb(212,33,44);font-size:1.2em; margin-top:10px">Not enough TS.</div>`;

    updateInfoBoard(`
  Upgrade: <span class="option-value">${upgrade.name} ${
      upgrade.bought ? `+${upgrade.getNextTier()}` : ``
    }</span><br>
  Price: <span>${formatNumber(upgrade.price)} Tiger Spirits</span><br>
  Bonus Attribute: <span class="option-value">${
    upgrade.attributeName
  }</span><br>
  Bonus Type: <span class="option-value">${upgrade.type}</span><br>
  Bonus Value: <span class="option-value">${formatNumber(
    upgrade.getNextTierValue()
  )}</span>
  ${purchasePrompt}
  `);
  } else {
    purchasePrompt = `<div style="animation: rainbow 2s linear infinite alternate; font-size:2.4em; margin-top:10px">Maxed out</div>`;
    updateInfoBoard(`
    Upgrade: <span class="option-value">${upgrade.name} +${
      upgrade.tier
    }</span><br>
    Bonus Attribute: <span class="option-value">${
      upgrade.attributeName
    }</span><br>
    Bonus Type: <span class="option-value">${upgrade.type}</span><br>
    Bonus Value: <span class="option-value">${formatNumber(
      upgrade.getNextTierValue()
    )}</span>
    ${purchasePrompt}
    `);
  }
  SFX_hoverOverUpgrade.play();
}

/**
 * Updates the InfoBoard with an empty string.
 */
function clearInfoBoard() {
  infoBoard.innerHTML = "";
  infoBoard.dataset.scrollPosition = 0;
  infoBoard.scrollTop = 0;
}

function toFixed_trimZeroes(number, digits = 2) {
  return number.toFixed(digits).replace(/\.0+$/, "");
}

/**
 * Adds to tiger spirits and generates a popup for visual representation
 * @param {} value number of tiger spirits
 */
function addTigerSpirit(
  value,
  countsInAverage = true,
  popupDuration = Math.random(0.5) + 1,
  popupSpeed = 20,
  important = false
) {
  tigerSpirit += value;
  let popup = createPopUp(
    combatPopupOverlay,
    `Tiger Spirits +${formatNumber(value)}`,
    popupDuration,
    randomCoordinate(50, 150, 20, 60),
    { x: 0, y: -1 },
    popupSpeed
  );
  if (important) popup.markAsImportant();

  if (countsInAverage) {
    tigerSpiritIncomeTracker.push(value);
  }
  // Removes the first element after 60s.
  // TODO: this is async. Should take the PAUSE state into consideration; or maybe not?
  setTimeout(() => tigerSpiritIncomeTracker.shift(), 60000);
}

/**
 * Calculates TSPS in the past minute.
 * @returns average tiger spirit per second
 */
function computeAverageTigerSpiritPerSecond() {
  let total = 0;
  for (const value of tigerSpiritIncomeTracker) {
    total += value;
  }
  total /= totalRunTime < 60 ? totalRunTime : 60;
  return total;
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
 * Pauses the game. Most content is inaccessible/static when paused.
 */
function pauseGame() {
  let p = pausedPrompt.querySelector("p");
  p.style.fontSize = "";
  p.innerHTML = "Paused...";
  paused = true;
  pausedPrompt.dataset.paused = "";
}

/**
 * Resumes the game.
 */
function resumeGame() {
  paused = false;
  delete pausedPrompt.dataset.paused;
}

/**
 * Calculates the player's offline incomes. This "offline" status may be the
 * player having left the tab inactive for a while (Visiting other websites.)
 * @param {*} offlineTime how long in seconds have the player left.
 * If not provided, will use the current time and last save time.
 */
function calculateOfflineIncome(offlineTime) {
  if (!offlineTime) {
    offlineTime = (Date.now() - lastSaveTimestamp) / 1000;
  }

  if (offlineTime < 1) return;

  const lowestIncomeRate = 10; // The player doesn't want to see a 0!
  let incomeRate =
    averageTigerSpiritPerSecond > lowestIncomeRate
      ? averageTigerSpiritPerSecond
      : lowestIncomeRate;
  let income = offlineTime * incomeRate;
  // This amount won't count in average or it's causing big trouble! (Player can manipulate this... like pausing for an hour and having a huge TSPS)
  addTigerSpirit(income, false, 5, 10, true);

  pauseGame();

  let p = pausedPrompt.querySelector("p");
  // Cancels transition for this one (or the visual looks weird)
  p.style.transition = "none";
  p.style.fontSize = "2em";
  p.innerHTML = `You're back!<br>For the past <span style="color:white;">${getTimeString(
    offlineTime
  )}</span> (capped at 24h),<br>you earned <span style="color:white;">${income.toFixed()}</span> tiger spirits!`;
  // Had to set a delay; otherwise the transition still plays for the first time (but not for later.) Weird.
  setTimeout(() => {
    p.style.transition = "";
  }, 20);

  // Manually saves the game.
  saveGame();
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
 * Registers a button with a onclick callback function
 * This includes playing the SFX when clicked.
 * @param {*} button HTML Element of the button
 * @param {*} callback onclick function
 */
function registerButton(button, callback) {
  button.addEventListener("click", (e) => {
    callback();
    SFX_clickButton.play();
  });
}

/**
 * If the player can reincarnate. Currently the requirement is to beat IGME-236 once.
 * @returns If the player can reincarnate
 */
function canReincarnate() {
  return courses[courseConfigs["IGME-202"].name].completions > 0;
}

/**
 * Performs reincarnation if possible
 * @param {*} force If true, forces a reincarnation (bypasses requirements)
 */
function reincarnate(force = false) {
  if (force || canReincarnate()) {
    let newReincarnateBonus = computeReincarnateBonus();
    if (force || newReincarnateBonus > reincarnateBonus) {
      // Some statements may make more sense put here.
      tigerSpiritIncomeTracker = [];

      softReset();
      SFX_reincarnate.play();
      reincarnateBonus = newReincarnateBonus;
    } else {
      createPopUp(
        combatPopupOverlay,
        `Your new reincarnate bonus is too low! Not worth it.`,
        3,
        randomCoordinate(50, 150, 20, 60),
        { x: 0, y: -1 },
        10
      ).markAsImportant();
    }
  } else {
    SFX_cannotAffordUpgrade.play();
    createPopUp(
      combatPopupOverlay,
      `You need to complete IGME-202 at least once to reincarnate!`,
      3,
      randomCoordinate(50, 150, 20, 60),
      { x: 0, y: -1 },
      10
    ).markAsImportant();
  }

  // Soft reset clears localStorage, so SAVE the game!!
  saveGame();
}

/**
 * Calculates the new reincarnate bonus if the player reincarnates.
 */
function computeReincarnateBonus() {
  let newReincarnateBonus = 1;
  let index = 1;
  for (const key in courses) {
    const course = courses[key];
    newReincarnateBonus += Math.pow(
      course.completions / 100,
      0.25 * Math.pow(1.25, index)
    );
    index++;
  }
  return newReincarnateBonus;
}

infoBoard.dataset.scrollPosition = 0;
/**
 * Scrolls infoBoard when the player has stopped activity for a while.
 * In this case (for this element,) do NOT use smooth scrolling behavior in CSS! It disrupts the animation.
 */
function scrollInfoBoard() {
  // Do not scroll if infoBoard is not overflowing
  if (infoBoard.scrollHeight <= infoBoard.clientHeight) {
    return;
  }

  // Stops scroll if user has rocovered activity
  if (activityTracker.instance.isActive()) return;

  // How long the function resets scrollTop after the scrolling reaches the bottom
  const resetDelay = 2;

  // clientHeight is the element's height on display.
  // scrollHeight is the expected height of the element to show all its content, with no overflow.
  // scrollableHeight is the difference between them, i.e. how many pixels we can scroll for.
  let scrollableHeight = infoBoard.scrollHeight - infoBoard.clientHeight;

  // ALL variables stored in a dataset are strings. Needs to convert them.
  let scrollPosition = Number(infoBoard.dataset.scrollPosition);

  const scrollSpeed = clamp(
    10 * mapValue(scrollableHeight, 0, 50, 0.5, 1),
    10,
    40
  ); // pixels per second

  // HTML won't set scrollTop to exceed its maximum. We utilize that and allow scrollPosition to exceed it.
  // This sets a expected "stop time" when it hits the bottom, before resetting its position.
  // Semantically, scrollPosition should be the same as scrollTop. We could use setTimeout instead to avoid confusion.
  let maxScrollTop = scrollableHeight + scrollSpeed * resetDelay;

  // Updates scrollPosition
  scrollPosition = Math.min(
    maxScrollTop,
    scrollPosition + scrollSpeed * deltaTime
  );
  // Restarts scrolling from the top
  if (scrollPosition >= maxScrollTop) {
    scrollPosition = 0;
  }

  // Sets the element's scrollTop
  infoBoard.scrollTop = scrollPosition;

  // Updates stored values
  infoBoard.dataset.scrollPosition = scrollPosition;
  infoBoard.dataset.scrollSpeed = scrollSpeed;

  // Calls this function again on the next frame
  requestAnimationFrame(scrollInfoBoard);
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
