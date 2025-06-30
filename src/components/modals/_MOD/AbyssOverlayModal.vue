<script>
export default {
  name: "AbyssOverlayModal",
  data() {
    return {
      text: "",
    };
  },
  methods: {
    update() {
      this.text = ui.view.abyssTexts;
    },
  },
};
</script>

<template>
  <div class="overlayClass">
    <span v-html="text" class="textClass"></span>
  </div>
</template>

<style scoped>
.overlayClass {
  position: absolute;
  left: -50vw;
  top: -50vh;
  width: 110vw;
  height: 110vh;
  background-color: #111014;
  color: white;
  text-align: left;
}
.textClass {
  position: relative;
  left: 5vw;
  top: 5vh;
}
</style>
