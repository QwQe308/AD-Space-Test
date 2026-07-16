import { DC } from "../../../constants";
import { Currency } from "../../../currency";

class PastEmpowerClass {
  constructor() {}

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
    this.simulationSpeed = DC.D1;
    this.data.simulating = newVal;
    this.resetSimulationTimer();
  }

  get simulating() {
    return this.data.simulating;
  }

  get simulationConfig() {
    return SimulationConfigs[this.simulating];
  }

  set simulationSpeed(newVal) {
    this.data.simulationSpeed = newVal;
  }

  get simulationSpeed() {
    return this.data.simulationSpeed;
  }

  toggleSimulation(newVal) {
    if (this.simulating === newVal) {
      this.removeSimulation();
    } else {
      this.simulating = newVal;
    }
  }

  removeSimulation() {
    this.simulationSpeed = DC.D1;
    this.data.simulating = null;
  }

  get simulationMaxSpeed() {
    const maxSpeed = DC.E1;
    return maxSpeed;
  }

  resetSimulationTimer() {
    this.data.simulationTimeThisReset = DC.D0;
    this.data.simulationTrueTimeThisReset = 0;
    this.data.simulationTickThisReset = 0;
  }

  updateSimulationAfterTick(diff, trueDiff) {
    if (!this.simulating) return;
    const CurrentSimulationConfig = this.simulationConfig;
    this.data.simulationTimeThisReset = this.data.simulationTimeThisReset.add(diff);
    this.data.simulationTrueTimeThisReset += trueDiff;
    this.data.simulationTickThisReset++;
    // Avoiding largr diff periods such as offline progress
    let fakeSimulationTime = this.data.simulationTrueTimeThisReset;
    if (fakeSimulationTime > this.data.simulationTickThisReset * 20)
      fakeSimulationTime = this.data.simulationTickThisReset * 20;
    // Handle simulation
    if (CurrentSimulationConfig.checkSuccess()) {
      if (fakeSimulationTime < 2000) {
        this.simulationSpeed = this.simulationSpeed.mul(2000 / fakeSimulationTime).min(this.simulationMaxSpeed);
        if (this.simulationSpeed.eq(this.simulationMaxSpeed)) return console.log(fakeSimulationTime);
      }
      CurrentSimulationConfig.giveRewards(this.simulationSpeed, this.data.simulationTimeThisReset.div(1000));
      CurrentSimulationConfig.reset();
      this.resetSimulationTimer();
    } else if (fakeSimulationTime > 3000) {
      this.simulationSpeed = this.simulationSpeed.mul(0.9 ** (trueDiff / 3000)).max(1);
    }
  }

  get simulationGain() {
    if (!this.simulationConfig) return {};
    return this.simulationConfig.getRewards(this.simulationSpeed);
  }

  get baseSimulationGain() {
    if (!this.simulationConfig) return {};
    return this.simulationConfig.getRewards(DC.D1);
  }

  get maxSimulationGain() {
    if (!this.simulationConfig) return {};
    return this.simulationConfig.getRewards(this.simulationMaxSpeed);
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
      // Infinity Points
      const EP = EternityRewards.eternityPoints.mul(diff);
      Currency.eternityPoints.add(EP);
      // Eternities
      const ES = EternityRewards.eternities.mul(diff).add(player.reality.partEternitied);
      Currency.eternities.add(ES.floor());
      player.reality.partEternitied = ES.sub(ES.floor());
    },
    getRewards(simulationSpeed) {
      return calcRewards(eternityGiveRewardsList(), simulationSpeed);
    },
  },
};

export const PastEmpower = new PastEmpowerClass();
