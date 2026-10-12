import { DC } from "../../../constants";
import { Currency } from "../../../currency";

class PastEmpowerClass {
  // Freezing
  get data() {
    return player.empowers.past;
  }

  get freezing() {
    return this.data.frozenCurrency;
  }

  set freezing(newVal) {
    this.data.frozenCurrency = newVal;
  }

  toggleFreezing(value) {
    if (this.freezing === value) {
      this.removeFreezing();
    } else {
      this.freezing = value;
    }
  }

  removeFreezing() {
    this.data.frozenCurrency = "";
  }

  // Simulating
  set simulating(newVal) {
    SimulationConfigs[newVal].reset();
    this.data.simulating = newVal;
  }

  get simulating() {
    return this.data.simulating;
  }

  get simulationConfig() {
    return SimulationConfigs[this.simulating];
  }

  get simulationSpeed() {
    // Future simulation speed bonuses are applied here.
    return DC.D1;
  }

  toggleSimulation(newVal) {
    if (this.simulating === newVal) {
      this.removeSimulation();
    } else {
      this.simulating = newVal;
    }
  }

  removeSimulation() {
    this.data.simulating = null;
  }

  updateSimulationAfterTick(diff) {
    if (!this.simulating) return;
    const config = this.simulationConfig;
    if (!config.checkSuccess()) return;
    config.giveRewards(this.simulationSpeed, diff.div(1000));
  }

  get simulationGain() {
    if (!this.simulationConfig || !this.simulationConfig.checkSuccess()) return {};
    return this.simulationConfig.getRewards(this.simulationSpeed);
  }

  get baseSimulationGain() {
    if (!this.simulationConfig) return {};
    return this.simulationConfig.getRewards(DC.D1);
  }

  simulationGainOnSpeed(name, simulationSpeed) {
    return SimulationConfigs[name].getRewards(simulationSpeed);
  }
}

function calcRewards(rewardsList, simulationSpeed) {
  for (const i in rewardsList) {
    rewardsList[i] = rewardsList[i].mul(simulationSpeed).div(0.033);
  }
  return rewardsList;
}

const SimulationConfigs = {
  Infinity: {
    checkSuccess() {
      return Player.canCrunch;
    },
    reset() {
      return bigCrunchReset();
    },
    giveRewards(simulationSpeed, diff) {
      const SimulationRewards = this.getRewards(simulationSpeed);
      // Infinity Points
      const IP = SimulationRewards.infinityPoints.mul(diff).add(player.partInfinityPoint);
      Currency.infinityPoints.add(IP.floor());
      player.partInfinityPoint = IP.sub(IP.floor()).toNumber();
      // Infinities
      const IS = SimulationRewards.infinities.mul(diff).add(player.partInfinitied);
      Currency.infinities.add(IS.floor());
      player.partInfinitied = IS.sub(IS.floor()).toNumber();
    },
    getRewards(simulationSpeed) {
      return calcRewards(bigCrunchGiveRewardsList(), simulationSpeed);
    },
  },
  Eternity: {
    checkSuccess() {
      return Player.canEternity;
    },
    reset() {
      return eternity(false, true);
    },
    giveRewards(simulationSpeed, diff) {
      const SimulationRewards = this.getRewards(simulationSpeed);
      // Eternity Points
      const EP = SimulationRewards.eternityPoints.mul(diff);
      Currency.eternityPoints.add(EP);
      // Eternities
      const ES = SimulationRewards.eternities.mul(diff).add(player.reality.partEternitied);
      Currency.eternities.add(ES.floor());
      player.reality.partEternitied = ES.sub(ES.floor());
    },
    getRewards(simulationSpeed) {
      return calcRewards(eternityGiveRewardsList(), simulationSpeed);
    },
  },
};

export const PastEmpower = new PastEmpowerClass();
