export class AsyncEngine {
  #controller = new AbortController();
  #cleanups = [];

  constructor(start, ...args) {
    const { signal } = this.#controller;
    const track = (cleanup) => (signal.aborted ? cleanup() : this.#cleanups.push(cleanup));
    start(...args, { signal, track });
  }

  dispose() {
    this.#controller.abort();
    this.#cleanups.reverse().forEach((cleanup) => cleanup());
  }
}
