/**
 * If the player can reincarnate. Currently the requirement is to beat IGME-236 once.
 * @returns If the player can reincarnate
 */
function canReincarnate() {
  return courses[courseConfigs["IGME-202"].name].completions > 0;
}

/**
 * Performs reincarnation if possible
 * @param {*} force If true, forces a reincarnation (bypasses requirements)
 */
function reincarnate(force = false) {
  if (force || canReincarnate()) {
    let newReincarnateBonus = computeReincarnateBonus();
    if (force || newReincarnateBonus > reincarnateBonus) {
      // Some statements may make more sense put here.
      tigerSpiritIncomeTracker = [];

      softReset();
      SFX_reincarnate.play();
      reincarnateBonus = newReincarnateBonus;
    } else {
      createPopUp(
        combatPopupOverlay,
        `Your new reincarnate bonus is too low! Not worth it.`,
        3,
        randomCoordinate(50, 150, 20, 60),
        { x: 0, y: -1 },
        10
      ).addTag("important");
    }
  } else {
    SFX_cannotAffordUpgrade.play();
    createPopUp(
      combatPopupOverlay,
      `You need to complete IGME-202 at least once to reincarnate!`,
      3,
      randomCoordinate(50, 150, 20, 60),
      { x: 0, y: -1 },
      10
    ).addTag("important");
  }

  // Soft reset clears localStorage, so SAVE the game!!
  saveGame();
}

/**
 * Calculates the new reincarnate bonus if the player reincarnates.
 */
function computeReincarnateBonus() {
  let newReincarnateBonus = 1;
  let index = 1;
  for (const key in courses) {
    const course = courses[key];
    newReincarnateBonus += Math.pow(
      course.completions / 100,
      0.25 * Math.pow(1.25, index)
    );
    index++;
  }
  return newReincarnateBonus;
}
