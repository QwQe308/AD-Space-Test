import { DEV } from "../../env";
import { GameMechanicState } from "../game-mechanics/game-mechanic";

/**
 * @class Defines a restriction, for sth like unfailable achievements.
 * This mostly bases on current sitution. For sth basing on "no ___ this eternity", use FailableRestriction instead.
 * @param config.description **Optional** A function, returns the restrictions' info.
 * @param config.requirement A function, returns if the restriction is completed (if not failed).
 * @param config.checkCompletionOnEvent **Optional** Decides when to check completion.
 * Default as GAME_TICK_AFTER.
 * @param config.triggerOnCompletionChange *Optional* A function that will be triggered on completion state changes.
 * Has 1 input: Completion state.
 */
export class Restriction extends GameMechanicState {
  constructor(config) {
    if (DEV) {
      if (!config) throw ("Error in restriction: No config found.", config);
      if (!config.requirement) throw ("Error in restriction: No config.requirement defined.", config);
    }

    super(config);
    this._config.checkCompletionOnEvent = config.checkCompletionOnEvent ?? GAME_EVENT.GAME_TICK_AFTER;
    this._config.triggerOnCompletionChange = config.triggerOnCompletionChange;

    this.registerEvents(this._config.checkCompletionOnEvent, () => this.checkCompletionState(true));
  }

  get type() {
    return "normal";
  }

  get completed() {
    return this.data.completion;
  }

  get data() {
    console.error("No data place is defined in restriction handler on getter!");
  }

  description(x) {
    return this.config.description(x);
  }

  checkCompletionState(auto = false) {
    const currentCompletion = this.config.requirement();
    if (currentCompletion !== this.data.completion) this.onCompletionChange(currentCompletion);
  }

  onCompletionChange(state) {
    this.data.completion = state;
    if (this.triggerOnCompletionChange) this.triggerOnCompletionChange(state);
  }
}

/**
 * @class Defines a failable restriction, for sth like reality upgrades' requirements or so
 * @param config.description **Optional** A function, returns the restrictions' info.
 * @param config.requirement A function, returns if the restriction is completed (if not failed).
 * @param config.completable A function, returns if the restriction is still completable.
 * (Or you can call it "is restriction not failed")
 * Will be automatically recorded once it returns false.
 * @param config.resetOnEvent A GameEvent, decides when it can be retryed.
 * @param config.checkFailOnEvent **Optional** Decides when to check failure. Best for situations like "no manual infinities" or so.
 * Default as GAME_TICK_AFTER.
 * @param config.checkCompletionOnEvent **Optional** Decides when to check completion.
 * Default as GAME_TICK_AFTER.
 * @param config.triggerOnCompletionChange *Optional* A function that will be triggered on completion state changes.
 * @param config.noCheckOnCompletion **Optional** Decides whether to check failure on checking completion (if manually called).
 * This won't be recorded even it checked as failure, just to prevent wrong completion mid-tick.
 * You can safely disable it if you setted checkFailOnEvent.
 * Default as false.
 */
export class FailableRestriction extends Restriction {
  constructor(config) {
    if (DEV) {
      if (!config) throw ("Error in failable restriction: No config found.", config);
      if (!config.completable) throw ("Error in failable restriction: No config.completable found.", config);
      if (!config.resetOnEvent) throw ("Error in failable restriction: No config.resetOnEvent found.", config);
    }

    if (!config.requirement) config.requirement = () => true;

    super(config);

    this._config.defaultCompletable = config.defaultCompletable ?? true;
    this._config.checkFailOnEvent = config.checkFailOnEvent ?? GAME_EVENT.GAME_TICK_AFTER;
    this._config.noCheckOnCompletion = config.noCheckOnCompletion;

    this.registerEvents(this._config.checkFailOnEvent, () => {
      this.data.stillCompletable &&= this.config.completable();
    });

    this.registerEvents(this._config.resetOnEvent, () => {
      this.data.stillCompletable = true;
    });
  }

  get type() {
    return "failable";
  }

  checkCompletionState(auto = false) {
    const completion = this.data.stillCompletable && this.config.requirement();
    if (completion !== this.completion) this.onCompletionChange(completion);
  }
}

export const RestrictionDefaultData = {
  defaultRestriction: {
    completion: false,
  },
  failableRestriction: {
    stillCompletable: true,
    completion: false,
  },
  uncompletableFailableRestriction: {
    stillCompletable: false,
    completion: false,
  },
};