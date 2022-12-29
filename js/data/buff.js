// TODO: Currently buffs can cause player abuse because when the game is paused,
// every update is stopped (which is reasonable.) However, while the buffs are
// paused, they already had effect on the average tiger spirit per second, which
// means the player can have boosted offline rewards for infinitely long.

class Buff {
  static type = {
    flat: "flat",
    multiplier: "multiplier",
  };

  /**
   * @warning Use BuffManager's addBuff() method!
   */
  constructor(
    category = "Unknown",
    id = "",
    type = Buff.type.flat,
    value = 1,
    duration = -1
  ) {
    this.type = type;
    this.value = value;
    this.category = category;
    this.id = id;
    this.duration = duration;
    this.startTimestamp = Date.now();
  }

  get timePassed() {
    return (Date.now() - this.startTimestamp) / 1000;
  }

  get timeLeft() {
    return Math.max(0, this.duration - this.timePassed);
  }
}

class BuffManager {
  static nextBuffId = 0;
  static _instance = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new BuffManager();
    }
    return this._instance;
  }

  constructor() {
    // Prevents any manual constructor call bypassing the instance() getter.
    if (!BuffManager._instance) {
      // Object properties
      this.buffs = {};
      this.timeBuffs = [];

      BuffManager._instance = this;
    }

    return BuffManager._instance;
  }

  addBuff(category, id, type, value, duration) {
    // Creates the category if it doesn't exist
    if (!this.buffs[category]) {
      this.buffs[category] = {};
    }

    // No id defined, gives it a unique number
    // Must have an id, even if it's not meant to be unique!
    // Otherwise the buffs must be stored in an array.
    if (!id) {
      id = BuffManager.nextBuffId++;
    }

    // If a buff with same Id already exists, removes the buff from the tracking array.
    const previous = this.buffs[category][id];
    const conflict = !!previous;
    if (conflict) {
      const index = this.timeBuffs.indexOf(previous);
      if (index >= 0) {
        this.timeBuffs.splice(index, 1);
      }
    }

    // Creates a new buff and adds it to the buff map and (if has duration) tracking array.
    let buff = new Buff(category, id, type, value, duration);
    this.buffs[category][id] = buff;
    if (buff.duration > 0) {
      this.timeBuffs.push(buff);
    }

    return buff;
  }

  computeValue(baseValue, category) {
    if (!this.buffs[category]) return;

    let computedValue = baseValue;
    const categoryMap = this.buffs[category];
    for (const id in categoryMap) {
      const buff = categoryMap[id];
      if (buff.type === Buff.type.flat) {
        computedValue += buff.value;
      } else if (buff.type === Buff.type.multiplier) {
        computedValue *= buff.value;
      }
    }
    return computedValue;
  }

  /**
   * If any stored time buff has expired, remove it from both the tracking array and the buff map.
   */
  update() {
    for (let i = lastIndex(this.timeBuffs); i >= 0; i--) {
      if (this.timeBuffs[i].timeLeft <= 0) {
        let buff = this.timeBuffs.splice(i, 1)[0];
        delete this.buffs[buff.category][buff.id];
      }
    }
  }
}
