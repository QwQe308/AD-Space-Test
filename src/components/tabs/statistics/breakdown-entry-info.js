import Vue from "vue";

import { getBreakdownUpdateId, memoizeBreakdown } from "@/core/secret-formula/multiplier-tab/cache";
import { DC } from "@/core/constants";

export class BreakdownEntryInfo {
  constructor(key) {
    this.key = key;
    this.lastUpdateId = -1;
    const keyArgs = this.key.split("_");
    const dbEntry = GameDatabase.multiplierTabValues[keyArgs[0]][keyArgs[1]];
    const args = keyArgs.length >= 3
      ? keyArgs.slice(2).map(a => (a.match("^\\d+$") ? Number(a) : a))
      : [];
    this._name = createGetter(dbEntry.name, args);
    this._multValue = createGetter(dbEntry.multValue, args);
    this._powValue = createGetter(dbEntry.powValue, args);
    this._dilationEffect = createGetter(dbEntry.dilationEffect, args);
    this._isActive = createGetter(dbEntry.isActive, args);
    this._fakeValue = createGetter(dbEntry.fakeValue, args);
    this._icon = createGetter(dbEntry.icon, args);
    this._displayOverride = createGetter(dbEntry.displayOverride, args);
    this._isDilated = createGetter(dbEntry.isDilated, args);
    this._isBase = createGetter(dbEntry.isBase, args);
    this._ignoresNerfPowers = createGetter(dbEntry.ignoresNerfPowers, args);
    this.data = Vue.observable({
      mult: Object.freeze(new Decimal(0)),
      pow: Object.freeze(new Decimal(1)),
      isVisible: false,
      lastVisibleAt: 0
    });
  }

  update() {
    const updateId = getBreakdownUpdateId();
    if (this.lastUpdateId === updateId) return;
    const isVisible = this.isVisible;
    const mult = isVisible ? this.mult : DC.D1;
    const pow = isVisible ? this.pow : DC.D1;
    // Observe replacement of the snapshot, not every sign/layer/magnitude access during arithmetic.
    // Copy before freezing so game state and shared effect values remain mutable.
    if (this.data.mult.neq(mult)) this.data.mult = Object.freeze(new Decimal(mult));
    if (this.data.pow.neq(pow)) this.data.pow = Object.freeze(new Decimal(pow));
    if (this.data.isVisible && !isVisible) {
      this.data.lastVisibleAt = Date.now();
    }
    this.data.isVisible = isVisible;
    this.lastUpdateId = updateId;
  }

  get name() {
    return this._name();
  }

  get mult() {
    return Decimal.fromValue_noAlloc(this._multValue() ?? DC.D1);
  }

  get pow() {
    return this._powValue() ?? DC.D1;
  }

  get dilationEffect() {
    return this._dilationEffect() ?? DC.D1;
  }

  get isActive() {
    return this._isActive() ?? false;
  }

  get fakeValue() {
    return this._fakeValue();
  }

  get icon() {
    return this._icon();
  }

  get displayOverride() {
    return this._displayOverride();
  }

  get isDilated() {
    return this._isDilated();
  }

  get isBase() {
    return this._isBase();
  }

  get ignoresNerfPowers() {
    return this._ignoresNerfPowers() ?? false;
  }

  get isVisible() {
    return this.isActive && (Decimal.neq(this.pow, 1) || this.mult.neq(1));
  }
}

function createGetter(property, args) {
  if (typeof property === "function") {
    return memoizeBreakdown(() => property(...args));
  }

  return () => property;
}

const cache = new Map();

export function createEntryInfo(key) {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const entry = new BreakdownEntryInfo(key);
  cache.set(key, entry);
  return entry;
}
