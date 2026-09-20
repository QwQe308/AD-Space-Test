import { DC } from "../../../constants";
import { GameMechanicState } from "../../../game-mechanics/game-mechanic";

import { futureEmpowerConfig } from "./future-empower-config";

export class FutureEmpowerOrbState extends GameMechanicState {
  constructor(config) {
    super(config);
    this.costScale = new ExponentialCostScaling(config.costScaling);
  }

  get data() {
    return player.empowers.future.orbs[this.id];
  }

  get name() { return this.config.name; }
  get symbol() { return this.config.symbol; }
  get color() { return this.config.color; }
  get description() { return this.config.description; }
  get bonusDescription() { return this.config.bonusDescription; }
  get isCustomEffect() { return true; }
  get effectValue() { return this.config.effect(this.level); }
  get isEffectActive() { return this.level.gt(0); }
  get level() { return this.data.level; }
  get isUnlocked() { return this.config.isUnlocked(); }
  get isSelected() { return FutureEmpower.selectedOrb.id === this.id; }
  get resourceAmount() { return this.config.resource(); }
  get requirement() { return this.costScale.calculateCost(this.level); }

  // Thresholds are checked against the same resource amount, never a running cost sum.
  get bulkLevels() {
    if (!this.isUnlocked || this.resourceAmount.lt(this.requirement)) return DC.D0;
    const amount = this.resourceAmount;
    const bought = this.costScale.getMaxBought(this.level, amount, DC.D1);
    let target = this.level.add(bought?.quantity ?? DC.D0);
    // Correct logarithm rounding at exact boundaries without looping through earned levels.
    if (target.gt(this.level) && this.costScale.calculateCost(target.sub(1)).gt(amount)) target = target.sub(1);
    if (target.add(1).gt(target) && this.costScale.calculateCost(target).lte(amount)) target = target.add(1);
    return target.sub(this.level).max(0);
  }

  get nextRequirement() {
    return this.costScale.calculateCost(this.level.add(this.bulkLevels));
  }

  get satelliteCount() {
    return this.bulkLevels.min(futureEmpowerConfig.satellites.capacity).toNumber();
  }

  // Completed layers stay dimmed while the next unearned threshold fills above them.
  get percentage() {
    if (!this.isUnlocked) return 0;
    return this.resourceAmount.div(this.nextRequirement).clamp(0, 1).toNumber();
  }

  get fillStyle() {
    return { clipPath: `inset(${(1 - this.percentage) * 100}% 0 0)` };
  }

  get canUpgrade() {
    return this.bulkLevels.gt(0);
  }

  select() {
    return FutureEmpower.selectOrb(this.id);
  }

  upgrade() {
    const count = this.bulkLevels;
    if (count.lte(0)) return false;
    // A reset must also clear a resource frozen by Past Empower; it is not a currency purchase.
    this.config.resetResource();
    this.data.level = this.level.add(count);
    return true;
  }
}

export const FutureEmpowerOrbs = mapGameDataToObject(
  futureEmpowerConfig.orbs,
  config => new FutureEmpowerOrbState(config)
);

export class FutureEmpowerClass {
  get data() { return player.empowers.future; }
  get orbs() { return FutureEmpowerOrbs.all; }

  get selectedOrb() {
    return this.orbs.find(orb => orb.id === this.data.selectedOrb) ?? FutureEmpowerOrbs[futureEmpowerConfig.defaultOrb];
  }

  get orbitingOrbs() {
    return this.orbs.filter(orb => orb !== this.selectedOrb);
  }

  // Selection only changes the center; upgrading is a separate action.
  selectOrb(id) {
    if (!this.orbs.some(orb => orb.id === id)) return false;
    this.data.selectedOrb = id;
    return true;
  }

  // Coordinates are relative to the center. Feed elapsed real milliseconds from the UI;
  // animation does not depend on game speed and does not mutate or bloat save data.
  orbitLayout(elapsedMs = 0) {
    const { radius, period } = futureEmpowerConfig.orbit;
    const elapsed = Number.isFinite(elapsedMs) ? elapsedMs : 0;
    const phase = ((elapsed % period) / period) * 2 * Math.PI;
    const orbiting = this.orbitingOrbs;
    return [
      { id: this.selectedOrb.id, isCenter: true, x: 0, y: 0 },
      ...orbiting.map((orb, index) => {
        const angle = phase + index * 2 * Math.PI / orbiting.length;
        return { id: orb.id, isCenter: false, x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
      }),
    ];
  }
}

export const FutureEmpower = new FutureEmpowerClass();
