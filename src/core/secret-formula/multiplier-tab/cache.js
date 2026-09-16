// The breakdown tab starts a new generation before its child components update.
// Values are shared across the tree and remain available during Vue rendering.
let updateId = 0;

export function beginBreakdownUpdate() {
  updateId++;
}

export function getBreakdownUpdateId() {
  return updateId;
}

export function memoizeBreakdown(getValue) {
  let cachedId = -1;
  let value;
  return () => {
    if (cachedId !== updateId) {
      value = getValue();
      cachedId = updateId;
    }
    return value;
  };
}
