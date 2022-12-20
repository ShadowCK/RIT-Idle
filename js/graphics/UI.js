class UIManager {
  static _instance = null;
  static get instance() {
    if (!this._instance) {
      this._instance = new UIManager();
    }
    return this._instance;
  }

  constructor() {
    // Prevents any manual constructor call bypassing the instance() getter.
    if (!UIManager.instance) {
      // Object properties
    }

    return UIManager.instance;
  }
}
