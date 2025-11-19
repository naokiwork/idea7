class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: new LocalStorageMock(),
    configurable: true,
  });

  if (!window.crypto || !window.crypto.randomUUID) {
    Object.defineProperty(window, "crypto", {
      value: {
        randomUUID: () => `test-${Math.random().toString(36).slice(2)}`,
      },
      configurable: true,
    });
  }
});
