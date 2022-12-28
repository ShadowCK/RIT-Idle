/**
 * Gets the active course
 * @returns object of the active course (being taken)
 */
function getActiveCourse() {
  return courses[activeCourseName];
}

/**
 * If activeCourseName is set and a course with that name is valid.
 * @returns Whether an active course is set or not
 */
function hasActiveCourse() {
  return !!activeCourseName && !!courses[activeCourseName]; // !!value equals Boolean(value)
}

class Course {
  /**
   *
   * @param {*} name Course name
   * @param {*} reqAttributeNames Attributes that modify the speed.
   * @param {*} reqAttributeValues Recommended attributes to be at 1x speed.
   * @param {*} tigerSpiritReward Tiger spirits reward
   * @param {*} maxProgress Seconds taken to complete once.
   * @param {*} maxProgressCap Better leave them as the default value to stay consistent across courses.
   */
  constructor(
    name = "Unknown",
    reqAttributeNames = ["Unknown"],
    reqAttributeValues = [1],
    tigerSpiritReward = 10,
    maxProgress = 1,
    maxProgressCap = 0.1
  ) {
    this.name = name;
    this.reqAttributeNames = reqAttributeNames;
    this.reqAttributeValues = reqAttributeValues;
    this.tigerSpiritReward = tigerSpiritReward;
    this.progress = 0;
    this.maxProgress = maxProgress;
    this.completions = 0;
    this.maxProgressCap = maxProgressCap;
    this.getProgressPercentage = getProgressPercentage;

    this.element = null;
    this.active = false;
    // Details
    this.courseTitle = "Unknown";
    this.description = "A course that you may take.";
    this.preReqs = [];
    this.isConfig = true;
    this.config = null; // If this is a config already
    // Exam system
    this.passedExams = 0;
    this.isOnExam = false;
  }

  get speedMultiplierCap() {
    return this.maxProgress / this.maxProgressCap;
  }

  // Grade string
  get grade() {
    let index = lastIndex(courseManager.grades);
    return courseManager.grades[Math.min(this.passedExams, index)];
  }

  // custom `==` operator
  static valueOf() {
    return this.name;
  }

  /**
   * Adds completion progress to the course equivalent to the given time.
   * @param {*} time For how long in seconds the course is considered having been taken. Uses deltaTime if time is not given.
   */
  addProgress(time = deltaTime, countsInAverage = true) {
    let computedProgress = time;
    let combinedMultiplier = 1;

    // Computes the modified progress
    for (let i = 0; i < this.reqAttributeNames.length; i++) {
      let attribKey = this.reqAttributeNames[i];
      let reqAttributeValue = this.reqAttributeValues[i];
      // If the required attribute is valid (exists), modifies the progress (thus anticipated completion time)
      if (checkAttribute(attribKey)) {
        let attribValue = getAttribute(attribKey).computeValue();
        let multiplier;
        let ratio = attribValue / reqAttributeValue;
        if (ratio < reqAttributeValue) {
          multiplier = ratio;
        } else {
          // Formulates attribValue to provide a multiplier to the progress
          multiplier = Math.pow(ratio, 0.85);
        }
        combinedMultiplier *= multiplier;
      }
    }
    // Adds reincarnation bonus (as a multiplier) to the combined multiplier.
    combinedMultiplier *= reincarnateBonus;

    // Caps the final multiplier to prevent player from sticking with lower-level courses. (Limiting the rewards)
    if (combinedMultiplier > this.speedMultiplierCap) {
      combinedMultiplier = this.speedMultiplierCap;
    }
    // Tracks the speed multiplier with a global variable
    activeCourseSpeedMultiplier = combinedMultiplier;
    // Adds progress to the course
    computedProgress *= combinedMultiplier;
    this.progress += computedProgress;

    // Is completed at least once...
    if (this.progress >= this.maxProgress) {
      if (this.isOnExam) {
        this.completeExam();
        SFX_completeExam.play();
      } else {
        SFX_completeCourse.play();
      }
      let completions = Math.floor(this.progress / this.maxProgress);
      this.completions += completions;
      this.progress = this.progress % this.maxProgress;
      addTigerSpirit(this.tigerSpiritReward * completions, countsInAverage);
    }
  }

  /**
   * Sets the course title and description for display purpose.
   * @param {*} courseTitle Course title.
   * @param {*} description Course description.
   * @returns this
   */
  setDetails(courseTitle, description) {
    this.courseTitle = courseTitle;
    this.description = description;
    return this;
  }

  /**
   * Adds pre requisites for the course.
   * @param  {...string} keys names of the pre-requisite courses.
   * @returns this
   */
  addPreReq(...keys) {
    for (const courseKey of keys) {
      // Do no store a course multiple times
      if (this.preReqs.includes(courseKey)) continue;

      this.preReqs.push(courseKey);
    }
    return this;
  }

  /**
   * @returns Whether this course has pre-requisite courses.
   */
  hasPreReq() {
    return this.preReqs.length > 0;
  }

  addConfig(config) {
    if (config) this.config = config;
    else this.config = courseConfigs[this.name];
    return this;
  }

  /**
   * Change the strings in the preReq array to be real Course objects.
   */
  linkPreReqs() {
    for (let i = lastIndex(this.preReqs); i >= 0; i--) {
      const item = this.preReqs[i];
      if (typeof item === "string") {
        if (courses[item]) {
          this.preReqs[i] = courses[item];
        } else {
          console.log(`Pre-req ${item} is not a valid course name.`);
          this.preReqs.splice(i, 1);
        }
      }
    }
  }

  /**
   * @returns Whether the course has C- or a better grade.
   */
  isQualified() {
    return this.passedExams >= courseManager.preReqExamReq;
  }

  /**
   * @returns Whether the course has met its pre-req requirements.
   */
  hasMetPreReqs() {
    // No pre-reqs, automatically pass.
    if (this.preReqs.length === 0) {
      return true;
    }

    for (const course of this.preReqs) {
      if (!course.isQualified()) {
        return false;
      }
    }

    return true;
  }

  takeExam() {
    if (this.isOnExam) {
      sendMessage(messageType.error, "You are already taking an exam for this course!");
      SFX_error.play();
    } else if (PlayerData.examsTaking + 1 > PlayerData.maxExamsTaking) {
      sendMessage(messageType.error, `You can't take more than ${PlayerData.maxExamsTaking} exams!`);
      SFX_error.play();
    } else {
      // Course requirement
      if (false) return;

      this.progress = 0;

      this.isOnExam = true;
      PlayerData.examsTaking++;
      PlayerData.isOnExam = true;
      this.element.setData("isOnExam");

      const filters = {
        maxProgress: new CustomFilter("{max-progress}", () => this.config.maxProgress),
        passed: new CustomFilter("{passed}", () => this.passedExams),
      };

      // Exam stats are greatly increased.
      this.maxProgress = StringParser.parseFormula(
        examSettings.formula_maxProgress,
        filters.maxProgress,
        filters.passed
      );

      for (let i = 0; i < this.reqAttributeValues.length; i++) {
        this.reqAttributeValues[i] = StringParser.parseFormula(
          examSettings.formula_reqAttributeValue,
          new CustomFilter("{attribute-req}", () => this.config.reqAttributeValues[i]),
          filters.passed
        );
      }
    }
  }

  completeExam() {
    this.passedExams++;
    sendMessage(
      messageType.normal,
      `You passed your NO.${this.passedExams} exam on ${this.name}! Current grade:${this.grade}`
    );

    this.isOnExam = false;
    if (--PlayerData.examsTaking === 0) {
      PlayerData.isOnExam = false;
    }
    this.element.removeData("isOnExam");

    // Changes course stats the match its level/grade/passed count.
    const filters = {
      maxProgress: new CustomFilter("{max-progress}", () => this.config.maxProgress),
      TSReward: new CustomFilter("{TS-reward}", () => this.config.tigerSpiritReward),
      passed: new CustomFilter("{passed}", () => this.passedExams),
    };
    this.maxProgress = StringParser.parseFormula(
      courseSettings.formula_maxProgress,
      filters.maxProgress,
      filters.passed
    );

    for (let i = 0; i < this.reqAttributeValues.length; i++) {
      this.reqAttributeValues[i] = StringParser.parseFormula(
        courseSettings.formula_reqAttributeValue,
        new CustomFilter("{attribute-req}", () => this.config.reqAttributeValues[i]),
        filters.passed
      );
    }

    this.tigerSpiritReward = StringParser.parseFormula(
      courseSettings.formula_tigerSpiritReward,
      filters.TSReward,
      filters.passed
    );
  }
}

class CourseManager {
  static _instance = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new CourseManager();
    }
    return this._instance;
  }

  constructor() {
    // Prevents any manual constructor call bypassing the instance() getter.
    if (!CourseManager._instance) {
      // Object properties
      this.grades = ["D", "D+", "C-", "C", "C+", "B-", "B", "B+", "B", "B+", "A-", "A", "A+"];
      // Each grade and their corresponding exam requires.
      this.examReqs = this.grades.reduce((obj, element, index) => {
        obj[element] = index;
        return obj;
      }, {});
      this.preReqExamReq = this.examReqs["C-"];

      CourseManager._instance = this;
    }
    return CourseManager._instance;
  }
}
