import { GameMechanicState } from "../../game-mechanics";

class Influence extends GameMechanicState {
  constructor(config) {
    super(config);
    this.registerEvents(config.checkEvent, args => this.tryUnlock(args));
  }

  get id() {
    return this.config.id;
  }

  get name() {
    return this.config.name;
  }

  get info() {
    return this.config.info
  }

  get influenceStat(){
    return this.config.influenceStat
  }

  get isUnlocked() {
    return player.imaginaryInfluence.includes(this.id);
  }

  get isDisabled() {
    return false;
  }

  get isEffectActive() {
    return this.isUnlocked && !this.isDisabled;
  }

  tryUnlock(args) {
    if (this.isUnlocked) return;
    if (!this.config.requirement(args)) return;
    this.unlock();
  }

  unlock() {
    if (this.isUnlocked) return;
    if(this.config.tigger) this.config.tigger()
    if(!this.config.noImmediatePush) player.imaginaryInfluence.push(this.id)
    EventHub.dispatch(GAME_EVENT.INFLUENCE_TIGGERED);
  }
}

export const imaginaryInfluences = mapGameDataToObject(
  GameDatabase.imaginary.influence,
  (config) => new Influence(config)
);