// Smooth adjacent samples; the bar's transform transition handles interpolation between UI updates.
const MAX_DATA_POINTS = 3;

export class PercentageRollingAverage {
  constructor() {
    this.clear();
  }

  add(dataPoint) {
    if (dataPoint && dataPoint.length !== this.totals.length) {
      this.clear();
      this.totals = Array(dataPoint.length).fill(0);
    }
    const previous = this.dataPoints[this.nextIndex];
    if (previous) {
      for (let i = 0; i < previous.length; i++) this.totals[i] -= previous[i];
      this.count--;
    }
    this.dataPoints[this.nextIndex] = dataPoint;
    if (dataPoint) {
      for (let i = 0; i < dataPoint.length; i++) this.totals[i] += dataPoint[i];
      this.count++;
    }
    this.nextIndex = (this.nextIndex + 1) % MAX_DATA_POINTS;

    // Periodically rebuild the sums to keep subtraction rounding errors from accumulating.
    if (this.nextIndex === 0 || this.count === 0) {
      this.totals.fill(0);
      for (const point of this.dataPoints) {
        if (!point) continue;
        for (let i = 0; i < point.length; i++) this.totals[i] += point[i];
      }
    }
  }

  get average() {
    return this.count === 0 ? [] : this.totals.map(total => total / this.count);
  }

  clear() {
    this.dataPoints = Array(MAX_DATA_POINTS);
    this.totals = [];
    this.nextIndex = 0;
    this.count = 0;
  }
}
