//#region Default Settings
// Exam settings
const examSettings = {
  // passed + 1 is next level (For example, the first exam is level 0+1=1)
  formula_maxProgress: "{max-progress}*1.1^({passed}+1)*10",
  formula_reqAttributeValue: "{attribute-req}*1.2^({passed}+1)*2",
};

// Course settings
const courseSettings = {
  // passed is current level
  formula_maxProgress: "{max-progress}*1.1^{passed}",
  formula_reqAttributeValue: "{attribute-req}*1.2^{passed}",
  formula_tigerSpiritReward: "{TS-reward}*1.5^{passed}",
};

//#endregion

//#region User Settings

//#endregion
