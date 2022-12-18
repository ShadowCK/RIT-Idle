const popups = [];

function createPopUp(
  parentElement,
  message,
  duration,
  offset,
  direction,
  speed
) {
  let index = popups.length;
  let popup = new PopUp(
    index,
    parentElement,
    message,
    duration,
    offset,
    direction,
    speed
  );
  popups.push(popup);

  return popup;
}

/**
 * a pop-up message with a HTML Element parent.
 */
class PopUp {
  constructor(
    index,
    parentElement,
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
    let element = document.createElement("div");
    element.classList.add("popup");

    // This is the centered text
    let p = document.createElement("p");
    p.classList.add("text");
    p.innerHTML = message;
    element.appendChild(p);
    this.textChild = p;

    this.parentElement.appendChild(element);
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
   */
  markAsImportant() {
    this.selfElement.classList.add("important");
  }
}
