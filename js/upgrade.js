// JavaScript style enum
const UpgradeType = {
  flat: "flat",
  multiplier: "multiplier",
};

/**
 * Buff to an attribute. Modifies its value.
 */

class Upgrade {
  constructor(
    name = "Unknown",
    attributeName = attributeKeys.programming,
    type = UpgradeType.flat,
    value = 1,
    price = 100,
    pricePower = 4,
    valuePower = type === UpgradeType.flat ? 2 : 1.1
  ) {
    this.name = name;
    this.attributeName = attributeName;
    this.type = type;
    this.value = value;
    this.basePrice = price;
    this.price = price;
    this.bought = false;

    this.tier = 0;
    this.pricePower = pricePower;
    this.valuePower = valuePower;
  }

  /**
   * Tries to purchase the upgrade.
   * @param {boolean} force Whether or not costs tiger spirits
   * @returns If successfully bought the upgrade.
   */
  buy(force = false, times = 1) {
    let worked = false;
    for (let i = 0; i < times; i++) {
      // // Cannot buy an upgrade more than once.
      // if (this.bought) return false;

      // Now you can! It's called transcend!
      if (!force && !this.canAfford()) return worked;

      if (this.getNextTier() <= this.getMaxTier()) {
        // Order matters here.
        if (!force) {
          tigerSpirit -= this.price;
        }
        this.transcend();

        if (!this.bought) {
          this.bought = true;
          attributes[this.attributeName].upgrades.push(this);
        }
        worked = true;
      }
    }
    return worked;
  }

  /**
   * If the player has enough Tiger Spirits to buy the upgrade.
   * @returns has enough TS or not.
   */
  canAfford() {
    return tigerSpirit >= this.price;
  }

  /**
   * Upgrades the upgrade! Wait wut?
   */
  transcend() {
    let nextTierIsNotMaxTier = this.getNextTier() < this.getMaxTier();
    if (nextTierIsNotMaxTier) {
      this.price *= this.pricePower;
    } else {
      this.price = -1;
    }
    if (this.bought) {
      this.tier++;
      this.value *= this.valuePower;
    }
  }

  /**
   * Used for shop preview.
   */
  getNextTier() {
    return this.tier + 1;
  }

  /**
   * Used for shop preview. Is original price if tier = 0 (never purchased)
   */
  getNextTierValue() {
    if (this.tier == 0 && !this.bought) return this.value;

    return this.value * this.valuePower;
  }

  getMaxTier() {
    let maxTier = Math.floor(
      Math.log10(Number.MAX_VALUE / this.basePrice) /
        Math.log10(this.pricePower)
    );

    return maxTier;
  }
}
