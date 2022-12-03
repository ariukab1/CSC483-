class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events.hasOwnProperty(event))
      this.events[event] = [];

    this.events[event].push(listener);
  }

  removeListener(event, listener) {
    if (!this.events.hasOwnProperty(event)) return;

    let idx = this.events[event].indexOf(listener);
    if (~idx)
      this.events[event].splice(idx, 1);
  }

  emit(event) {
    if (!this.events.hasOwnProperty(event)) return;

    for (let listener of this.events[event])
      listener(...Array.from(arguments).slice(1));
  }

  once(event, listener) {
    let self = this;
    this.on(event, function g() {
      self.removeListener(event, g);
      listener(...Array.from(arguments));
    });
  }
}