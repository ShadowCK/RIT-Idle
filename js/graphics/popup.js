const popups = [];
let currentPopupOverlay;

/**
 * a pop-up message with a HTML Element parent.
 */
class PopUp {
  constructor(
    index,
    parentElement = currentPopupOverlay,
    message = "Unknown",
    duration = 1,
    offset = { x: 0, y: 0 },
    direction = { x: 0, y: -1 }, // -1 is upward
    speed = Math.random() * 5
  ) {
    this.parentElement = parentElement;
    this.message = message;
    this.timer = 0;
    this.duration = duration;
    this.index = index;
    this.direction = direction;
    this.speed = speed;
    this.offset = offset;

    // Creates an HTML element for this popup.
    // This is the frame for text layout
    let element = document.createElement("div", { class: "popup" });

    // This is the centered text
    let p = document.createElement("p", { class: "text" }, { innerHTML: message });
    this.textChild = p;

    this.parentElement.append(element.append_chain(p));
    this.selfElement = element;
    // Initial translate
    this.selfElement.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px)`;
  }

  /**
   * Updates popup. Should be called in gameLoop.
   */
  update() {
    this.timer += deltaTime;
    // Removes the popup when exceeds duration, both frontend and backend
    if (this.timer > this.duration) {
      this.parentElement.removeChild(this.selfElement);
      popups.splice(this.index, 1);
      popups.filter((e) => e.index > this.index).map((e) => e.index--);
    }

    this.selfElement.style.opacity = `${1 - this.timer / this.duration}`;
    this.move();
  }

  /**
   * Moves the popup in its direction to create animated visual representation.
   */
  move() {
    this.offset.x += this.speed * this.direction.x * deltaTime;
    this.offset.y += this.speed * this.direction.y * deltaTime;
    this.selfElement.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px)`;
  }

  /**
   * Has a different visualization if important.
   * @deprecated Use addTag() which is more general.
   */
  markAsImportant() {
    this.selfElement.classList.add("important");
    return this;
  }

  /**
   * Adds a class to the popup element
   * @param {string} tag HTML class name
   */
  addTag(tag) {
    this.selfElement.classList.add(tag);
    return this;
  }
}

function createPopUp(parentElement = currentPopupOverlay, message, duration, offset, direction, speed) {
  let index = popups.length;
  let popup = new PopUp(index, parentElement, message, duration, offset, direction, speed);
  popups.push(popup);

  return popup;
}

let messageType = { normal: "normal", important: "important", error: "error", warning: "warning" };

// A bunch of wrapper functions of createPop
function sendMessage(
  type = messageType.normal,
  message = "Unkown",
  duration = 1,
  offset = undefined,
  direction = undefined,
  speed = 10
) {
  switch (type) {
    case messageType.normal:
      createPopUp(currentPopupOverlay, message, duration, offset, direction, speed);
      break;
    case messageType.important:
      createPopUp(currentPopupOverlay, message, duration, offset, direction, speed).addTag("important");
      break;
    case messageType.error:
      createPopUp(currentPopupOverlay, message, duration, offset, direction, speed).addTag("important").addTag("error");
      SFX_error.play();
      break;
  }
}

function sendError(message = "Unkown", duration = 3, offset = undefined, direction = undefined, speed = 10) {
  sendMessage(messageType.error, message, duration, offset, direction, speed);
}
