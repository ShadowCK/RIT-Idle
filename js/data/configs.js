//#region Player attributes
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

// Attribtues
const attributeConfigs = {
  [attributeKeys.programming]: new Attribute(attributeKeys.programming).setDescription(
    "With this attribute, you can turn complex algorithms into elegant solutions and create beautiful, efficient programs. As your skill improves, you'll be able to take on even the most challenging coding tasks and outsmart any obstacle in your way. Like Neo in The Matrix, you'll have the power to bend the rules of code to your will."
  ),
  [attributeKeys.aesthetics]: new Attribute(attributeKeys.aesthetics).setDescription(
    "This attribute allows you to create visually stunning designs that capture the imagination and engage the senses. As you become more skilled, you'll be able to craft even more impressive and captivating user interfaces. With your technology and creativity, you'll be like Tony Stark in Iron Man, able to build incredible things and wow your audience."
  ),
  [attributeKeys.mentality]: new Attribute(attributeKeys.mentality).setDescription(
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
  [attributeKeys.creativity]: new Attribute(attributeKeys.creativity).setDescription(
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
//#endregion

//#region Courses
const courseConfigs = {
  "IGME-105": new Course("IGME-105", [attributeKeys.programming], [1], 10, 1).setDetails(
    `Game Development and Algorithmic Problem Solving I`,
    `This course introduces students within the domain of game design and development to the fundamentals of computing through problem solving, abstraction, and algorithmic design.  Students will learn the basic elements of game software development, including problem decomposition, the design and implementation of game applications, and the testing/debugging of their designs.
  `
  ),
  "IGME-110": new Course("IGME-110", [attributeKeys.aesthetics, attributeKeys.creativity], [3, 2], 30, 1).setDetails(
    `Introduction to Interactive Media`,
    `This course provides an overview of media in historical, current and future contexts. Incorporating lectures and discussion with hands on work involving written and interactive media assets, students examine the role of written and visual media from theoretical as well as practical perspectives.  The course also provides an introduction to interactive media development techniques, including digital media components and delivery environments.  Students will be required to write formal analysis and critique papers along with digital modes of writing including collaborative editing and effective presentation design.
  `
  ),
  "MATH-131": new Course("MATH-131", [attributeKeys.math], [10], 60, 1).setDetails(
    "Discrete Mathematics",
    "This course is an introduction to the topics of discrete mathematics, including number systems, sets and logic, relations, combinatorial methods, graph theory, regular sets, vectors, and matrices."
  ),
  "IGME-106": new Course(
    "IGME-106",
    [attributeKeys.programming, attributeKeys.mentality, attributeKeys.creativity],
    [10, 4, 6],
    100,
    1
  )
    .setDetails(
      `Game Development and Algorithmic Problem Solving II`,
      `This course furthers the exploration of problem solving, abstraction, and algorithmic design.  Students apply the object-oriented paradigm of software development, with emphasis upon fundamental concepts of encapsulation, inheritance, and polymorphism.  In addition, object structures and class relationships comprise a key portion of the analytical process including the exploration of problem structure and refactoring.  Intermediate concepts in software design including GUIs, threads, events, networking, and advanced APIs are also explored.  Students are also introduced to data structures, algorithms, exception handling and design patterns that are relevant to the construction of game systems.
  `
    )
    .addPreReq("IGME-105"),
  "IGME-119": new Course("IGME-119", [attributeKeys.aesthetics, attributeKeys.creativity], [20, 10], 150, 1).setDetails(
    `2D Animation and Asset Production`,
    `This course provides a theoretical framework covering the principles of animation and its use in game design to affect user experience. Emphasis will be placed upon principles that support character development and animations that show cause and effect. Students will apply these principles to create animations that reflect movement and character appropriate for different uses and environments.
  `
  ),
  "MATH-185": new Course("MATH-185", [attributeKeys.math, attributeKeys.aesthetics], [25, 15], 200, 1)
    .setDetails(
      "Mathematics of Graphical Simulation I",
      "This is the first part of a two course sequence that aims at providing the mathematical tools needed to manipulate graphical objects and to model and simulate the physical properties of these objects. Topics from linear algebra, primarily in two and three dimensional space, analytic geometry, and calculus will be presented. The emphasis is on linear algebra, particularly its application to problems in geometry and graphical systems."
    )
    .addPreReq("MATH-131"),
  "PHYS-111": new Course("PHYS-111", [attributeKeys.physics, attributeKeys.social], [40, 20], 300, 1).setDetails(
    "College Physics I",
    "This is an introductory course in algebra-based physics focusing on mechanics and waves. Topics include kinematics, planar motion, Newton’s laws, gravitation; rotational kinematics and dynamics; work and energy; momentum and impulse; conservation laws; simple harmonic motion; waves; data presentation/analysis and error propagation. The course is taught using both traditiona lectures and a workshop format that integrates material traditionally found in separate lecture, recitation, and laboratory settings."
  ),
  "IGME-202": new Course(
    "IGME-202",
    [attributeKeys.programming, attributeKeys.creativity, attributeKeys.math, attributeKeys.physics],
    [40, 10, 10, 10],
    400,
    2
  )
    .setDetails(
      `Interactive Media Development`,
      `In this course, students will learn to create visually rich interactive experiences. It is a course in programming graphics and media, but it is also a course on the relationship between ideas and code. Students will explore topics in math and physics by building programs that simulate and visualize processes in the natural world. Assignments will include major programming projects, such as building a virtual world inhabited by digital creatures that display observable behaviors.
  `
    )
    .addPreReq("IGME-106", "MATH-185"),
  "IGME-219": new Course(
    "IGME-219",
    [attributeKeys.aesthetics, attributeKeys.physics, attributeKeys.creativity],
    [50, 25, 50],
    600,
    2
  )
    .setDetails(
      `3D Animation and Asset Production`,
      `This course provides an overview of 3D game asset production. Basic ideas learned within the first asset production course are also revisited within the 3D environs. Topics covered include modeling, texturing, skinning and animation. Emphasis is put on low polygon modeling techniques, best practices in game art production, and effective communication strategies between artists, programmers and designers.
  `
    )
    .addPreReq("IGME-119"),
  "IGME-235": new Course(
    "IGME-235",
    [attributeKeys.programming, attributeKeys.aesthetics, attributeKeys.creativity, attributeKeys.mentality],
    [80, 60, 60, 40],
    1000,
    2
  )
    .setDetails(
      `Intro to Game Web Tech`,
      `This course introduces web technologies commonly used in the production and distribution of both content focused web sites, and in the creation of interactive applications and games. Students will create web sites and web-native interactive experiences, and publish them to the web. Programming projects are required.
    `
    )
    .addPreReq("IGME-106", "IGME-110"),
  "MATH-181": new Course(
    "MATH-181",
    [attributeKeys.math, attributeKeys.social, attributeKeys.mentality],
    [120, 80, 100],
    1200,
    2
  ).setDetails(
    "Project-Based Calculus I",
    "This is the first in a two-course sequence intended for students majoring in mathematics, science, or engineering.  It emphasizes the understanding of concepts, and using them to solve physical problems.  The course covers functions, limits, continuity, the derivative, rules of differentiation, applications of the derivative, Riemann sums, definite integrals, and indefinite integrals."
  ),
  "IGME-209": new Course(
    "IGME-209",
    [attributeKeys.programming, attributeKeys.physics, attributeKeys.math],
    [200, 100, 100],
    1500,
    2
  )
    .setDetails(
      `Data Structures & Algorithms for Games & Simulations I`,
      `This course focuses upon the application of data structures, algorithms, and fundamental Newtonian physics to the development of video game applications, entertainment software titles, and simulations.  Topics covered include 3D coordinate systems and the implementation of affine transformations, geometric primitives, and efficient data structures and algorithms for real-time collision detection. Furthermore, Newtonian mechanics principles will be examined in the context of developing game and entertainment software where they will be applied to compute the position, velocity and acceleration of a point-mass subject to forces and the conservation of momentum and energy.  Programming assignments are a required part of this course.
  `
    )
    .addPreReq("IGME-106"),
  "IGME-220": new Course(
    "IGME-220",
    [attributeKeys.aesthetics, attributeKeys.creativity, attributeKeys.mentality],
    [250, 80, 150],
    1680,
    2
  ).setDetails(
    `Game Design & Development I`,
    `This course examines the core process of game design, from ideation and structured brainstorming in an entertainment technology context through the examination of industry standard processes and techniques for documenting and managing the design process.  This course specifically examines techniques for assessing and quantifying the validity of a given design, for managing innovation and creativity in a game development-specific context, and for world and character design.  Specific emphasis is placed on both the examination and deconstruction of historical successes and failures, along with presentation of ethical and cultural issues related to the design and development of interactive software and the role of individuals in a team-oriented design methodology.  Students in this class are expected to actively participate and engage in the culture of design and critique as it relates to the field.
    `
  ),
  "IGME-236": new Course(
    "IGME-236",
    [attributeKeys.aesthetics, attributeKeys.social, attributeKeys.mentality],
    [400, 150, 150],
    2300,
    2
  )
    .setDetails(
      `Experience Design for Games & Media
  `,
      `This course examines the concepts of interface and interaction models in a media-specific context, with particular emphasis on the concept of the immersive interface.  This course explores concepts such as perception, expectation, Gestalt Theory, interactivity, Semiotics, presence, and immersion in the context of media application development and deployment.  In addition, underlying concepts of cognitive psychology and cognitive science will be integrated where appropriate.  These theories are then integrated in the exploration of the immersive interface, and with related concepts such as user-level-interface modification, augmentation of identity, and the interface as a social catalyst.
  `
    )
    .addPreReq("IGME-106", "IGME-110"),
  "IGME-309": new Course(
    "IGME-309",
    [attributeKeys.programming, attributeKeys.physics, attributeKeys.math, attributeKeys.mentality],
    [400, 150, 150, 200],
    4320,
    3
  )
    .setDetails(
      `Data Structures & Algorithms for Games & Simulations II`,
      `This course continues the investigation into the application of data structures, algorithms, and fundamental Newtonian mechanics required for the development of video game applications, simulations, and entertainment software titles.  Topics covered include quaternion representation of orientation and displacement, cubic curves and surfaces, classifiers, recursive generation of geometric structures, texture mapping, and the implementation of algorithms within game physics engines for collision detection and collision resolution of rigid bodies, and the numerical integration of the equations of motion. In addition, advanced data structures such as B+ trees and graphs will be investigated from the context of game application and entertainment software development.  Programming assignments are a requirement for this course.`
    )
    .addPreReq("IGME-209", "MATH-181", "MATH-185", "PHYS-111"),
  "IGME-320": new Course(
    "IGME-320",
    [attributeKeys.aesthetics, attributeKeys.creativity, attributeKeys.mentality, attributeKeys.social],
    [500, 300, 200, 200],
    5400,
    3
  )
    .setDetails(
      `Game Design & Development II`,
      `This course continues to examine the core theories of game design as they relate to the professional field.   Beginning with a formalized pitch process, this course examines the design and development paradigm from story-boarding and pre-visualization through rapid iteration, refinement, and structured prototyping exercises to further examine the validity of a given design.  Specific emphasis is placed on iterative prototyping models, and on methodologies for both informal and formal critique.  This course also explores production techniques and life-cycle in the professional industry.`
    )
    .addPreReq("IGME-202", "IGME-220"),
  "IGME-330": new Course(
    "IGME-330",
    [attributeKeys.programming, attributeKeys.aesthetics, attributeKeys.creativity, attributeKeys.mentality],
    [800, 600, 400, 300],
    1e4,
    3
  )
    .setDetails(
      `Rich Media Web Application Development I`,
      `This course provides students the opportunity to explore the design and development of media-rich web applications that utilize both static and procedurally manipulated media such as text, images and audio. This course examines client and server-side web development and features common to such applications.  Issues explored include framework characteristics, information management, presentation, interactivity, persistence, and data binding. Programming projects are required.`
    )
    .addPreReq("IGME-235"),
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
    [1000, 1000, 300, 300, 500, 10],
    2e4,
    5
  )
    .setDetails(
      `Aesthetics and Computation`,
      `Students will design and build creative applications, while studying the history of computation in the visual arts, music, and other relevant areas. Technical topics include advanced audiovisual programming techniques, while theoretical topics include foundational discussions on artificial life, generative art, microsound, participatory and process-based art, programming as performance, and computational creativity. Individual and/or group projects will be required.
  `
    )
    .addPreReq("IGME-330"),
  Capstone: new Course(
    "Capstone",
    [attributeKeys.programming, attributeKeys.aesthetics, attributeKeys.social, attributeKeys.mentality],
    [1e8, 1e8, 1e8, 1e8],
    1e20,
    100
  ).setDetails(
    `Capstone Project`,
    `You need to complete at least one capstone project to graduate. In real life, the capstone is actually devided into two courses (IGME788 - Capstone Design and IGME789 - Capstone Development) and only for graduate GDD students.`
  ),
};
//#endregion

//#region Upgrades
// const upgradeConfigs = {
//   0: new Upgrade("Mechanical Keyboard", attributeKeys.programming, UpgradeType.flat, 0.5, 100),
//   1: new Upgrade("Chat GPT", attributeKeys.programming, UpgradeType.multiplier, 1.5, 500),
//   2: new Upgrade("Watch Anime", attributeKeys.mentality, UpgradeType.flat, 0.5, 2000),
//   3: new Upgrade("Second Monitor", attributeKeys.programming, UpgradeType.flat, 0.5, 5000),
//   4: new Upgrade("Aseprite", attributeKeys.aesthetics, UpgradeType.flat, 0.5, 10000),
//   5: new Upgrade("Frat Life", attributeKeys.social, UpgradeType.multiplier, 1.5, 20000),
//   6: new Upgrade("Pixiv Smurf", attributeKeys.aesthetics, UpgradeType.multiplier, 1.5, 50000),
//   7: new Upgrade("Hire Travis Stoder", attributeKeys.programming, UpgradeType.flat, 5, 100000),
//   8: new Upgrade("Befriend Sten McKinzie", attributeKeys.social, UpgradeType.flat, 5, 100000),
// };

const upgradeNames = {
  [attributeKeys.programming]: [
    "Programming Tutorials",
    "Programming Study Group",
    "Hackathons Experience",
    "Advanced IDE",
    "Advanced SDK",
    "Super Application Network",
  ],
  [attributeKeys.aesthetics]: [
    "Graphic Design Tutorials",
    "Texture Packs & 3D Models",
    "Attend Design Challenges",
    "UX Design Tools",
    "Animation & Motion Graphics Software",
    "Visualization Toolkit",
  ],
  [attributeKeys.mentality]: [
    "Watch Anime",
    "Brain Storm",
    "Reflection",
    "Pomodoro Technique",
    "Meditation",
    "Cognitive reframing",
  ],
  [attributeKeys.social]: [
    "Make Friends",
    "Train Teamwork & Leadership",
    "Make Speeches",
    "Update LinkedIn Profile",
    "Social Apps",
    "Networking Tools",
  ],
};

const upgradeTemplates = [
  { type: UpgradeType.flat, value: 1, price: 100, valuePower: 1.1, pricePower: 1.5 },
  { type: UpgradeType.flat, value: 3.25e1, price: 2.53e6, valuePower: 1.1022, pricePower: 1.5 },
  { type: UpgradeType.flat, value: 1.11e3, price: 6.38e10, valuePower: 1.1044, pricePower: 1.5 },
  { type: UpgradeType.multiplier, value: 2, price: 1e5, pricePower: 1e3 },
];

/**
 * @returns {Map<string, Upgrade>} Created upgrade configs (object literal)
 */
function createUpgradeConfigs() {
  const configs = {};
  for (const attributeKey in upgradeNames) {
    let upgradeIndex = 0;
    if (!attributeKeys[attributeKey]) {
      console.log(`An error occurred generating upgrade configs: No attribute "${attributeKey}" exists.`);
      continue;
    }
    for (const upgradeName of upgradeNames[attributeKey]) {
      const config = new Upgrade(upgradeName, attributeKey);
      if (!upgradeTemplates[upgradeIndex]) continue;
      Object.assign_safe(config, upgradeTemplates[upgradeIndex]);
      configs[upgradeName] = config;
      upgradeIndex++;
    }
  }
  return configs;
}

const upgradeConfigs = createUpgradeConfigs();

//#endregion
