<script>
import BigCrunchButton from "../BigCrunchButton";
import HeaderBlackHole from "../HeaderBlackHole";
import HeaderChallengeDisplay from "../HeaderChallengeDisplay";
import HeaderChallengeEffects from "../HeaderChallengeEffects";
import HeaderPrestigeGroup from "../HeaderPrestigeGroup";
import NewsTicker from "../NewsTicker";

import HeaderSpaceInfo from "../../tabs/_MOD/HeaderSpaceInfo.vue";

import GameSpeedDisplay from "@/components/GameSpeedDisplay";


export default {
  name: "ModernUi",
  components: {
    BigCrunchButton,
    HeaderChallengeDisplay,
    HeaderChallengeEffects,
    NewsTicker,
    HeaderBlackHole,
    HeaderPrestigeGroup,
    GameSpeedDisplay,
    HeaderSpaceInfo,
  },
  data() {
    return {
      bigCrunch: false,
      hasReality: false,
      inAbyssResearchTab: false,
      newGameKey: "",
      maxConcurrent: 1,
      activeNodesInfo: [],
      abyssResearchSpeed: new Decimal(0),
    };
  },
  computed: {
    news() {
      return this.$viewModel.news;
    },
    topMargin() {
      return this.$viewModel.news ? "" : "margin-top: 3.9rem";
    },
    informationHeaderClass() {
      return {
        "remove-marign": this.inAbyssResearchTab,
      };
    },
  },
  methods: {
    update() {
      this.inAbyssResearchTab = Tab.space.abyssResearch.isOpen; // Marign-bottom is so annoying in this tab
      this.maxConcurrent = AbyssResearches.A1.maxConcurrent; // For any node thats same so thats it
      this.abyssResearchSpeed.copyFrom(globalAbyssResearchSpeed());
      const activeNodesInfo = [];
      for (const id of player.activeAbyssResearches) {
        let text = String(id);
        switch (AbyssResearches[id].type) {
          case "unlimited":
            text += ` [${format(AbyssResearches[id].level)}]`;
            break;
          case "limited":
            text += ` [${format(AbyssResearches[id].level)}/${format(AbyssResearches[id].maxLevel)}]`;
            break;
          case "single":
            break;
        }
        const researchSpeed = AbyssResearches[id].researchSpeed;
        const timeToNext = researchSpeed.gt(0)
          ? TimeSpan.fromSeconds(
            AbyssResearches[id].cost.sub(AbyssResearches[id].progress).div(researchSpeed).toNumber()
          ).toSimplifiedTimeEstimate()
          : "Forever";
        text += ` (${formatPercents(AbyssResearches[id].percentage)}) (${timeToNext})`;
        activeNodesInfo.push(text);
      }
      this.activeNodesInfo = activeNodesInfo;
      const crunchButtonVisible = !player.break && Player.canCrunch;
      this.bigCrunch = crunchButtonVisible && Time.bestInfinityRealTime.totalMinutes.gt(1);
      this.hasReality = PlayerProgress.realityUnlocked();
      // This only exists to force a key-swap after pressing the button to start a new game; the news ticker can break
      // if it isn't redrawn
      this.newGameKey = Pelle.isDoomed;
    },
    handleClick() {
      if (PlayerProgress.infinityUnlocked()) manualBigCrunchResetRequest();
      else Modal.bigCrunch.show();
    },
  },
};
</script>

<template>
  <div id="page">
    <link
      rel="stylesheet"
      type="text/css"
      href="stylesheets/new-ui-styles.css"
    >
    <div
      :key="newGameKey"
      class="game-container"
      :style="topMargin"
    >
      <NewsTicker v-if="news" />
      <BigCrunchButton />
      <div
        v-if="!bigCrunch"
        class="tab-container"
      >
        <HeaderPrestigeGroup />
        <div
          class="information-header"
          :class="informationHeaderClass"
        >
          <HeaderChallengeDisplay />
          <HeaderChallengeEffects />
          <GameSpeedDisplay v-if="hasReality" />
          <br v-if="hasReality">
          <HeaderBlackHole />
          <HeaderSpaceInfo />
        </div>
        <slot />
        <div
          v-if="activeNodesInfo.length > 0 || inAbyssResearchTab"
          class="active-research-info"
        >
          <h3>Researching ({{ activeNodesInfo.length }}/{{ maxConcurrent }})</h3>
          <div>Base ARS: {{ format(abyssResearchSpeed, 2, 3) }}</div>
          <div class="active-list">
            <div
              v-for="(info, index) in activeNodesInfo"
              :key="index"
              class="active-item"
            >
              {{ info }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-research-info {
  position: fixed;
  bottom: 15px;
  right: 20px;
  background: rgba(20, 21, 30, 0.9);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 5;
}

.active-research-info h3 {
  margin-bottom: 10px;
  color: rgba(80, 160, 255, 0.9);
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.active-item {
  padding: 5px 10px;
  background: rgba(30, 31, 40, 0.8);
  border-radius: 5px;
}

.remove-marign {
  margin-bottom: 0 !important;
}
</style>
