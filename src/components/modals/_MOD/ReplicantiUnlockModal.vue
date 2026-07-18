<script>
import ModalWrapperChoice from "@/components/modals/ModalWrapperChoice";

export default {
  name: "ReplicantiUnlockModal",
  components: {
    ModalWrapperChoice
  },
  created() {
    this.on$(GAME_EVENT.ETERNITY_RESET_AFTER, this.emitClose);
    this.on$(GAME_EVENT.REALITY_RESET_AFTER, this.emitClose);
  },
  methods: {
    handleYesClick() {
      Replicanti.unlock();
      EventHub.ui.offAll(this);
    }
  },
};
</script>

<template>
  <ModalWrapperChoice
    @confirm="handleYesClick"
    @cancel="emitClose"
  >
    <template #header>
      Unlock Replicanti?
    </template>
    <div class="c-modal-message__text">
      Are you sure to unlock Replicanti before e140 IP?<br>
      If you want to challenge yourself in mirror runs, this is not recommended.<br>
      Else, if you do not like strategy things, this would help you out at the cost of time.
    </div>
    <template #confirm-text>
      Unlock
    </template>
  </ModalWrapperChoice>
</template>
