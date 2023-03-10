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
// Managers;
// const courseManager = CourseManager.instance;
// const UI = UIManager.instance;
// const buffManager = BuffManager.instance;
const courseManager = new CourseManager();
const UI = new UIManager();
const buffManager = new BuffManager();

let totalGameTime; // Player's time spent across runs.
const totalGameTime_key = "total game time";

let tigerSpirit;
const tigerSpirit_key = "tiger spirit";

let averageTigerSpiritPerSecond;
const averageTigerSpiritPerSecond_key = "average tiger spirit per second";
let tigerSpiritIncomeTracker = [];

let reincarnations;
const reincarnations_key = "reincarnations";

let reincarnateBonus; // A unique multiplier that doesn't depend on Upgrade System
const reincarnateBonus_key = "reincarnate bonus";

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
/** @type {DOMExtension.HTMLElement} */
let navbar = document.querySelector("#navbar");
/** @type {DOMExtension.HTMLElement} */
let HTMLAttributes = document.querySelector("#attributes ul");
/** @type {DOMExtension.HTMLElement} */
let HTMLUpgrades = document.querySelector("#upgrades div");
/** @type {DOMExtension.HTMLElement} */
let HTMLCourses = document.querySelector("#courses ul");
/** @type {DOMExtension.HTMLElement} */
let infoBoard = document.querySelector("#infoBoard");
/** @type {DOMExtension.HTMLElement} */
let combatPopupOverlay = document.querySelector("#combat .popupOverlay");
//TODO: this is temporary
currentPopupOverlay = combatPopupOverlay;

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

let reincarnateButton = document.querySelector("#gameTab-main .navbar .button.reincarnate");
registerButton(reincarnateButton, (e) => reincarnate(false));
reincarnateButton.addEventListener("mouseenter", (e) => {
  let newBonus = computeReincarnateBonus();
  let hasMetRequirement = canReincarnate();
  let isHigherBonus = newBonus >= reincarnateBonus + 0.01;
  updateInfoBoard(
    `Expected Bonus: <span class="option-value">${formatNumber(computeReincarnateBonus())}X</span><br>
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
 * Clears LocalStorage without reloading the page, keeping existing data. Basically the same as hardReset (yet.)
 * @Warning not fully tested
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
      /** @type {DOMExtension.HTMLElement} */
      let drop = document.createElement("div", { class: "drop" });
      const containerID = "container-drops";
      // Adds the drop to a container, which is the whole page here.
      let container =
        document.getElementById(containerID) ||
        document.documentElement.append_chain(document.createElement("div", { id: containerID }));
      container.append(drop);
      // Sets a random color;
      let RG = Math.random() * 50 + 173;
      // Sets the drop's location
      // By adding a small portion outside of the window that will be clamped to the corners,
      // the water drops look more realistic (otherwise the corners look empty!)
      let xOffset =
        Math.random() * (container.offsetWidth - radius + container.offsetWidth * 0.05 * 2) -
        container.offsetWidth * 0.05;
      xOffset = clamp(xOffset, 0, container.offsetWidth - radius);

      drop.setInlineStyle({
        left: xOffset + "px",
        top: `${-radius}px`,
        backgroundColor: `rgb(${RG}, ${RG}, 255)`,
        opacity: 1,
      });

      // Utilizes setTimeOut and CSS transition to realize the "falling" animation;
      // TODO: Could have used gameLoop() as well. But there's no actual need to sync with gameLoop(),
      // as the game is in HTML... However, setting a timeout for each drop can be extremely
      // resource-consuming; implementing it in gameLoop() definitely helps.
      let delay = Math.random() * 5 + 5;
      drop.setInlineStyle({
        top: container.offsetHeight + "px",
        opacity: 0,
        transition: `all ${delay}s ease-in`,
      });

      setTimeout(() => {
        container.removeChild(drop);
      }, delay * 1000);
    }
  }
}

/**
 * Continuously updates game data and graphics!
 * @param {number} realtimeSinceStartup time since the page is loaded
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
  buffManager.update();

  // Updates popups
  for (const popup of popups) {
    popup.update();
  }

  // Updates the idle progress bar
  activityTracker.instance.updateIdleBar();
}

function processHeavyTasks() {
  if (paused) return;

  // Refreshes upgrades' indicators for whether they are affordable.
  for (const element of HTMLUpgrades.children) {
    let upgrade = upgrades[element.getData("upgrade")];
    if (!upgrade.canAfford()) {
      element.setData("cannotAfford");
    } else {
      element.removeData("cannotAfford");
    }
  }

  for (const courseKey in courses) {
    /** @type {Course} */
    const course = courses[courseKey];
    const element = course.element;
    // Refreshes courses' indicators for whether they are unlocked.
    if (course.hasMetPreReqs()) {
      element.removeData("locked");
    } else {
      element.setData("locked");
    }
    // Refreshes courses' indicators for whether there is an exam available.
    // ? This seems to make more sense if put in `if (course.hasMetPreReqs())`
    if (course.canTakeExam() && !course.isOnExam) {
      element.setData("canTakeExam");
    } else {
      element.removeData("canTakeExam");
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
    /** @type {DOMExtension.HTMLElement} */
    let li = document.createElement("li", {
      id: `attribute-${attributeKey}`,
      class: `attribute ${attribute.influential ? "influential" : ""}`,
    });
    li.setData("attribute", attributeKey);

    li.addEventListener("mouseenter", (e) => {
      let info = `<span style="color:rgb(15,15,155)">${capitalizeFirstChar(attributeKey)}</span><br><br>${
        attribute.description
      }`;
      updateInfoBoard(info);
    });

    li.addEventListener("mouseleave", (e) => {
      clearInfoBoard();
    });

    let text = document.createElement("p", { class: "text" });
    updateAttributeText(text, attribute);

    let frameBar = document.createElement("div", { class: "bar" });
    frameBar.addEventListener("click", (e) => {
      setActiveAttribute_byElement(li);
    });

    let progressbar = document.createElement("div", { class: "progress" });

    HTMLAttributes.appendChild(li.append_chain(frameBar.append_chain(progressbar), text));

    // Adds the element to the attribute
    attribute.element = li;
  }
}

/**
 * Called in init(). Creates HTML elements for courses.
 */
function createCourses() {
  for (const courseKey in courses) {
    /** @type {Course} */
    const course = courses[courseKey];
    let li = document.createElement("li", { id: `course-${courseKey}`, class: "course" });
    li.setData("course", courseKey);

    // Displays course info on hover
    li.addEventListener("mouseenter", (e) => {
      let info = `<span style="color:rgb(15,15,155)">${course.courseTitle}</span><br><br>
      Passed Exams: <span class="option-value">${formatNumber(course.passedExams)}</span><br>
      Reward: <span class="option-value">${formatNumber(
        course.tigerSpiritReward
      )} Tiger Spirits</span><br>Standard Completion Time: <span class="option-value">${formatNumber(
        course.maxProgress
      )}s</span><br>Speed Cap: <span class="option-value">${formatNumber(course.speedMultiplierCap)}X</span><br>`;
      // Pre-Reqs
      let preReqsCount = course.preReqs.length;
      if (preReqsCount > 0) {
        info += "Pre-Reqs: ";
        for (let i = 0; i < preReqsCount; i++) {
          const preReqCourse = course.preReqs[i];
          const qualified = preReqCourse.isQualified();
          info += `<span style="color:${qualified ? "rgb(0, 170, 0)" : "rgb(212,33,44)"};">${preReqCourse.name}</span>${
            i < lastIndex(course.preReqs) ? ", " : "<br>"
          }`;
        }
      }
      // Attribute requirements
      let length = course.reqAttributeNames.length;
      for (let i = 0; i < length; ) {
        info += `Req. <span>${capitalizeFirstChar(
          course.reqAttributeNames[i]
        )}</span>: <span class="option-value">${formatNumber(course.reqAttributeValues[i])}</span>`;
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

    // Course text
    let text = document.createElement("p", { class: "text" });
    updateCourseText(text, course);
    // Frame for the progress bar
    let frameBar = document.createElement("div", { class: "bar" });
    // The speed indicator (1X, 2X...)
    let indicator = document.createElement("p", { class: "indicator" });
    // * Progress overlay
    let progressBar = document.createElement("div", { class: "progress" });

    registerButton(
      frameBar,
      (e) => {
        setActiveCourse_byElement(li);
      },
      true,
      false
    );

    // * Take Exam and Quit Exam Buttons.
    let takeExamButton = document.createElement(
      "div",
      { class: "button button-overlay", name: "take-exam" },
      { innerHTML: "Exam" }
    );
    registerButton(takeExamButton, (e) => {
      course.takeExam();
    });

    let quitExamButton = document.createElement(
      "div",
      { class: "button button-overlay", name: "quit-exam" },
      { innerHTML: "Quit" }
    );
    registerButton(quitExamButton, (e) => {
      course.quitExam();
    });

    HTMLCourses.append_chain(
      li.append_chain(frameBar.append_chain(indicator, progressBar, takeExamButton, quitExamButton), text)
    );
    // Adds the element to the course
    course.element = li;
  }
}

/**
 * Called in init(). Creates HTML elements for upgrades.
 */
function createUpgrades() {
  for (const upgradeKey in upgrades) {
    const upgrade = upgrades[upgradeKey];
    let div = document.createElement("div", { class: "upgrade" });
    div.setData("upgrade", upgradeKey);
    div.setData("bought", upgrade.bought);

    div.addEventListener("click", (e) => {
      if (upgrade.buy()) {
        div.setData("bought", true);
        SFX_buyUpgrade.play();
        // Adds drop-shadow to the upgrade indicating its power!
        let ratio = upgrade.tier / upgrade.getMaxTier();
        div.style.filter = `drop-shadow(0 0 ${2 + ratio * 8}px hsl(${(ratio * 25 * 360) % 315},100%,50%))`;
        // Refreshes the info board.
        updateInfoBoard_mouseEnterUpgrade(div);
      }
      // Cannot afford or already bought. It's OK to use the same SFX.
      else {
        SFX_cannotAffordUpgrade.play();
      }
    });
    div.addEventListener("mouseenter", (e) => updateInfoBoard_mouseEnterUpgrade(div));
    div.addEventListener("mouseleave", clearInfoBoard);

    // let imageOverlay = document.createElement("img", { class: "overlay", src: `images/upgrade${index}.png` });
    //HTMLUpgrades.append(div.append_chain(imageOverlay));
    HTMLUpgrades.append(div);
    upgrade.element = this;
  }
}

/**
 * Sets the active attribute for display purpose
 * @param {string} attributeKey Attribute Name
 */
function setActiveAttribute(attributeKey) {
  const target = attributes[attributeKey];
  // Invalid attribute key
  if (!target) {
    console.log(`No attribute with name "${attributeKey} exists!"`);
    return;
  }

  // Target attribute is already active. Safe when no active attribute is set.
  if (target === getActiveAttribute()) {
    return;
  }

  activeAttributeName = attributeKey;
  for (const key in attributes) {
    const attribute = attributes[key];
    const element = attribute.element;
    if (attribute.name === attributeKey) {
      attribute.active = true;
      element.setData("active", true);
    } else {
      attribute.active = false;
      element.setData("active", false);
    }
  }

  SFX_selectAttribute.play();
}

/**
 * Sets the active attribute for display purpose
 * @param {*} attributeElement HTML Element
 */
function setActiveAttribute_byElement(attributeElement) {
  let attributeKey = attributeElement.getData("attribute");
  setActiveAttribute(attributeKey);
}

/**
 * Updates all player attributes, both frontend and backend
 */
function updateAttributes() {
  // Loops through all HTML elements.
  for (const element of HTMLAttributes.children) {
    // Gets the attribute we are updating
    let attributeKey = element.getData("attribute");
    let attribute = attributes[attributeKey];

    // Only adds progress to the active attribute
    if (element.containsData("active", "true")) {
      attribute.addProgress();
    }

    // Always updates HTML element for visuals (progress and base value may be added in other ways)
    element.querySelector(".progress").style.width = `${attribute.getProgressPercentage()}%`;

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
 * @param {HTMLElement} element Attribute HTMLElement
 * @param {Attribute} attribute Attribute object
 */
function updateAttributeText(element, attribute) {
  setInnerHTML(element, `${attribute.name}: ${formatNumber(attribute.computeValue(), 2)}`);
}

/**
 * Updates the HTML display for an attribute. Includes details.
 * @param {HTMLElement} element Attribute HTMLElement
 * @param {Attribute} attribute Attribute object
 */
function updateAttributeText_detailed(element, attribute) {
  setInnerHTML(
    element,
    `${attribute.name.substring(0, 3).toUpperCase()}: (${formatNumber(
      attribute.baseValue,
      2
    )}+<span style="color:rgb(44,124,212)">${formatNumber(
      attribute.getFlatBonus(),
      2
    )}</span>)*<span style="color:rgb(44,124,212)">${formatNumber(
      attribute.getMultiplierBonus(),
      2
    )}</span>=${formatNumber(attribute.computeValue(), 2)}`
  );
}

/**
 * Sets the active course for display purpose
 * @param {string} courseKey Course Name
 * @param {boolean} playSound Whether to play the SFX (for user interaction)
 */
function setActiveCourse(courseKey, playSound = true) {
  const target = courses[courseKey];
  // Invalid course key
  if (!target) {
    console.log(`No course with name "${courseKey}" exists!`);
    return;
  }

  // Target course is already an active course. Safe when no active course is set.
  if (target === getActiveCourse()) {
    return;
  }

  // Pre-reqs not met.
  if (!target.hasMetPreReqs()) {
    sendError(`You can't take this course right now. Must have C- or better in the pre-requisites.`);
    return;
  }

  activeCourseName = courseKey;
  for (const key in courses) {
    const course = courses[key];
    const element = course.element;
    if (course.name === courseKey) {
      course.active = true;
      element.setData("active", true);
    } else {
      course.active = false;
      element.setData("active", false);
      // Removes the speed multiplier indicator;
      element.querySelector(".indicator").innerHTML = "";
    }
  }

  if (playSound) SFX_selectCourse.play();
}

/**
 * Sets the active course for display purpose
 * @param {HTMLElement} courseElement HTML element
 * @param {boolean} playSound Whether to play the SFX (for user interaction)
 */
function setActiveCourse_byElement(courseElement, playSound) {
  let courseKey = courseElement.getData("course");
  setActiveCourse(courseKey, playSound);
}

/**
 * Updates all courses, both frontend and backend
 */
function updateCourses() {
  // Resets the inline styles for required attributes
  // TODO: may be better if just use HTML classes.
  for (const element of HTMLAttributes.children) {
    /** @type {DOMExtension.HTMLElement} */
    let text = element.querySelector(".text");
    text.setInlineStyle({ color: "", padding: "" });
  }

  // Adds progress to the active course
  if (hasActiveCourse()) {
    getActiveCourse().addProgress();
    // Shows the current course completion speed multiplier
    setInnerHTML(
      getActiveCourse().element.querySelector(".indicator"),
      `${formatNumber(activeCourseSpeedMultiplier)}X`
    );
  }

  for (const element of HTMLCourses.children) {
    // Gets the element's corresponding course
    let courseKey = element.getData("course");
    /** @type {Course} */
    let course = courses[courseKey];

    // // Adds progress to the active course
    // if (element.containsData("active", "true")) {
    //   course.addProgress();
    //   // Shows the current course completion speed multiplier
    //   element.querySelector(".indicator").innerHTML = `${formatNumber(activeCourseSpeedMultiplier)}X`;
    // }

    // Always updates HTML element for visuals (progress and base value may be added in other ways)
    element.querySelector(".progress").style.width = `${course.getProgressPercentage()}%`;

    if (!element.querySelector(".bar").matches(":hover")) {
      updateCourseText(element.querySelector(".text"), course);
    }
    // If player is hovering over the course, highlight the required attributes and display completions until next exam as course text.
    else {
      // ! course.completionsTilExam evaluates a formula, which is expensive.
      // TODO: Update the text every second instead of every frame.
      setInnerHTML(element.querySelector(".text"), `Exam: ${formatNumber(course.completionsTilExam)} completions left`);
      for (let i = 0; i < course.reqAttributeNames.length; i++) {
        const key = course.reqAttributeNames[i];
        const attribute = attributes[key];
        const value = course.reqAttributeValues[i];
        const text = attribute.element.querySelector(".text");
        text.setInlineStyle({ color: "rgb(15, 176, 162)", padding: "2px" });
        setInnerHTML(
          text,
          `${attribute.name}: ${formatNumber(
            attribute.computeValue()
          )}<span style="color: rgb(255, 42, 53)">/${formatNumber(
            value
          )}</span><span style="color: rgb(15, 176, 152); font-size: 0.7em"> (at 1X)</span>`
        );
      }
    }
  }
}

/**
 * Updates the HTML display for a course
 * @param {HTMLElement} element HTML element
 * @param {Course} course course object
 */
function updateCourseText(element, course) {
  setInnerHTML(
    element,
    `${course.name}: ${formatNumber(course.completions)} LV.${formatNumber(course.passedExams)} (${course.grade})`
  );
}

/**
 * Updates the Info section
 */
function updateInfo() {
  setInnerHTML(
    document.querySelector(".tigerSpirits span"),
    `${formatNumber(tigerSpirit)}<span style="color:rgb(0,128,0)">+${formatNumber(
      averageTigerSpiritPerSecond
    )}/s</span>`
  );
  setInnerHTML(document.querySelector(".totalGameTime span"), getTimeString(totalGameTime));
  setInnerHTML(document.querySelector(".reincarnationBonus span"), `${formatNumber(reincarnateBonus)}X`);
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
 * Gets an upgrade by key
 * @param {*} name string for the upgrade's key
 * @returns retrieved upgrade or null if not found
 */
function getUpgrade(name) {
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
  let upgrade = getUpgrade(div.getData("upgrade"));
  let canAfford = upgrade.canAfford();
  let purchasePrompt;

  if (upgrade.getNextTier() < upgrade.getMaxTier()) {
    purchasePrompt = canAfford
      ? `<div style="color:rgb(55,155,55);font-size:1.2em; margin-top:10px">Affordable!</div>`
      : `<div style="color:rgb(212,33,44);font-size:1.2em; margin-top:10px">Not enough TS.</div>`;

    updateInfoBoard(`
  Upgrade: <span class="option-value">${upgrade.name} ${upgrade.bought ? `+${upgrade.getNextTier()}` : ``}</span><br>
  Price: <span>${formatNumber(upgrade.price)} Tiger Spirits</span><br>
  Bonus Attribute: <span class="option-value">${upgrade.attributeName}</span><br>
  Bonus Type: <span class="option-value">${upgrade.type}</span><br>
  Bonus Value: <span class="option-value">${formatNumber(upgrade.getNextTierValue())}</span>
  ${purchasePrompt}
  `);
  } else {
    purchasePrompt = `<div style="animation: rainbow 2s linear infinite alternate; font-size:2.4em; margin-top:10px">Maxed out</div>`;
    updateInfoBoard(`
    Upgrade: <span class="option-value">${upgrade.name} +${upgrade.tier}</span><br>
    Bonus Attribute: <span class="option-value">${upgrade.attributeName}</span><br>
    Bonus Type: <span class="option-value">${upgrade.type}</span><br>
    Bonus Value: <span class="option-value">${formatNumber(upgrade.getNextTierValue())}</span>
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
  infoBoard.setData("scrollPosition", 0);
  infoBoard.scrollTop = 0;
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
 * Pauses the game. Most content is inaccessible/static when paused.
 */
function pauseGame() {
  let p = pausedPrompt.querySelector("p");
  p.style.fontSize = "";
  setInnerHTML(p, "Paused...");
  paused = true;
  pausedPrompt.setData("paused");
}

/**
 * Resumes the game.
 */
function resumeGame() {
  paused = false;
  pausedPrompt.removeData("paused");
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
  let incomeRate = averageTigerSpiritPerSecond > lowestIncomeRate ? averageTigerSpiritPerSecond : lowestIncomeRate;
  let income = offlineTime * incomeRate;
  // This amount won't count in average or it's causing big trouble! (Player can manipulate this... like pausing for an hour and having a huge TSPS)
  addTigerSpirit(income, false, 5, 10, true);

  pauseGame();

  let p = pausedPrompt.querySelector("p");
  // Cancels transition for this one (or the visual looks weird)
  p.setInlineStyle({ transition: "none", fontSize: "2em" });
  setInnerHTML(
    p,
    `You're back!<br>For the past <span style="color:white;">${getTimeString(
      offlineTime
    )}</span> (capped at 24h),<br>you earned <span style="color:white;">${income.toFixed()}</span> tiger spirits!`
  );
  // Had to set a delay to set the transition to "" again; otherwise the transition still plays for the first time (but not for later.) Weird.
  setTimeout(() => {
    p.style.transition = "";
  }, 20);

  // Manually saves the game.
  saveGame();
}

/**
 * Registers a button with a onclick callback function
 * This includes playing the SFX when clicked.
 * @param {HTMLElement} button HTML Element of the button
 * @param {Function} callback onclick function
 * @param {boolean} isStrict If true, clicking on a parent/child element that also has "click" event listeners will not trigger callback for this.
 */
function registerButton(button, callback, isStrict = true, playSound = true) {
  button.addEventListener("click", (e) => {
    if (isStrict && e.currentTarget !== e.target && e.target.hasEventListener("click")) {
      // console.log("prevented button from `click` trigger");
      // console.log(button);
      // console.log(callback);
      return;
    }
    // console.log("triggered `click` event listener for button");
    // console.log(button);
    callback(e);
    if (playSound) SFX_clickButton.play();
  });
}

infoBoard.setData("scrollPosition", 0);
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
  let scrollPosition = Number(infoBoard.getData("scrollPosition"));

  const scrollSpeed = clamp(10 * mapValue(scrollableHeight, 0, 50, 0.5, 1), 10, 40); // pixels per second

  // HTML won't set scrollTop to exceed its maximum. We utilize that and allow scrollPosition to exceed it.
  // This sets a expected "stop time" when it hits the bottom, before resetting its position.
  // Semantically, scrollPosition should be the same as scrollTop. We could use setTimeout instead to avoid confusion.
  let maxScrollTop = scrollableHeight + scrollSpeed * resetDelay;

  // Updates scrollPosition
  scrollPosition = Math.min(maxScrollTop, scrollPosition + scrollSpeed * deltaTime);
  // Restarts scrolling from the top
  if (scrollPosition >= maxScrollTop) {
    scrollPosition = 0;
  }

  // Sets the element's scrollTop
  infoBoard.scrollTop = scrollPosition;

  // Updates stored values
  infoBoard.setData("scrollPosition", scrollPosition);
  infoBoard.setData("scrollSpeed", scrollSpeed);

  // Calls this function again on the next frame
  requestAnimationFrame(scrollInfoBoard);
}
