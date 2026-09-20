import { DC } from "../../constants";

import { MultiplierTabIcons } from "./icons";

// Infinity-based upgrades already include ISU Power. Extract only the added power's
// contribution so nested breakdowns do not apply the bonus a second time.
export function futureISUMultiplier(multiplier, bonus = FutureEmpowerOrbs.infinities.effectOrDefault(DC.D0)) {
  const totalPower = Decimal.add(TimeStudy(31).effectOrDefault(1), FutureEmpowerOrbs.infinities.effectOrDefault(DC.D0));
  return Decimal.pow(multiplier, Decimal.div(bonus, totalPower));
}

export function timeStudyISUMultiplier(multiplier) {
  return futureISUMultiplier(multiplier, Decimal.sub(TimeStudy(31).effectOrDefault(1), 1));
}

function totalISUDisplay() {
  const power = Decimal.add(TimeStudy(31).effectOrDefault(1), FutureEmpowerOrbs.infinities.effectOrDefault(DC.D0));
  return `Total: ${formatPow(power, 2, 2)}`;
}

export function timeStudyISUEntry(multValue) {
  return {
    name: "Time Study 31 - ISU Power",
    displayOverride: () => {
      const bonus = Decimal.sub(TimeStudy(31).effectOrDefault(1), 1);
      return `${formatAdd(bonus, 2, 2)} ISU Power; ${totalISUDisplay()}`;
    },
    multValue,
    isActive: () => TimeStudy(31).canBeApplied,
    icon: MultiplierTabIcons.TIME_STUDY,
  };
}

export function futureISUEntry(multValue) {
  return {
    name: "Future Empower - ISU Power",
    displayOverride: () => `${FutureEmpowerOrbs.infinities.formattedEffect} ISU Power; ${totalISUDisplay()}`,
    multValue,
    isActive: () => FutureEmpowerOrbs.infinities.canBeApplied,
    icon: MultiplierTabIcons.UPGRADE("infinity"),
  };
}
