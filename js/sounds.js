let silent = true;

/**
 * My own Sound Effect class, utilizing Howler.js.
 */
class SFX {
  constructor(...sounds) {
    this.sounds = sounds;
    this.count = sounds.length;

    this.lastPlayedTime;
    this.interval = 0; // Sets the minimum interval of playing the next sound
  }

  /**
   * Plays a sound at the given pitch. As Howler uses "rate" for the pitch,
   * it is considered the pitch base "1" here.
   * For example, if the rate is 0.6, then a pitch of 1.5 = 0.6 * 1.5 = 0.9.
   * @param {Howl} sound
   * @param {Number} pitch
   */
  play(pitch = 1, sound = undefined) {
    // In silent mode, do not play any sound.
    if (silent) return;

    // If sound is not defined, picks a sound.
    if (!sound || !this.sounds.includes(sound)) {
      sound = this.rollSound();
    }

    // Cannot play a second time in less than "this.interval" seconds
    if (
      !this.lastPlayedTime ||
      (Date.now() - this.lastPlayedTime) / 1000 >= this.interval
    ) {
      this.lastPlayedTime = Date.now();
      let originalPitch = sound._rate;
      // Plays the sound at the given pitch
      sound._rate *= pitch;
      sound.play();
      // Reverts pitch to original state
      sound._rate = originalPitch;
    }
  }

  /**
   * Plays a sound at a random pitch. Remember, Howler's "rate" is considered the pitch base "1".
   * @param {*} minPitch
   * @param {*} maxPitch
   */
  play_randomPitch(minPitch = 1, maxPitch = 1) {
    // Gets a random pitch using given min/max ("rate" is always base "1" for the pitch)
    let randomPitch = minPitch + Math.random() * (maxPitch - minPitch);
    this.play(randomPitch);
  }

  /**
   * Gets a random sound in the sound group ("sounds" array)
   * @returns random sound variation in this.sounds
   */
  rollSound() {
    return this.sounds[Math.floor(Math.random() * this.count)];
  }

  /**
   * Sets the interval between each SFX play. Cannot play more than once within "interval" time.
   * @param {Number} interval In seconds
   */
  setInterval(interval) {
    this.interval = interval;
    return this;
  }
}

//#region SFX Initialization
let SFX_hoverOverUpgrade = new SFX(
  new Howl({
    src: ["sounds/GAME_MENU_SCORE_SFX000502.wav"],
    rate: 4,
  })
);

let SFX_buyUpgrade = new SFX(
  new Howl({
    src: ["sounds/Potion and Alchemy 06.wav"],
  })
);

let SFX_cannotAffordUpgrade = new SFX(
  new Howl({
    src: ["sounds/Armor UI 18_1.wav"],
    rate: 0.8,
  }),

  new Howl({
    src: ["sounds/Armor UI 18_2.wav"],
    rate: 0.8,
  })
);

let SFX_selectCourse = new SFX(
  new Howl({
    src: ["sounds/Book 03.wav"],
  })
);

let SFX_completeCourse = new SFX(
  new Howl({
    src: ["sounds/Writing 1.wav"],
  }),
  new Howl({
    src: ["sounds/Writing 2.wav"],
  }),
  new Howl({
    src: ["sounds/Writing 3.wav"],
  }),
  new Howl({
    src: ["sounds/Writing 4.wav"],
  })
);

SFX_completeCourse.setInterval(10);

let SFX_selectAttribute = SFX_selectCourse;

let SFX_clickButton = new SFX(
  new Howl({
    src: ["sounds/Watery Interface Large Button 1.wav"],
  }),
  new Howl({
    src: ["sounds/Watery Interface Large Button 2.wav"],
  })
);

SFX_clickButton.setInterval(0.1);

let SFX_reincarnate = new SFX(
  new Howl({
    src: ["sounds/travel.ogg"],
  })
);

//#endregion
