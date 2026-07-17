export class PendingEvent {
  /**
   * @param {Object} options An object containing multiple options.
   * @param {Function} options.process A function with an object input.
   *
   * {
   *
   *    data: Data for the spell.
   *
   *    extras: Any extra data for the event.
   *
   *    event: The event itself.
   *
   *    baseSpellPower: The spell power when the event is occured.
   *
   *    currentAffix: The current affix waiting to apply.
   *
   * }
   * @param {number} delay After x affixes this will be applied. The countdown occurs before each affixs' effects taking place.
   * @param {any} extras Any extra data this event requires. It will be set to anything process function returned, except undefined.
   * @param {Object} data The data of the spell.
   * @param {Decimal} baseSpellPower The spell power when the event occurs.
   */
  constructor({
    process: process,
    delay: delay,
    extras = extras,
    data: data,
    baseSpellPower: baseSpellPower = undefined,
    baseEffect: baseEffect = undefined,
  }) {
    this._process = process;
    this.delay = delay;
    this.baseDelay = delay;
    this.extras = extras;
    this.data = data;

    this.baseSpellPower = baseSpellPower ?? new Decimal(data.spellPower);
    this.baseEffect = baseEffect;
  }

  process(currentAffix) {
    const extras = this._process.call(this, {
      extras: this.extras,
      data: this.data,
      event: this,
      baseSpellPower: this.baseSpellPower,
      baseEffect: this.baseEffect,
      occured: this.occured,
      currentAffix,
    });
    if (extras !== undefined) this.extras = extras;
  }

  count(currentAffix) {
    this.delay--;
    if (this.delay === 0) {
      this.process(currentAffix);
      // Only unmount if the event did NOT re-mount itself during process()
      // (mount() resets this.delay to a positive value)
      if (this.delay <= 0) this.unmount();
    } else if (this.delay < 0) {
      this.unmount();
    }
  }

  mount(delay = undefined, extras = undefined, updateSpellPower = false) {
    if (delay !== undefined) this.delay = delay;
    else this.delay = this.baseDelay;
    this.data.pending.add(this);
    if (extras !== undefined) this.extras = extras;
    if (updateSpellPower) this.baseSpellPower = new Decimal(this.data.spellPower);
  }

  unmount() {
    this.data.pending.delete(this);
  }
}

function fakeData(data, power) {
  const result = {};
  Object.assign(result, data);
  result.spellPower = power;
  return result;
}
