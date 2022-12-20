/**
 * Gets the active attribute
 * @returns object of the active attribute (being trained)
 */
function getActiveAttribute() {
  return attributes[activeAttributeName];
}

/**
 * If activeAttributeName is set and an attribute with that name is valid.
 * @returns Whether an active attribute is set or not
 */
function hasActiveAttribute() {
  return !!activeAttributeName && !!attributes[activeAttributeName];
}

/**
 * an Attribute of the player. Can boost course completions.
 */
class Attribute {
  constructor(name = "Unknown", baseValue = 1) {
    this.name = name;
    this.baseValue = baseValue;
    this.upgrades = [];
    // Attribute training properties
    this.progress = 0;
    this.maxProgress = 5;
    this.getProgressPercentage = getProgressPercentage;

    this.element = null;
    this.active = false;

    this.description = "An attribute that benefits you in various ways.";
    this.influential = false;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  setInfluential() {
    this.influential = true;
    this.maxProgress *= 10;
    return this;
  }

  /**
   * Adds training progress to the attribute equivalent to the given time.
   * @param {*} time For how long in seconds the attribute is considered having been trained. Uses deltaTime if time is not given.
   */
  addProgress(time = deltaTime) {
    this.progress += time * reincarnateBonus;
    // Original version. Not good - doesn't use overflow.
    // if (this.progress >= this.maxProgress) {
    //   this.progress = 0;
    //   this.baseValue += 0.01;
    // }
    if (this.progress >= this.maxProgress) {
      this.baseValue += 0.01 * Math.floor(this.progress / this.maxProgress);
      this.progress = this.progress % this.maxProgress;
    }
  }

  /**
   * Calculates the buffed value from multiple sources (upgrades, more in the future...)
   * @returns modified, effective attribute value
   */
  computeValue() {
    let computedValue = this.baseValue;
    for (const upgrade of this.upgrades) {
      if (upgrade.type === UpgradeType.flat) {
        computedValue += upgrade.value;
      } else if (upgrade.type === UpgradeType.multiplier) {
        computedValue *= upgrade.value;
      }
    }
    return computedValue;
  }

  /**
   * Similar to computeValue(), but only adds up flat bonuses.
   * @returns attribute value modified only by flat bonuses
   */
  getFlatBonus() {
    let totalBonus = 0;
    for (const upgrade of this.upgrades) {
      if (upgrade.type === UpgradeType.flat) {
        totalBonus += upgrade.value;
      }
    }
    return totalBonus;
  }

  /**
   * Similar to computeValue(), but only adds up multiplier bonuses.
   * @returns attribute value modified only by multiplier bonuses
   */
  getMultiplierBonus() {
    let totalBonus = 1;
    for (const upgrade of this.upgrades) {
      if (upgrade.type === UpgradeType.multiplier) {
        totalBonus *= upgrade.value;
      }
    }
    return totalBonus;
  }
}

/**
 *
 * @deprecated Do not use. New class: Upgrade - I just forgot its existence when I coded Upgrade...
 */
class AttributeUpgrade {
  constructor(
    type = UpgradeType.flat,
    value = 0,
    name = "Unknown",
    source = "Unknown"
  ) {
    this.type = type;
    this.value = value;
    this.name = name;
    this.source = source;
  }
}
