import { Currency } from "../../../currency";
import { DC } from "../../../constants";
import { GameMechanicState } from "../../../game-mechanics/game-mechanic";

import { futureEmpowerConfig } from "./future-empower-config";

export class FutureEmpowerOrbState extends GameMechanicState {
  get data() {
    return player.empowers.future.orbs[this.id];
  }

  get name() { return this.config.name; }
  get symbol() { return this.config.symbol; }
  get color() { return this.config.color; }
  get description() { return this.config.description; }
  get level() { return this.data.level; }
  get isUnlocked() { return this.config.isUnlocked(); }
  get isSelected() { return FutureEmpower.selectedOrb.id === this.id; }
  get resourceAmount() { return this.config.resource(); }
  get requirement() { return this.config.requirement(this.level); }
  get insightGain() { return this.config.insightGain(this.level); }

  // Like AbyssResearch, the fill scales from the center using a clamped 0..1 ratio.
  // Read the live resource so resets immediately update progress and eligibility.
  get percentage() {
    if (!this.isUnlocked) return 0;
    return this.resourceAmount.div(this.requirement).clamp(0, 1).toNumber();
  }

  get fillStyle() {
    return { transform: `scale(${this.percentage})` };
  }

  get canUpgrade() {
    return this.isUnlocked && this.level.add(1).gt(this.level) && this.resourceAmount.gte(this.requirement);
  }

  select() {
    return FutureEmpower.selectOrb(this.id);
  }

  upgrade() {
    if (!this.canUpgrade) return false;
    const reward = this.insightGain;
    this.data.level = this.level.add(1);
    Currency.insight.add(reward);
    return true;
  }
}

export class FutureEmpowerUpgradeState extends GameMechanicState {
  get isCustomEffect() { return true; }
  get data() { return player.empowers.future.upgrades[this.id]; }
  get name() { return this.config.name; }
  get symbol() { return this.config.symbol; }
  get description() { return this.config.description; }
  get level() { return this.data.level; }
  get maxLevel() { return this.config.maxLevel; }
  get isMaxed() { return this.level.gte(this.maxLevel); }
  get currency() { return Currency.insight; }
  get cost() { return this.config.cost(this.level); }
  get effectValue() { return this.config.effect(this.level); }
  get isEffectActive() { return this.level.gt(0); }
  get canPurchase() { return !this.isMaxed && this.currency.gte(this.cost); }
  get canDowngrade() { return this.level.gt(0); }

  get refund() {
    return this.canDowngrade ? this.config.cost(this.level.sub(1)) : DC.D0;
  }

  purchase() {
    if (!this.canPurchase) return false;
    this.currency.subtract(this.cost);
    this.data.level = this.level.add(1);
    return true;
  }

  downgrade() {
    if (!this.canDowngrade) return false;
    const refund = this.refund;
    this.data.level = this.level.sub(1);
    this.currency.add(refund);
    return true;
  }
}

export const FutureEmpowerOrbs = mapGameDataToObject(
  futureEmpowerConfig.orbs,
  config => new FutureEmpowerOrbState(config)
);

export const FutureEmpowerUpgrades = mapGameDataToObject(
  futureEmpowerConfig.upgrades,
  config => new FutureEmpowerUpgradeState(config)
);

export class FutureEmpowerClass {
  get data() { return player.empowers.future; }
  get insight() { return Currency.insight.value; }
  get orbs() { return FutureEmpowerOrbs.all; }
  get upgrades() { return FutureEmpowerUpgrades.all; }

  get selectedOrb() {
    return this.orbs.find(orb => orb.id === this.data.selectedOrb) ?? FutureEmpowerOrbs[futureEmpowerConfig.defaultOrb];
  }

  get orbitingOrbs() {
    return this.orbs.filter(orb => orb !== this.selectedOrb);
  }

  // Selection only changes the center; earning insight is a separate action.
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
