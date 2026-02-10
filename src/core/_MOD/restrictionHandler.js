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
    super(config);
    this._config.checkCompletionOnEvent = config.checkCompletionOnEvent ?? GAME_EVENT.GAME_TICK_AFTER;
    this._config.triggerOnCompletionChange = config.triggerOnCompletionChange;

    if (!player.restrictions[this.id]) this.initialize();

    this.registerEvents(this.checkCompletionOnEvent, () => this.checkCompletionState(true));
  }

  get type(){
    return "normal"
  }

  get description() {
    return this.config.description();
  }

  get completed() {
    return this.data.completion;
  }

  get defaultData() {
    return {
      completion: false,
    };
  }

  get data() {
    console.error("No data place is defined in restriction handler!");
  }

  checkCompletionState(auto = false) {
    let currentCompletion = this.config.requirement();
    if (currentCompletion !== this.data.completion) this.onCompletionChange(currentCompletion);
  }

  initialize() {
    this.data = this.defaultData;
  }

  onCompletionChange(state) {
    this.data.completion = state;
    if(this.triggerOnCompletionChange) this.triggerOnCompletionChange(state);
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
 * @param config.defaultCompletable **Optional** Decides if it starts as completable before first reset event. Default as true.
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
    if(!config.requirement) config.requirement = () => true;

    super(config);
    this._config.defaultCompletable = config.defaultCompletable ?? true;
    this._config.checkFailOnEvent = config.checkFailOnEvent ?? GAME_EVENT.GAME_TICK_AFTER;
    this._config.noCheckOnCompletion = config.noCheckOnCompletion;

    this.registerEvents(this.config.checkFailOnEvent, () => {
      this.data.stillCompletable &&= this.config.completable();
    });

    this.registerEvents(this.config.resetOnEvent, () => {
      this.data.stillCompletable = true;
    });
  }

  get type(){
    return "failable"
  }

  checkCompletionState(auto = false) {
    let completion = this.data.stillCompletable && this.requirement();
    if (completion !== this.completion) this.onCompletionChange(completion);
  }

  get defaultData() {
    return {
      stillCompletable: this.config.defaultCompletable,
      completion: false,
    };
  }
}
