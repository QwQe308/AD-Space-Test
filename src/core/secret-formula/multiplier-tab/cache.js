import { ReadOnlySnapshot } from "../../read-only-snapshot";

// The breakdown tab starts a new generation before its child components update.
// Values are shared across the tree and remain available during Vue rendering.
let updateId = 0;
let snapshot = new ReadOnlySnapshot();

export function beginBreakdownUpdate() {
  updateId++;
  snapshot = new ReadOnlySnapshot();
}

export function getBreakdownUpdateId() {
  return updateId;
}

export function memoizeBreakdown(getValue) {
  let cachedId = -1;
  let value;
  return () => {
    if (cachedId !== updateId) {
      value = snapshot.run(getValue);
      cachedId = updateId;
    }
    return value;
  };
}
