<script>
export default {
  name: "influence",
  props: {
    id: {
      type: String,
      required: true
    }
  },
  methods: {
    update() {
    },
  },
  computed: {
    config(){
      return imaginaryInfluences[this.id]
    }
  }
};
</script>

<template>
  <div class="influence">
    <span class="name">
      {{ config.name }}
    </span>
    <span class="description">
      {{ config.info }}
    </span>
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
  color: var(--color-imaginary);
  display: flex;
  margin-bottom: 10px;
}
.name{
  text-align: left;
  margin-left: 30px;
  font-size: 20px;
  width: 150px;
}
.description{
  text-align: left;
  margin-left: 30px;
  font-size: 20px;
}
</style>
