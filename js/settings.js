//#region Default Settings
// Exam settings
const examSettings = {
  // X=0 for the first exam
  formula_reqCompletions: "10*1.6^{passed}+100*(2^(0.5*{passed})-1)+{passed}^2*100-{passed}*100",
  // X=1 for the first exam
  formula_maxProgress: "{max-progress}*1.2^{next-level}*10",
  formula_reqAttributeValue: "{attribute-req}*1.5^{next-level}*2",
};

// Course settings
const courseSettings = {
  // passed is current level
  formula_maxProgress: "{max-progress}*1.2^{passed}",
  formula_reqAttributeValue: "{attribute-req}*1.5^{passed}",
  formula_tigerSpiritReward: "{TS-reward}*1.25^{passed}",
};

//#endregion

//#region User Settings

//#endregion
