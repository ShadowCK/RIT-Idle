// Everything was moved into separate .js files.
// Only shared functions should go here.

function getProgressPercentage() {
  return (this.progress / this.maxProgress) * 100;
}

function getProgressPercentage2(progress, maxProgress) {
  return (progress / maxProgress) * 100;
}
