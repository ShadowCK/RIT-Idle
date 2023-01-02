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
    valuePower = 2,
    price = 100,
    pricePower = 4
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
    // Note: Multipliers do not have a "base value". Every level-up can be considered as a new multiplier purchase.
    // Example: (1*2^3[flat]+1.1*2^4[flat]+1.2*2^12[flat])*1.5^3[multi]*1.8^2[multi].
    // If valuePower is different, for instance, "1.2" for a 1.5-time multiplier, the player is actually buying a new
    // multiplier not mathematically related to "1.5" at all. Because for multipliers, there is no distinguishment
    // between level-ups and upgrades. (1.5*1.2^3)*(1.8*1.3^2) can be interpreted as 1.5*1.2*1.2*1.2*1.8*1.3*1.3,
    // each as a level-0 multiplier or any other pattern like (1.5*1.2)*(1.2*1.8)*(1.2*1.3)*1.3.
    // * In that case, ONLY ONE multiplier upgrade is needed.
    // ! However, we may use another pattern to support multiple multiplier upgrades - let the value power have a
    // ! diminishing return, like 1.5*1.5^0.9*1.5^(0.9^2)*1.5^(0.9^3)... => a[0]=1.5, a[n]=a[n-1]*(1.5^0.9^n) for n > 0
    this.valuePower = type === UpgradeType.flat ? valuePower : value;

    this.element = null;
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
    let maxTier = Math.floor(Math.log10(Number.MAX_VALUE / this.basePrice) / Math.log10(this.pricePower));

    return maxTier;
  }
}
