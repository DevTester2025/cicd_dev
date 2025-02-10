export default class Store<T> {
  private ns: string; // Namespace

  private state = {};

  constructor(ns: string) {
    this.ns = ns;
  }

  upsert(
    key: string,
    value:
      | string
      | number
      | string[]
      | number[]
      | Record<string, any>
      | Record<string, any>[]
  ): void {
    this.state[key] = value;
  }

  push(key: string, value: string | string[]) {
    if (this.state[key] && this.state[key].length > 0) {
      this.state[key].push(value);
    } else {
      this.state[key] = [].push(value);
    }
  }

  get<T>(key: string): T {
    return this.state[key];
  }
}
