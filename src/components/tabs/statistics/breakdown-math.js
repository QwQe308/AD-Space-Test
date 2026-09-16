import { DC } from "@/core/constants";

// Base prestige values should not be shown as nerfs when they are below one.
export const nerfBlacklist = ["IP_base", "EP_base", "TP_base"];

function toPercentage(value) {
  const number = value.toNumber();
  if (Number.isNaN(number)) return 0;
  // Keep nonzero contributions distinguishable from inactive effects in the text display.
  if (number === 0 && value.neq(0)) return value.sign * Number.MIN_VALUE;
  return Math.max(-1, Math.min(1, number));
}

export function calculateBreakdownPercentages(entries, resourceMultiplier) {
  let totalPosPow = DC.D1;
  let totalNegPow = DC.D1;
  for (const entry of entries) {
    const power = entry.data.pow;
    if (Decimal.gt(power, 1)) totalPosPow = totalPosPow.mul(power);
    else if (Decimal.lt(power, 1)) totalNegPow = totalNegPow.mul(power);
  }

  const resourceLog = Decimal.log10(resourceMultiplier);
  const log10Mult = resourceLog.div(totalPosPow);
  const isEmpty = log10Mult.eq(0) || !log10Mult.isFinite();
  if (isEmpty) {
    return { percents: entries.map(() => 0), log10Mult: DC.D0, totalPosPow, isEmpty };
  }

  const logPosPow = totalPosPow.ln();
  const logNegPow = totalNegPow.ln();
  const powerShare = DC.D1.sub(totalPosPow.reciprocal());
  const negativeShare = totalNegPow.sub(1);
  let totalPerc = DC.D0;
  let nerfedPerc = DC.D0;
  const contributions = entries.map(entry => {
    const power = entry.data.pow;
    let percent;
    if (Decimal.gte(power, 1)) {
      // Cancel totalPosPow before dividing; the logarithms themselves may exceed Number.MAX_VALUE.
      percent = Decimal.log10(entry.data.mult).div(resourceLog);
      if (Decimal.neq(power, 1) && totalPosPow.neq(1)) {
        percent = percent.add(Decimal.ln(power).div(logPosPow).mul(powerShare));
      }
    } else if (totalNegPow.eq(0)) {
      // A zero power cancels the affected production completely. Avoid log(0) / log(0).
      percent = Decimal.eq(power, 0) ? DC.DM1 : DC.D0;
    } else {
      percent = Decimal.ln(power).div(logNegPow).mul(negativeShare);
    }
    if (nerfBlacklist.includes(entry.key)) percent = percent.clampMin(0.0001);
    const ignoresNerf = entry.ignoresNerfPowers;
    const nerfed = ignoresNerf ? percent : percent.mul(totalNegPow);
    if (percent.gt(0)) {
      totalPerc = totalPerc.add(percent);
      nerfedPerc = nerfedPerc.add(nerfed);
    }
    return { percent, nerfed };
  });

  const lostPerc = totalPerc.sub(nerfedPerc);
  const percents = contributions.map(({ percent, nerfed }) => {
    if (totalPerc.eq(0) || percent.eq(0)) return 0;
    if (percent.gt(0)) {
      // Preserve the relative weights when every positive effect has been reduced to zero.
      return toPercentage(nerfedPerc.eq(0) ? percent.div(totalPerc) : nerfed.div(nerfedPerc));
    }
    if (lostPerc.eq(0)) return 0;
    if (totalNegPow.eq(0)) return -1;
    return toPercentage(percent.mul(lostPerc).div(totalPerc).div(totalNegPow));
  });
  return { percents, log10Mult, totalPosPow, isEmpty };
}

export function breakdownBarLayout(percents) {
  const netPercent = Math.max(0, percents.reduce((sum, percent) => sum + percent, 0));
  const sizes = percents.map(percent => (percent > 0 ? percent * netPercent : -percent));
  // Multiple fully cancelling nerfs can otherwise create negative heights or overflow the bar.
  const scale = Math.max(1, sizes.reduce((sum, size) => sum + size, 0));
  let top = 0;
  return sizes.map(size => {
    const height = size / scale;
    const position = { top: 100 * top, height: 100 * height };
    top += height;
    return position;
  });
}
