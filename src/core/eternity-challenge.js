import { DC } from "./constants";
import { deepmergeAll } from "@/utility/deepmerge";
import { GameMechanicState } from "./game-mechanics";

export function startEternityChallenge() {
  initializeChallengeCompletions();
  initializeResourcesAfterEternity();
  resetInfinityRuns();
  InfinityDimensions.fullReset();
  Replicanti.reset();
  resetChallengeStuff();
  AntimatterDimensions.reset();
  player.replicanti.galaxies = DC.D0;
  Currency.infinityPoints.reset();
  InfinityDimensions.resetAmount();
  player.records.bestInfinity.bestIPminEternity = DC.D0;
  player.records.thisEternity.bestEPmin = DC.D0;
  resetTimeDimensions();
  resetTickspeed();
  player.records.thisInfinity.maxAM = DC.D0;
  player.records.thisEternity.maxAM = DC.D0;
  Currency.antimatter.reset();
  playerInfinityUpgradesOnReset();
  AchievementTimers.marathon2.reset();
  ECTimeStudyState.invalidateCachedRequirements();
}

class EternityChallengeRewardState extends GameMechanicState {
  constructor(config, challenge) {
    const effect = config.effect;
    const configCopy = deepmergeAll([{}, config]);
    configCopy.effect = () => effect(challenge.completions);
    super(configCopy);
    this._challenge = challenge;
  }

  get isEffectActive() {
    return this._challenge.isAvailable && this._challenge.completions > 0;
  }
}

function isAbyssEternityChallengeMode() {
  return !player.options.breakPlaceHolder && Boolean(TimeStudy(111).isBought);
}

export class EternityChallengeState extends GameMechanicState {
  constructor(config, isAbyss = false) {
    super(config);
    this._isAbyss = isAbyss;
    this._fullId = `${isAbyss ? "abyssE" : "e"}terc${this.id}`;
    this._reward = new EternityChallengeRewardState(config.reward, this);
  }

  get type() {
    return this._isAbyss ? "abyss" : "normal";
  }

  get isAvailable() {
    return this._isAbyss === isAbyssEternityChallengeMode();
  }

  get fullId() {
    return this._fullId;
  }

  get isUnlocked() {
    return this.isAvailable && player.challenge.eternity.unlocked === this.id &&
      (player.challenge.eternity.unlockedType ?? "normal") === this.type;
  }

  get isRunning() {
    return this.isAvailable && player.challenge.eternity.current === this.id &&
      (player.challenge.eternity.currentType ?? "normal") === this.type;
  }

  get isEffectActive() {
    return this.isRunning;
  }

  get hasUnlocked() {
    const unlocked = this._isAbyss ? player.reality.unlockedAbyssEC ?? 0 : player.reality.unlockedEC;
    return this.isAvailable && (unlocked & (1 << this.id)) !== 0;
  }

  set hasUnlocked(value) {
    if (!value) return;
    if (this._isAbyss) player.reality.unlockedAbyssEC = (player.reality.unlockedAbyssEC ?? 0) | (1 << this.id);
    else player.reality.unlockedEC |= (1 << this.id);
  }

  unlock() {
    player.challenge.eternity.unlocked = this.id;
    player.challenge.eternity.unlockedType = this.type;
  }

  get wasRequirementPreviouslyMet() {
    const bits = this._isAbyss
      ? player.challenge.eternity.abyssRequirementBits ?? 0
      : player.challenge.eternity.requirementBits;
    return (bits & (1 << this.id)) !== 0;
  }

  markRequirementMet() {
    if (this._isAbyss) {
      player.challenge.eternity.abyssRequirementBits =
        (player.challenge.eternity.abyssRequirementBits ?? 0) | (1 << this.id);
    } else {
      player.challenge.eternity.requirementBits |= 1 << this.id;
    }
  }

  clearRequirement() {
    if (this._isAbyss) {
      player.challenge.eternity.abyssRequirementBits &= ~(1 << this.id);
    } else {
      player.challenge.eternity.requirementBits &= ~(1 << this.id);
    }
  }

  get completions() {
    const completions = player.eternityChalls[this.fullId];
    return completions === undefined ? 0 : completions;
  }

  set completions(value) {
    player.eternityChalls[this.fullId] = Math.min(value, this.maxCompletions);
  }

  get maxCompletions() {
    return Enslaved.isRunning && this.id === 1 ? 1000 : 5;
  }

  get remainingCompletions() {
    return this.maxCompletions - this.completions;
  }

  get isFullyCompleted() {
    return this.completions === this.maxCompletions;
  }

  get maxValidCompletions() {
    if (this.id !== 4 && this.id !== 12) return this.maxCompletions;
    let completions = this.completions;
    while (completions < this.maxCompletions && this.isWithinRestrictionAtCompletions(completions)) {
      completions++;
    }
    return completions;
  }

  get gainedCompletionStatus() {
    const status = {
      gainedCompletions: 0,
      hasMoreCompletions: false,
      totalCompletions: this.completions,
    };
    if (this.isFullyCompleted) return status;
    if (!Perk.studyECBulk.isBought) {
      if (this.canBeCompleted) {
        ++status.totalCompletions;
        status.gainedCompletions = 1;
      }
      return status;
    }

    let totalCompletions = this.completionsAtIP(player.records.thisEternity.maxIP);
    const maxValidCompletions = this.maxValidCompletions;
    if (totalCompletions > maxValidCompletions) {
      totalCompletions = maxValidCompletions;
      status.failedRestriction = this.config.failedRestriction;
    }
    status.totalCompletions = totalCompletions;
    status.gainedCompletions = totalCompletions - this.completions;
    status.hasMoreCompletions = this.completions + status.gainedCompletions < this.maxCompletions;
    status.nextGoalAt = this.goalAtCompletions(status.totalCompletions);
    return status;
  }

  get initialGoal() {
    if (Pelle.isDoomed && this.config.pelleGoal) {
      return this.config.pelleGoal;
    }
    return this.config.goal;
  }

  get goalIncrease() {
    if (Pelle.isDoomed && this.config.pelleGoalIncrease) {
      return this.config.pelleGoalIncrease;
    }
    return this.config.goalIncrease;
  }

  get currentGoal() {
    return this.goalAtCompletions(this.completions);
  }

  get isGoalReached() {
    return player.records.thisEternity.maxIP.gte(this.currentGoal);
  }

  get canBeCompleted() {
    return this.isGoalReached && this.isWithinRestriction;
  }

  goalAtCompletions(completions) {
    return completions > 0
      ? this.initialGoal.times(this.goalIncrease.pow(Math.min(completions, this.maxCompletions - 1)))
      : this.initialGoal;
  }

  completionsAtIP(ip) {
    if (ip.lt(this.initialGoal)) return 0;
    const completions = (ip.dividedBy(this.initialGoal)).max(1).log10().div(this.goalIncrease.max(1).log10()).add(1);
    return Decimal.min(Decimal.floor(completions), this.maxCompletions).toNumber();
  }

  addCompletion(auto = false) {
    this.completions++;
    if ((this.id === 4 || this.id === 12) && auto) {
      this.tryFail(true);
    }
    if (this.id === 6) {
      GameCache.dimensionMultDecrease.invalidate();
    }
    if (this.id === 11) {
      GameCache.tickSpeedMultDecrease.invalidate();
    }
  }

  requestStart() {
    if (!Tab.challenges.eternity.isUnlocked || this.isRunning) return;
    if (GameEnd.creditsEverClosed) return;
    if (!player.options.confirmations.challenges) {
      this.start();
      return;
    }
    if (this.isUnlocked) Modal.startEternityChallenge.show(this.id);
  }

  start(auto) {
    if (EternityChallenges.isRunning) return false;
    if (!this.isUnlocked) return false;
    const maxInversion = player.requirementChecks.reality.slowestBH.lte(1e-300);
    if (this.id === 12 && ImaginaryUpgrade(24).isLockingMechanics && Ra.isRunning && maxInversion) {
      if (!auto) ImaginaryUpgrade(24).tryShowWarningModal("enter Eternity Challenge 12");
      return false;
    }
    if (this.id === 7 && ImaginaryUpgrade(15).isLockingMechanics && TimeDimension(1).amount.gt(0)) {
      if (!auto) ImaginaryUpgrade(15).tryShowWarningModal("enter Eternity Challenge 7");
      return false;
    }

    // If dilation is active, the { enteringEC: true } parameter will cause
    // dilation to not be disabled. We still don't force-eternity, though;
    // this causes TP to still be gained.
    const enteringGamespeed = getGameSpeedupFactor();
    if (Player.canEternity) eternity(false, auto, { enteringEC: true });
    player.challenge.eternity.current = this.id;
    player.challenge.eternity.currentType = this.type;
    if (this.id === 12) {
      if (enteringGamespeed.lt(1e-3)) SecretAchievement(42).unlock();
      player.requirementChecks.reality.slowestBH = DC.D1;
    }
    if (Enslaved.isRunning) {
      if (this.id === 6 && this.completions === 5) EnslavedProgress.ec6.giveProgress();
      if (!auto && EnslavedProgress.challengeCombo.hasProgress) Tab.challenges.normal.show();
    }
    startEternityChallenge();
    return true;
  }

  /**
   * @return {EternityChallengeRewardState}
   */
  get reward() {
    return this._reward;
  }

  get isWithinRestriction() {
    return this.isWithinRestrictionAtCompletions(this.completions);
  }

  isWithinRestrictionAtCompletions(completions) {
    return this.config.restriction === undefined ||
      this.config.checkRestriction(this.config.restriction(completions));
  }

  exit(isRestarting) {
    if (Player.isInAntimatterChallenge) {
      Player.antimatterChallenge.exit();
    }
    player.challenge.eternity.current = 0;
    player.challenge.eternity.currentType = "normal";
    if (!isRestarting) player.respec = true;
    eternity(true);
  }

  fail(auto = false) {
    this.exit(false);
    let reason;
    if (auto) {
      if (this.id === 4) {
        reason = restriction => `Auto Eternity Challenge completion completed ` +
        `Eternity Challenge ${this.id} and made the next tier ` +
        `require having less Infinities (${quantifyInt("Infinity", restriction)} ` +
        `or less) than you had`;
      } else if (this.id === 12) {
        reason = restriction => `Auto Eternity Challenge completion completed ` +
        `Eternity Challenge ${this.id} and made the next tier ` +
        `require spending less time in it (${quantify("in-game second", restriction, 0, 1)} ` +
        `or less) than you had spent`;
      }
    } else if (this.id === 4) {
      reason = restriction => `You failed Eternity Challenge ${this.id} due to ` +
      `having more than ${quantifyInt("Infinity", restriction)}`;
    } else if (this.id === 12) {
      reason = restriction => `You failed Eternity Challenge ${this.id} due to ` +
      `spending more than ${quantify("in-game second", restriction, 0, 1)} in it`;
    }
    Modal.message.show(`${reason(this.config.restriction(this.completions))}, ` +
    `which has caused you to exit it.`,
    { closeEvent: GAME_EVENT.REALITY_RESET_AFTER }, 1);
    EventHub.dispatch(GAME_EVENT.CHALLENGE_FAILED);
  }

  tryFail(auto = false) {
    if (this.isRunning && !this.isWithinRestriction) {
      this.fail(auto);
      return true;
    }
    return false;
  }
}

/**
 * @param id
 * @return {EternityChallengeState}
 */
export const EternityChallenge = EternityChallengeState.createAccessor(GameDatabase.challenges.eternity);
const abyssEternityChallengeIndex = mapGameData(
  GameDatabase.challenges.abyssEternity,
  config => new EternityChallengeState(config, true)
);
export const AbyssEternityChallenge = id => abyssEternityChallengeIndex[id];
AbyssEternityChallenge.index = abyssEternityChallengeIndex;

function currentChallenge(accessor) {
  if (player.challenge.eternity.current === 0) return undefined;
  const challenge = accessor(player.challenge.eternity.current);
  return challenge?.isRunning ? challenge : undefined;
}

/**
 * @returns {EternityChallengeState}
 */
Object.defineProperty(EternityChallenge, "current", {
  get: () => currentChallenge(EternityChallenge),
});

Object.defineProperty(EternityChallenge, "isRunning", {
  get: () => EternityChallenge.current !== undefined,
});

Object.defineProperty(AbyssEternityChallenge, "current", {
  get: () => currentChallenge(AbyssEternityChallenge),
});

Object.defineProperty(AbyssEternityChallenge, "isRunning", {
  get: () => AbyssEternityChallenge.current !== undefined,
});

export const EternityChallenges = {
  get isAbyssMode() {
    return isAbyssEternityChallengeMode();
  },

  forStudy(id) {
    const abyssChallenge = AbyssEternityChallenge(id);
    return abyssChallenge?.isAvailable ? abyssChallenge : EternityChallenge(id);
  },

  get current() {
    return AbyssEternityChallenge.current ?? EternityChallenge.current;
  },

  get isRunning() {
    return this.current !== undefined;
  },

  /**
   * @type {EternityChallengeState[]}
   */
  get all() {
    return (this.isAbyssMode ? AbyssEternityChallenge.index : EternityChallenge.index).compact();
  },

  get completions() {
    return EternityChallenges.all
      .map(ec => ec.completions)
      .nSum();
  },

  get maxCompletions() {
    return EternityChallenges.all
      .map(ec => ec.maxCompletions)
      .nSum();
  },

  get remainingCompletions() {
    return EternityChallenges.all
      .map(ec => ec.remainingCompletions)
      .nSum();
  },

  autoComplete: {
    tick() {
      const shouldPreventEC7 = TimeDimension(1).amount.gt(0);
      const hasUpgradeLock = RealityUpgrade(12).isLockingMechanics ||
        (ImaginaryUpgrade(15).isLockingMechanics && shouldPreventEC7 &&
          !Array.range(1, 6).some(ec => !EternityChallenge(ec).isFullyCompleted));
      if (!player.reality.autoEC || Pelle.isDisabled("autoec") || hasUpgradeLock) {
        player.reality.lastAutoEC = Decimal.clampMax(player.reality.lastAutoEC, this.interval);
        return;
      }
      if (Ra.unlocks.instantECAndRealityUpgradeAutobuyers.canBeApplied) {
        let next = this.nextChallenge;
        while (next !== undefined) {
          while (!next.isFullyCompleted) {
            next.addCompletion(true);
          }
          next = this.nextChallenge;
          if (ImaginaryUpgrade(15).isLockingMechanics && next?.id === 7 && shouldPreventEC7) break;
        }
        return;
      }
      const interval = this.interval;
      let next = this.nextChallenge;
      while (player.reality.lastAutoEC.sub(interval).gt(0) && next !== undefined) {
        player.reality.lastAutoEC = player.reality.lastAutoEC.sub(interval);
        next.addCompletion(true);
        next = this.nextChallenge;
      }
      player.reality.lastAutoEC = player.reality.lastAutoEC.mod(interval);
    },

    get nextChallenge() {
      return EternityChallenges.all.find(ec => !ec.isFullyCompleted);
    },

    get interval() {
      if (!Perk.autocompleteEC1.canBeApplied) return DC.BEMAX;
      let minutes = Effects.min(
        Number.MAX_VALUE,
        Perk.autocompleteEC1,
        Perk.autocompleteEC2,
        Perk.autocompleteEC3
      );
      minutes = minutes.div(VUnlocks.fastAutoEC.effectOrDefault(1));
      return TimeSpan.fromMinutes(minutes).totalMilliseconds;
    }
  }
};
