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

// Player attributes
const attributeKeys = {
  programming: "programming",
  aesthetics: "aesthetics",
  mentality: "mentality",
  social: "social", // Special Attribute
  math: "math",
  physics: "physics",
  creativity: "creativity",
  // Very Special attributes
  // Research
  research: "research",
  // Task Board tasks - begins with 2nd year.
  problemSolving: "problem solving",
  // Speeds up some activities
  timeManagement: "time management",
  // Tutors
  communication: "communication",
}; // Object literal as enum

const attributeConfigs = {
  [attributeKeys.programming]: new Attribute(
    attributeKeys.programming
  ).setDescription(
    "With this attribute, you can turn complex algorithms into elegant solutions and create beautiful, efficient programs. As your skill improves, you'll be able to take on even the most challenging coding tasks and outsmart any obstacle in your way. Like Neo in The Matrix, you'll have the power to bend the rules of code to your will."
  ),
  [attributeKeys.aesthetics]: new Attribute(
    attributeKeys.aesthetics
  ).setDescription(
    "This attribute allows you to create visually stunning designs that capture the imagination and engage the senses. As you become more skilled, you'll be able to craft even more impressive and captivating user interfaces. With your technology and creativity, you'll be like Tony Stark in Iron Man, able to build incredible things and wow your audience."
  ),
  [attributeKeys.mentality]: new Attribute(
    attributeKeys.mentality
  ).setDescription(
    "This attribute lets you stay focused and calm under pressure, solving complex problems with ease. As you become more proficient, you'll be able to maintain your composure in even the most stressful situations and outsmart your opponents. With your mental prowess and strategic thinking, you'll be like Sherlock Holmes, able to achieve your goals."
  ),
  [attributeKeys.social]: new Attribute(attributeKeys.social).setDescription(
    "This attribute allows you to build strong relationships and connect with others, creating a network of allies and supporters. As you become more skilled, you'll be able to persuade and charm even more people, building a loyal following and achieving your objectives. With your charisma and social intelligence, you'll be like Hermione Granger in Harry Potter, able to get what you want."
  ),
  [attributeKeys.math]: new Attribute(attributeKeys.math).setDescription(
    "With this attribute, you'll be able to tackle even the most complex equations and unlock the secrets of the universe. Like Doctor Strange, you'll be able to bend time and space to your will and use your incredible mathematical skills to solve problems in ways that others can't even imagine. You'll be a master of the arcane arts of math and your skills will be in high demand."
  ),
  [attributeKeys.physics]: new Attribute(attributeKeys.physics).setDescription(
    "With this attribute, you'll be able to understand the fundamental laws of the universe and use them to your advantage. Like Tony Stark, you'll be able to create incredible technologies and bend the laws of physics to your will. Your understanding of the world around you will be unparalleled and you'll be able to use your knowledge to solve problems and achieve your goals."
  ),
  [attributeKeys.creativity]: new Attribute(
    attributeKeys.creativity
  ).setDescription(
    "With this attribute, you'll be able to think outside the box and come up with solutions to problems that others can't even begin to imagine. Like Willy Wonka, you'll be able to create incredible things and use your imagination to push the boundaries of what is possible. Your creativity will be a valuable asset and you'll be able to use it to achieve great things."
  ),
  [attributeKeys.research]: new Attribute(attributeKeys.research)
    .setDescription(
      "With this attribute, you'll be able to dig deep and uncover the truth behind any problem or mystery. Like Indiana Jones, you'll be able to track down the answers to even the most elusive questions and use your knowledge to solve problems and achieve your goals. Your research skills will be a valuable asset and you'll be able to use them to outsmart any obstacle in your way."
    )
    .setInfluential(),
  [attributeKeys.problemSolving]: new Attribute(attributeKeys.problemSolving)
    .setDescription(
      "With this attribute, you'll be able to see solutions where others see only roadblocks. Like Sherlock Holmes, you'll be able to use your incredible powers of observation and deduction to solve even the most complex problems and come out on top. Your ability to think quickly and creatively will be a valuable asset and you'll be able to use it to overcome any challenge."
    )
    .setInfluential(),
  [attributeKeys.timeManagement]: new Attribute(attributeKeys.timeManagement)
    .setDescription(
      "With this attribute, you'll be able to make the most of every moment and get more done in less time. Like Bruce Wayne, you'll be able to manage your time effectively and efficiently, so you can accomplish your goals and achieve success. Your ability to prioritize and plan will be a valuable asset and you'll be able to use it to maximize your productivity and reach your full potential."
    )
    .setInfluential(),
  [attributeKeys.communication]: new Attribute(attributeKeys.communication)
    .setDescription(
      "With this attribute, you'll be able to express yourself clearly and effectively, so you can make your ideas heard. Like James Bond, you'll be able to communicate with confidence and charm, and use your words to persuade and influence others. Your ability to listen and empathize will also be a valuable asset and you'll be able to use it to build strong, lasting relationships and achieve your goals."
    )
    .setInfluential(),
};

const attributes = {}; // Object literal as dictionary

// Courses
const courseConfigs = {
  "IGME-105": new Course(
    "IGME-105",
    [attributeKeys.programming],
    [1],
    10,
    1
  ).setDetails(
    `Game Development and Algorithmic Problem Solving I`,
    `This course introduces students within the domain of game design and development to the fundamentals of computing through problem solving, abstraction, and algorithmic design.  Students will learn the basic elements of game software development, including problem decomposition, the design and implementation of game applications, and the testing/debugging of their designs.
  `
  ),
  "IGME-106": new Course(
    "IGME-106",
    [
      attributeKeys.programming,
      attributeKeys.mentality,
      attributeKeys.creativity,
    ],
    [3, 1.5, 1.5],
    30,
    2
  ).setDetails(
    `Game Development and Algorithmic Problem Solving II`,
    `This course furthers the exploration of problem solving, abstraction, and algorithmic design.  Students apply the object-oriented paradigm of software development, with emphasis upon fundamental concepts of encapsulation, inheritance, and polymorphism.  In addition, object structures and class relationships comprise a key portion of the analytical process including the exploration of problem structure and refactoring.  Intermediate concepts in software design including GUIs, threads, events, networking, and advanced APIs are also explored.  Students are also introduced to data structures, algorithms, exception handling and design patterns that are relevant to the construction of game systems.
  `
  ),
  "IGME-110": new Course(
    "IGME-110",
    [attributeKeys.aesthetics, attributeKeys.creativity],
    [4, 3],
    40,
    3
  ).setDetails(
    `Introduction to Interactive Media`,
    `This course provides an overview of media in historical, current and future contexts. Incorporating lectures and discussion with hands on work involving written and interactive media assets, students examine the role of written and visual media from theoretical as well as practical perspectives.  The course also provides an introduction to interactive media development techniques, including digital media components and delivery environments.  Students will be required to write formal analysis and critique papers along with digital modes of writing including collaborative editing and effective presentation design.
  `
  ),
  "IGME-119": new Course(
    "IGME-119",
    [attributeKeys.aesthetics, attributeKeys.creativity],
    [10, 5],
    100,
    3
  ).setDetails(
    `2D Animation and Asset Production`,
    `This course provides a theoretical framework covering the principles of animation and its use in game design to affect user experience. Emphasis will be placed upon principles that support character development and animations that show cause and effect. Students will apply these principles to create animations that reflect movement and character appropriate for different uses and environments.
  `
  ),
  "IGME-202": new Course(
    "IGME-202",
    [
      attributeKeys.programming,
      attributeKeys.creativity,
      attributeKeys.math,
      attributeKeys.physics,
    ],
    [15, 5, 5, 5],
    200,
    4
  ).setDetails(
    `Interactive Media Development`,
    `In this course, students will learn to create visually rich interactive experiences. It is a course in programming graphics and media, but it is also a course on the relationship between ideas and code. Students will explore topics in math and physics by building programs that simulate and visualize processes in the natural world. Assignments will include major programming projects, such as building a virtual world inhabited by digital creatures that display observable behaviors.
  `
  ),
  "IGME-209": new Course(
    "IGME-209",
    [attributeKeys.programming, attributeKeys.physics, attributeKeys.math],
    [20, 10, 10],
    300,
    4
  ).setDetails(
    `Data Structures & Algorithms for Games & Simulations I`,
    `This course focuses upon the application of data structures, algorithms, and fundamental Newtonian physics to the development of video game applications, entertainment software titles, and simulations.  Topics covered include 3D coordinate systems and the implementation of affine transformations, geometric primitives, and efficient data structures and algorithms for real-time collision detection. Furthermore, Newtonian mechanics principles will be examined in the context of developing game and entertainment software where they will be applied to compute the position, velocity and acceleration of a point-mass subject to forces and the conservation of momentum and energy.  Programming assignments are a required part of this course.
  `
  ),
  "IGME-219": new Course(
    "IGME-219",
    [attributeKeys.aesthetics, attributeKeys.physics, attributeKeys.creativity],
    [20, 10, 20],
    400,
    4
  ).setDetails(
    `3D Animation and Asset Production`,
    `This course provides an overview of 3D game asset production. Basic ideas learned within the first asset production course are also revisited within the 3D environs. Topics covered include modeling, texturing, skinning and animation. Emphasis is put on low polygon modeling techniques, best practices in game art production, and effective communication strategies between artists, programmers and designers.
  `
  ),
  "IGME-220": new Course(
    "IGME-220",
    [
      attributeKeys.aesthetics,
      attributeKeys.creativity,
      attributeKeys.mentality,
    ],
    [30, 40, 20],
    600,
    5
  ).setDetails(
    `Game Design & Development I`,
    `This course examines the core process of game design, from ideation and structured brainstorming in an entertainment technology context through the examination of industry standard processes and techniques for documenting and managing the design process.  This course specifically examines techniques for assessing and quantifying the validity of a given design, for managing innovation and creativity in a game development-specific context, and for world and character design.  Specific emphasis is placed on both the examination and deconstruction of historical successes and failures, along with presentation of ethical and cultural issues related to the design and development of interactive software and the role of individuals in a team-oriented design methodology.  Students in this class are expected to actively participate and engage in the culture of design and critique as it relates to the field.
  `
  ),
  "IGME-235": new Course(
    "IGME-235",
    [
      attributeKeys.programming,
      attributeKeys.aesthetics,
      attributeKeys.creativity,
      attributeKeys.mentality,
    ],
    [30, 30, 40, 30],
    800,
    5
  ).setDetails(
    `Intro to Game Web Tech`,
    `This course introduces web technologies commonly used in the production and distribution of both content focused web sites, and in the creation of interactive applications and games. Students will create web sites and web-native interactive experiences, and publish them to the web. Programming projects are required.
  `
  ),
  "IGME-236": new Course(
    "IGME-236",
    [attributeKeys.aesthetics, attributeKeys.social, attributeKeys.mentality],
    [60, 30, 40],
    800,
    5
  ).setDetails(
    `Experience Design for Games & Media
  `,
    `This course examines the concepts of interface and interaction models in a media-specific context, with particular emphasis on the concept of the immersive interface.  This course explores concepts such as perception, expectation, Gestalt Theory, interactivity, Semiotics, presence, and immersion in the context of media application development and deployment.  In addition, underlying concepts of cognitive psychology and cognitive science will be integrated where appropriate.  These theories are then integrated in the exploration of the immersive interface, and with related concepts such as user-level-interface modification, augmentation of identity, and the interface as a social catalyst.
  `
  ),
  "IGME-309": new Course(
    "IGME-309",
    [
      attributeKeys.programming,
      attributeKeys.physics,
      attributeKeys.math,
      attributeKeys.mentality,
    ],
    [100, 50, 50, 75],
    1500,
    8
  ).setDetails(
    `Data Structures & Algorithms for Games & Simulations II`,
    `This course continues the investigation into the application of data structures, algorithms, and fundamental Newtonian mechanics required for the development of video game applications, simulations, and entertainment software titles.  Topics covered include quaternion representation of orientation and displacement, cubic curves and surfaces, classifiers, recursive generation of geometric structures, texture mapping, and the implementation of algorithms within game physics engines for collision detection and collision resolution of rigid bodies, and the numerical integration of the equations of motion. In addition, advanced data structures such as B+ trees and graphs will be investigated from the context of game application and entertainment software development.  Programming assignments are a requirement for this course.`
  ),
  "IGME-320": new Course(
    "IGME-320",
    [
      attributeKeys.aesthetics,
      attributeKeys.creativity,
      attributeKeys.mentality,
      attributeKeys.social,
    ],
    [100, 60, 60, 60],
    2000,
    8
  ).setDetails(
    `Game Design & Development II`,
    `This course continues to examine the core theories of game design as they relate to the professional field.   Beginning with a formalized pitch process, this course examines the design and development paradigm from story-boarding and pre-visualization through rapid iteration, refinement, and structured prototyping exercises to further examine the validity of a given design.  Specific emphasis is placed on iterative prototyping models, and on methodologies for both informal and formal critique.  This course also explores production techniques and life-cycle in the professional industry.`
  ),
  "IGME-330": new Course(
    "IGME-330",
    [
      attributeKeys.programming,
      attributeKeys.aesthetics,
      attributeKeys.creativity,
      attributeKeys.mentality,
    ],
    [120, 80, 80, 80],
    2500,
    8
  ).setDetails(
    `Rich Media Web Application Development I`,
    `This course provides students the opportunity to explore the design and development of media-rich web applications that utilize both static and procedurally manipulated media such as text, images and audio. This course examines client and server-side web development and features common to such applications.  Issues explored include framework characteristics, information management, presentation, interactivity, persistence, and data binding. Programming projects are required.`
  ),
  "IGME-531": new Course(
    "IGME-531",
    [
      attributeKeys.programming,
      attributeKeys.aesthetics,
      attributeKeys.math,
      attributeKeys.physics,
      attributeKeys.creativity,
      attributeKeys.research,
    ],
    [150, 150, 60, 60, 150, 10],
    5000,
    10
  ).setDetails(
    `Aesthetics and Computation`,
    `Students will design and build creative applications, while studying the history of computation in the visual arts, music, and other relevant areas. Technical topics include advanced audiovisual programming techniques, while theoretical topics include foundational discussions on artificial life, generative art, microsound, participatory and process-based art, programming as performance, and computational creativity. Individual and/or group projects will be required.
  `
  ),
  Capstone: new Course(
    "Capstone",
    [
      attributeKeys.programming,
      attributeKeys.aesthetics,
      attributeKeys.social,
      attributeKeys.mentality,
    ],
    [1e8, 1e8, 1e8, 1e8],
    1e20,
    100
  ).setDetails(
    `Capstone Project`,
    `You need to complete at least one capstone project to graduate. In real life, the capstone is actually devided into two courses (IGME788 - Capstone Design and IGME789 - Capstone Development) and only for graduate GDD students.`
  ),
};

const courses = {};

// Upgrades;
const upgradeConfigs = {
  0: new Upgrade(
    "Mechanical Keyboard",
    attributeKeys.programming,
    UpgradeType.flat,
    0.5,
    100
  ),
  1: new Upgrade(
    "Chat GPT",
    attributeKeys.programming,
    UpgradeType.multiplier,
    1.5,
    500
  ),
  2: new Upgrade(
    "Watch Anime",
    attributeKeys.mentality,
    UpgradeType.flat,
    0.5,
    2000
  ),
  3: new Upgrade(
    "Second Monitor",
    attributeKeys.programming,
    UpgradeType.flat,
    0.5,
    5000
  ),
  4: new Upgrade(
    "Aseprite",
    attributeKeys.aesthetics,
    UpgradeType.flat,
    0.5,
    10000
  ),
  5: new Upgrade(
    "Frat Life",
    attributeKeys.social,
    UpgradeType.multiplier,
    1.5,
    20000
  ),
  6: new Upgrade(
    "Pixiv Smurf",
    attributeKeys.aesthetics,
    UpgradeType.multiplier,
    1.5,
    50000
  ),
  7: new Upgrade(
    "Hire Travis Stoder",
    attributeKeys.programming,
    UpgradeType.flat,
    5,
    100000
  ),
  8: new Upgrade(
    "Befriend Sten McKinzie",
    attributeKeys.social,
    UpgradeType.flat,
    5,
    100000
  ),
};

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
  /**
   * This module works, but only for a game initialization where the value is undefined (uninitialized.)
   * If we reincarnates/soft resets, the previous value will be overwritten.
  totalGameTime = Number.parseFloat(localStorage.getItem(totalGameTime_key));
  // No value stored, assigns a default value (as of first run)
  if (!totalGameTime) {
    totalGameTime = 0;
  }
  */
  // Use this module if we want to keep data across reincarnations.
  let parsed;

  parsed = Number.parseFloat(localStorage.getItem(totalGameTime_key));
  // No value stored, assigns a default value (as of first run)
  if (parsed) {
    totalGameTime = parsed;
  } else if (!totalGameTime) {
    totalGameTime = 0;
  }

  // We don't want tiger spirits to be kept across reincarnations.
  tigerSpirit = Number.parseFloat(localStorage.getItem(tigerSpirit_key));
  if (!tigerSpirit) {
    tigerSpirit = 0;
  }

  parsed = Number.parseInt(localStorage.getItem(lastSaveTimestamp_key));
  if (parsed) {
    lastSaveTimestamp = parsed;
  } else if (!lastSaveTimestamp) {
    lastSaveTimestamp = Date.now();
  }

  // TODO: We can actually store the history highest of a single run (every reincarnation,)
  // so even if the player is offline with no course running, they will get reasonable rewards.
  averageTigerSpiritPerSecond = Number.parseFloat(
    localStorage.getItem(averageTigerSpiritPerSecond_key)
  );
  if (!averageTigerSpiritPerSecond) {
    averageTigerSpiritPerSecond = 0;
  }

  parsed = Number.parseInt(localStorage.getItem(reincarnations_key));
  if (parsed) {
    reincarnations = parsed;
  } else if (!reincarnations) {
    reincarnations = 0;
  }

  parsed = Number.parseFloat(localStorage.getItem(reincarnateBonus_key));
  if (parsed) {
    reincarnateBonus = parsed;
  } else if (!reincarnateBonus) {
    reincarnateBonus = 1;
  }

  // Loads attributes
  for (const _key in attributeKeys) {
    // "_key" is dictionary (object literal) key. "key" is attribute key/name. They may be the same but this step is essential.
    const key = attributeKeys[_key];
    // Always instantiates an Attribute because JSON couldn't convert functions in an object.
    // Otherwise, The object will lose functions after I/O
    attributes[key] = new Attribute();

    // This is still shallow copy...
    // Object.assign(attributes[key], attributeConfigs[key]);
    // Use JSON to help with a deep copy!
    Object.assign(
      attributes[key],
      JSON.parse(JSON.stringify(attributeConfigs[key]))
    );
    let parsed = JSON.parse(localStorage.getItem(key));
    // If parsed is not null, copies all its properties to the corresponding attribute
    if (parsed) {
      Object.assign(attributes[key], parsed);
    }
  }
  // Loads courses
  for (const key in courseConfigs) {
    courses[key] = new Course();
    Object.assign(courses[key], JSON.parse(JSON.stringify(courseConfigs[key])));
    let parsed = JSON.parse(localStorage.getItem(key));
    if (parsed) {
      Object.assign(courses[key], parsed);
    }
  }

  // Loads upgrades
  for (const _key in upgradeConfigs) {
    let key = upgradeConfigs[_key].name;
    // Original: this won't get rid of upgrades the on soft reset (reincarnate)!
    // Because upgrades[key] has same reference as upgradeConfigs[_key]
    // upgrades[key] = upgradeConfigs[_key];
    upgrades[key] = new Upgrade();
    Object.assign(
      upgrades[key],
      JSON.parse(JSON.stringify(upgradeConfigs[_key]))
    );
    let parsed = JSON.parse(localStorage.getItem(key));
    if (parsed) {
      Object.assign(upgrades[key], parsed);
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
