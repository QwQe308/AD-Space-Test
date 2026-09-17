let activeValues;

// A caller owns the lifetime of a snapshot. Only synchronous, read-only work may run inside it;
// simulation and purchases outside run() always use the original getters and current game state.
export class ReadOnlySnapshot {
  constructor() {
    this.values = new WeakMap();
  }

  run(read) {
    const previous = activeValues;
    activeValues = this.values;
    try {
      return read();
    } finally {
      activeValues = previous;
    }
  }
}

function snapshotGetter(read) {
  return {
    get() {
      if (!activeValues) return read.call(this);
      let values = activeValues.get(this);
      if (!values) {
        values = new Map();
        activeValues.set(this, values);
      }
      if (!values.has(read)) values.set(read, read.call(this));
      return values.get(read);
    }
  }.get;
}

export function cacheSnapshotGetters(target, properties) {
  for (const property of properties) {
    const descriptor = Object.getOwnPropertyDescriptor(target, property);
    Object.defineProperty(target, property, {
      ...descriptor,
      get: snapshotGetter(descriptor.get)
    });
  }
}
