/**
 * Gets the active course
 * @returns {Course} object of the active course (being taken)
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
    /** @type {Course} */
    this.config = null; // If this is a config already
    // Exam system
    this.passedExams = 0;
    this.isOnExam = false;

    // Formula filters
    this.filters = {
      maxProgress: new CustomFilter("{max-progress}", () => this.config.maxProgress),
      TSReward: new CustomFilter("{TS-reward}", () => this.config.tigerSpiritReward),
      passed: new CustomFilter("{passed}", () => this.passedExams),
      nextLevel: new CustomFilter("{next-level}", () => this.passedExams + 1),
    };
  }

  /** How fast the player can ultimately be (e.g., `10X` for `1s/0.1s`) */
  get speedMultiplierCap() {
    return this.maxProgress / this.maxProgressCap;
  }

  /** String to indicate the player's progress in this course. Capped at `A+` but the progress has no cap */
  get grade() {
    let index = lastIndex(courseManager.grades);
    return courseManager.grades[Math.min(this.passedExams, index)];
  }

  /** custom `==` operator */
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
      } else {
        SFX_completeCourse.play();
        let completions = Math.floor(this.progress / this.maxProgress);
        this.completions += completions;
        this.progress = this.progress % this.maxProgress;
        addTigerSpirit(this.tigerSpiritReward * completions, countsInAverage);
      }
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

  /**
   * Adds the config to the course
   * @param {Course} config A copy of this course's initial state
   * @returns this
   */
  addConfig(config) {
    this.isConfig = false;
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

  /**
   * @returns Whether the player can take the exam
   */
  canTakeExam() {
    return this.completions >= this.reqCompletions;
  }

  get reqCompletions() {
    return StringParser.parseFormula(examSettings.formula_reqCompletions, this.filters.passed);
  }

  get completionsTilExam() {
    return Math.max(0, Math.ceil(this.reqCompletions - this.completions));
  }

  /**
   * Tries to take the exam if the requirements are met
   * @param {boolean} force Whether to ignore the exam requirement. For debug purposes.
   */
  takeExam(force) {
    // Already taking the exam
    if (this.isOnExam) {
      sendError("You are already taking an exam for this course!");
      SFX_error.play();
    }
    // Cannot exceed the exam-taking limit
    else if (PlayerData.examsTaking + 1 > PlayerData.maxExamsTaking) {
      sendError(`You can't take more than ${PlayerData.maxExamsTaking} exams!`);
      SFX_error.play();
    }
    // If the player has met the exam requirement, take it!
    // Normally this shouldn't happen because the `take exam` button should be disabled or invisible with no available exam.
    // But we don't want to check and update the buttons every frame. Let's say every second - then there's a time gap for
    // the player to click on the button! (if it was usable)
    else {
      if (!this.canTakeExam() && !force) {
        sendMessage(messageType.important, `You haven't met the completion requirement yet to take an exam!`);
        return;
      }
      this.element.removeData("canTakeExam");
      setActiveCourse(this.name, false);
      this.progress = 0;
      this.isOnExam = true;
      PlayerData.examsTaking++;
      PlayerData.isOnExam = true;
      // Adds identifier for CSS
      this.element.setData("isOnExam");

      this.updateStats(true);
    }
  }

  /**
   * Called when the exam is completed. This levels up the course, resetting its stats with formulas to match the new level.
   */
  completeExam() {
    this.passedExams++;
    // Do not add exceeding exam progress to regular completions.
    this.progress = 0;
    SFX_completeExam.play();

    sendMessage(
      messageType.important,
      `You passed your NO.${this.passedExams} exam on ${this.name}! Current grade: ${this.grade}`,
      5
    );

    this.quitExam();
  }

  quitExam() {
    if (!this.isOnExam) {
      sendError("You are not on an exam for this course.", 3);
    } else {
      this.isOnExam = false;
      if (--PlayerData.examsTaking === 0) {
        PlayerData.isOnExam = false;
      }
      this.element.removeData("isOnExam");

      this.updateStats(false);

      // Immediately updates the style if there's still an exam available.
      if (this.canTakeExam()) {
        this.element.setData("canTakeExam");
      }
    }
  }

  updateStats(isForExam = false) {
    // When taking an exam, the stats required for completion are greatly increased.
    if (isForExam) {
      this.maxProgress = StringParser.parseFormula(
        examSettings.formula_maxProgress,
        this.filters.maxProgress,
        this.filters.nextLevel
      );
      for (let i = 0; i < this.reqAttributeValues.length; i++) {
        this.reqAttributeValues[i] = StringParser.parseFormula(
          examSettings.formula_reqAttributeValue,
          new CustomFilter("{attribute-req}", () => this.config.reqAttributeValues[i]),
          this.filters.nextLevel
        );
      }
    } else {
      this.maxProgress = StringParser.parseFormula(
        courseSettings.formula_maxProgress,
        this.filters.maxProgress,
        this.filters.passed
      );
      for (let i = 0; i < this.reqAttributeValues.length; i++) {
        this.reqAttributeValues[i] = StringParser.parseFormula(
          courseSettings.formula_reqAttributeValue,
          new CustomFilter("{attribute-req}", () => this.config.reqAttributeValues[i]),
          this.filters.passed
        );
      }
      this.tigerSpiritReward = StringParser.parseFormula(
        courseSettings.formula_tigerSpiritReward,
        this.filters.TSReward,
        this.filters.passed
      );
    }
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
