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
    this.speedMultiplierCap = this.maxProgress / this.maxProgressCap;
    this.getProgressPercentage = getProgressPercentage;

    this.active = false;

    // Details
    this.courseTitle = "Unknown";
    this.description = "A course that you may take.";
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

    if (this.progress >= this.maxProgress) {
      let completions = Math.floor(this.progress / this.maxProgress);
      this.completions += completions;
      this.progress = this.progress % this.maxProgress;
      SFX_completeCourse.play();
      addTigerSpirit(this.tigerSpiritReward * completions, countsInAverage);
    }
  }

  setDetails(courseTitle, description) {
    this.courseTitle = courseTitle;
    this.description = description;
    return this;
  }
}
