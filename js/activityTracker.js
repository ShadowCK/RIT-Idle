/**
 * Tracks if the user is doing something on the page
 */
class activityTracker {
  static instance = new activityTracker();

  constructor() {
    if (activityTracker.instance) return;

    // The latest timeout ID
    this.idleTimeout;
    this.lastTimeoutTimestamp = Date.now();

    this.progress = 0;
    this.progressBuffer = 0.25;
    this.maxProgress = 0.6; // in seconds
  }

  /**
   * @returns If the user is active
   */
  isActive() {
    return !this.idleTimeout || this.idleTimeout > 0;
  }

  /**
   * @returns If the user is idle
   */
  isIdle() {
    return !this.isActive();
  }

  updateIdleBar() {
    this.progress = (Date.now() - this.lastTimeoutTimestamp) / 1000;
    if (this.progress > this.maxProgress) {
      this.progress = this.maxProgress;
    }

    let displayedProgress;
    // If progress < buffer, displayedProgress is 0 (no progress.)
    if (this.progress < this.progressBuffer) {
      displayedProgress = 0;
    } else {
      // Maps the progress from new range to old range
      // [buffer, maxProgress] -> [0, maxProgress]
      displayedProgress = mapValue(
        this.progress,
        this.progressBuffer,
        this.maxProgress,
        0,
        this.maxProgress
      );
    }

    idleProgressBar.style.width = `${getProgressPercentage2(
      displayedProgress,
      this.maxProgress
    )}%`;
  }
}

function onUserActivity() {
  let tracker = activityTracker.instance;
  // Abandons the previous timeout.
  clearTimeout(tracker.idleTimeout);
  // Sets a new idle timeout
  tracker.lastTimeoutTimestamp = Date.now();
  tracker.idleTimeout = setTimeout(() => {
    // Do something when the player is idle but STILL on the page, (this is our INTENT)
    // because requestAnimationFrame() depends on HTML repaints.
    requestAnimationFrame(scrollInfoBoard);
    tracker.idleTimeout = -1;
  }, tracker.maxProgress * 1000);
}

// Tracks if the user is holding a mouse button.
let isMouseDown = false;
document.addEventListener("mousedown", function () {
  isMouseDown = true;
});

document.addEventListener("mouseup", function () {
  isMouseDown = false;
});

// Holding the mouse counts as a user activity.
setInterval((e) => {
  if (isMouseDown) onUserActivity();
}, 100);
document.addEventListener("click", onUserActivity);
document.addEventListener("mousemove", onUserActivity);
document.addEventListener("keydown", onUserActivity);
document.addEventListener("wheel", onUserActivity);
document.addEventListener("keydown", onUserActivity);
