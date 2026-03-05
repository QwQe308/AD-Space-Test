<script>
import { PastEmpower } from '../../../../../core/_MOD/empowers/pastEmpower';

export default {
  name: "PastEmpowerTab",
  data() {
    return {
      freezing: null,
      currenciesAvailableForFreeze: [
        { id: "antimatter", symbol: "AM", name: "Antimatter" },
        { id: "infinityPoints", symbol: "IP", name: "Infinity Points" },
        { id: "infinities", symbol: "IS", name: "Infinity Stats" },
        { id: "infinityPower", symbol: "Pow", name: "Infinity Power" },
        { id: "eternityPoints", symbol: "EP", name: "Eternity Points" },
        { id: "timeShards", symbol: "TSd", name: "Time Shards" },
      ],
    };
  },
  methods: {
    update() {},
    toggleFreeze(id){
      PastEmpower.freezing = id
    }
  },
  computed: {},
};
</script>

<template>
  <div>
    <div class="tip">
      Click a currency to freeze/unfreeze it. Frozen currencies cannot be decreased/increased by any way.<br />
      You can only freeze a single currency at the same time.
    </div>
    <div class="freeze">
      <div v-for="currenciesData in currenciesAvailableForFreeze">
        <button v-tooltip="currenciesData.name" :onclick="toggleFreeze(currenciesData.id)">{{ currenciesData.symbol }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tip {
  color: #aaaaaa;
}
.freeze {
  display: grid;
  grid-column: auto auto auto auto;
  width: 50%;
  height: 100%;
  padding: 15px;
  border-right: 1px;
  border-color: var(--color-text);
}
</style>
