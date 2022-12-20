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
    if (!UIManager._instance) {
      // Object properties

      UIManager._instance = this;
    }

    return UIManager._instance;
  }
}
