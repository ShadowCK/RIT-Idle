declare namespace DOMExtension {
  // * Order DOES matter.
  type EventListenerList = EventListenerOrEventListenerObject[];
  type AllEventListeners = { [type: string]: EventListenerList };

  /** Any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree. */
  declare interface Document extends globalThis.Document {
    /**
     * Creates an HTMLElement with defiend `attribtues` and `properties`.
     * This saves the headache to add them one by one.
     * @param tagName The name of an element.
     * @param attributes Object literal storing the entries for attributes.
     * @param properties Object literal storing the entries for properties.
     * @param options See {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement}
     */
    createElement(
      tagName: string,
      attributes?: { [attributeName: string]: string },
      properties?: { [propertyName: string]: any },
      options?: ElementCreationOptions
    ): HTMLElement;
  }

  /** EventTarget is a DOM interface implemented by objects that can receive events and may have listeners for them. */
  declare interface EventTarget extends globalThis.EventTarget {
    /**
     * Chainable version of original `addEventListener` and keeps track of all added event listeners.
     * @param type
     * @param listener Callback function to execute on event
     * @param options
     * @returns this
     */
    addEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean
    ): EventTarget;
    /**
     * Gets the array for the event listeners of target type or the entire dictionary if `type` is invalid.
     * @param type Type of the event listeners
     * ! Do not write to the returned object
     */
    getEventListeners(type: string): NonNullable<AllEventListeners> | NonNullable<EventListenerList>;
    /**
     * @param type Type of the event listeners
     * @returns Whether the {@link globalThis.EventTarget} has been registered a listener of `type`
     */
    hasEventListener(type: string): boolean;
  }

  /** Any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it. */
  declare interface HTMLElement extends globalThis.HTMLElement, DOMExtension.EventTarget {
    /**
     * Chainable version of HTMLElement.prototype.append(nodes).
     * @param nodes
     */
    append_chain(...nodes: (Node | string)[]): HTMLElement;

    /**
     * Gets a variable from the element's dataset.
     * @param key Key for the variable
     * @returns Value of the variable
     */
    getData(key: string): string;

    /**
     * Writes a variable to the element's dataset.
     * Because the default of `value` is `""`, won't set the data to be
     * a string `"undefined"` as directly calling `this.dataset[key] = value`;
     * @param key Key for the variable
     * @param value Value of the variable
     */
    setData(key: string, value: string | any = ""): void;

    /**
     * Deletes a variable from the element's `dataset` (if it exists)
     * @param {string} key Key for the variable
     */
    removeData(key: string): void;

    /**
     * @param {string} key Key of `dataset`'s property
     * @param value If left undefined, won't check for the value.
     * @returns If the element's dataset contains a variable named as `key`, with specified value.
     */
    containsData(key: string, value: string | any);

    /**
     * Sets the inline styles together to avoid multiple statements of element.style.aaa="bbb".
     * @param styles Object literal as a map
     * @returns this
     */
    setInlineStyle(styles: Map<string, string>): HTMLElement;
  }

  /**
   * @returns The last index of an array
   */
  declare interface Array extends globalThis.Array {
    lastIndex(): number;
  }

  declare interface Object extends globalThis.Object {
    /**
     * Safe version of Object.assign().
     * If objA has a read-only property whose name is the same as objB's, it will NOT write to it.
     * @param objA
     * @param objB
     * @param ignores Ignored properties won't be assigned to `objA`.
     */
    assign_safe(objA: Object, objB: Object, ignores: string[]);
  }
}

// // * This also works, although such syntax is not regulated.
// // * Reason: because no TypeScript complier exists, declarations here only act as documentation for IntelliSense.
// // ! However, I prefer this because it directly writes documentation to the type without @type {DOMExtension.XXX}
// // ? Maybe get rid of the namespace so the codes are clearer without extra comments (though I still think it's imformal.)
// // Or not. Even if the variable is not typed by comment, when you write anyVariable.someFunction(.. it displays the .d.ts declaration.
// // Note the function declaration won't display with anyVariable.someF... , only if you've entered the ( to imply it's a function.
// // And the IntelliSense only shows up during filling the parameters. If you hover over it, no info shows up.
// // In addition, it does NOT work for a property, only functions with the same name.
// declare interface HTMLElement {
//   newProperty: string;
//   newMethod(): void;
// }
