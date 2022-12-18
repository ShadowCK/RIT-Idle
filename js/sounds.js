let silent = true;

/**
 * My own Sound Effect class, utilizing Howl.
 */
class SFX {
  constructor(...sounds) {
    this.sounds = sounds;
    this.count = sounds.length;

    this.lastPlayedTime;
    this.interval = 0; // Sets the minimum interval of playing the next sound
  }

  play() {
    if (silent) return;

    if (
      !this.lastPlayedTime ||
      (Date.now() - this.lastPlayedTime) / 1000 >= this.interval
    ) {
      this.lastPlayedTime = Date.now();
      this.sounds[Math.floor(Math.random() * this.count)].play();
    }
  }

  setInterval(interval) {
    this.interval = interval;
  }
}

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
