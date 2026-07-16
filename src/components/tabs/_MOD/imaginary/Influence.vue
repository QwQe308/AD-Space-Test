<script>
export default {
  name: "Influence",
  props: {
    id: {
      type: String,
      required: true
    }
  },
  computed: {
    config() {
      return imaginaryInfluences[this.id];
    }
  },
  methods: {
    update() {
    },
  }
};
</script>

<template>
  <div class="influence">
    <div class="name">
      {{ config.name }}
    </div>
    <div class="description">
      <div class="description-content">
        {{ config.info }}
      </div>
    </div>
    <div class="influence-stat">
      {{ config.influenceStat }}
    </div>
  </div>
</template>

<style scoped>
.influence{
  border-width: 0px;
  border-bottom: 1px;
  border-style: solid;
  border-color: var(--color-imaginary);
  background-color: #111014;
  height: 30px;
  width: 85%;
  margin: auto;
  display: flex;
  margin-bottom: 10px;
}
.name{
  color: var(--color-imaginary);
  text-align: left;
  margin-left: 30px;
  font-size: 20px;
  width: 150px;
}
.description{
  display: flex;
  flex-grow: 1;
  font-size: 20px;
}
.influence-stat{
  width: 150px;
  text-align: end;
  margin-left: auto;
  margin-right: 30px;
  color: var(--color-imaginary);
  font-size: 20px;
}
.description-content{
  margin-inline: auto;
  text-align: center;
}
</style>
