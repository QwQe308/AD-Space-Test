import { TimeStudy } from "./normal-time-study";

export class TimeStudyConnection {
  constructor(from, to, override) {
    this._from = from;
    this._to = to;
    this._override = override;
  }

  get from() {
    return this._from;
  }

  get to() {
    return this._to;
  }

  get isOverridden() {
    return this._override !== undefined && this._override();
  }

  get isSatisfied() {
    return this.isOverridden || this._from.isBought;
  }
}

function isAbyssOn() {
  return !player.options.breakPlaceHolder && PlayerProgress.imaginaryUnlocked();
}

/**
 * @type {TimeStudyConnection[]}
 */
TimeStudy.allConnections = (function() {
  const TS = id => TimeStudy(id);
  const EC = id => TimeStudy.eternityChallenge(id);
  const connections = [
    [TS(11), TS(21)],
    [TS(11), TS(22)],

    [TS(21), TS(31)],
    [TS(22), TS(33)],
    [TS(22), TS(32)],
    [TS(21), TS(34)],

    [TS(31), TS(41)],
    [TS(32), TS(42)],

    [TS(41), TS(52)],
    [TS(41), TS(51)],
    [TS(42), TS(51)],
    [TS(42), EC(5)],

    [TS(51), TS(61)],

    [TS(61), TS(71)],
    [TS(61), TS(72)],
    [TS(61), TS(73)],

    [TS(71), TS(81)],
    [TS(72), TS(82)],
    [TS(73), TS(83)],

    [TS(81), TS(91)],
    [TS(82), TS(92)],
    [TS(83), TS(93)],

    [TS(91), TS(101)],
    [TS(92), TS(102)],
    [TS(93), TS(103)],

    [TS(101), TS(111)],
    [TS(102), TS(111)],
    [TS(103), TS(111)],

    [TS(111), EC(7), () => isAbyssOn()],
    [TS(111), TS(112), () => isAbyssOn()],

    [TS(111), TS(121), () => isAbyssOn()],
    [TS(111), TS(122), () => isAbyssOn()],
    [TS(111), TS(123), () => isAbyssOn()],

    [TS(121), TS(131), () => isAbyssOn()],
    [TS(122), TS(132), () => isAbyssOn()],
    [TS(123), TS(133), () => isAbyssOn()],
    [TS(121), EC(6), () => isAbyssOn()],
    [TS(123), EC(8), () => isAbyssOn()],

    [TS(131), TS(141), () => isAbyssOn()],
    [TS(132), TS(142), () => isAbyssOn()],
    [TS(133), TS(143), () => isAbyssOn()],

    [TS(141), TS(151), () => isAbyssOn()],
    [TS(142), TS(151), () => isAbyssOn()],
    [TS(143), TS(151), () => isAbyssOn()],
    [TS(143), EC(4), () => isAbyssOn()],

    [TS(141), EC(9), () => isAbyssOn()],

    [TS(151), TS(161), () => isAbyssOn()],
    [TS(151), TS(162), () => isAbyssOn()],

    [TS(161), TS(171), () => isAbyssOn()],
    [TS(162), TS(171), () => isAbyssOn()],

    [TS(171), EC(1), () => isAbyssOn()],
    [TS(171), EC(2), () => isAbyssOn()],
    [TS(171), EC(3), () => isAbyssOn()],

    [TS(171), TS(181),
      () => !Perk.bypassEC1Lock.isBought || !Perk.bypassEC2Lock.isBought || !Perk.bypassEC3Lock.isBought || isAbyssOn()],

    [EC(1), TS(181), () => Perk.bypassEC1Lock.isBought || isAbyssOn()],
    [EC(2), TS(181), () => Perk.bypassEC2Lock.isBought || isAbyssOn()],
    [EC(3), TS(181), () => Perk.bypassEC3Lock.isBought || isAbyssOn()],

    [TS(181), EC(10), () => isAbyssOn()],

    [EC(10), TS(191), () => isAbyssOn()],
    [EC(10), TS(192), () => isAbyssOn()],
    [EC(10), TS(193), () => isAbyssOn()],

    [TS(192), TS(201), () => isAbyssOn()],

    [TS(191), TS(211), () => isAbyssOn()],
    [TS(191), TS(212), () => isAbyssOn()],
    [TS(193), TS(213), () => isAbyssOn()],
    [TS(193), TS(214), () => isAbyssOn()],

    [TS(211), TS(221), () => isAbyssOn()],
    [TS(211), TS(222), () => isAbyssOn()],
    [TS(212), TS(223), () => isAbyssOn()],
    [TS(212), TS(224), () => isAbyssOn()],
    [TS(213), TS(225), () => isAbyssOn()],
    [TS(213), TS(226), () => isAbyssOn()],
    [TS(214), TS(227), () => isAbyssOn()],
    [TS(214), TS(228), () => isAbyssOn()],

    [TS(221), TS(231), () => isAbyssOn()],
    [TS(222), TS(231), () => isAbyssOn()],
    [TS(223), TS(232), () => isAbyssOn()],
    [TS(224), TS(232), () => isAbyssOn()],
    [TS(225), TS(233), () => isAbyssOn()],
    [TS(226), TS(233), () => isAbyssOn()],
    [TS(227), TS(234), () => isAbyssOn()],
    [TS(228), TS(234), () => isAbyssOn()],

    [TS(231), EC(11), () => isAbyssOn()],
    [TS(232), EC(11), () => isAbyssOn()],
    [TS(233), EC(12), () => isAbyssOn()],
    [TS(234), EC(12), () => isAbyssOn()],

    [EC(11), TimeStudy.dilation, () => isAbyssOn()],
    [EC(12), TimeStudy.dilation, () => isAbyssOn()],

    [TimeStudy.dilation, TimeStudy.timeDimension(5), () => isAbyssOn()],
    [TimeStudy.timeDimension(5), TimeStudy.timeDimension(6), () => isAbyssOn()],
    [TimeStudy.timeDimension(6), TimeStudy.timeDimension(7), () => isAbyssOn()],
    [TimeStudy.timeDimension(7), TimeStudy.timeDimension(8), () => isAbyssOn()],
    [TimeStudy.timeDimension(8), TimeStudy.reality, () => isAbyssOn()]
  ].map(props => new TimeStudyConnection(props[0], props[1], props[2]));

  return connections;
}());
