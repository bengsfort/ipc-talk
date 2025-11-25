<script setup lang="ts">
const props = defineProps<{
  colClass?: string;
  layoutClass?: string;
}>();
</script>

<template>
  <div class="slidev-layout two-code-blocks two-cols-header w-full h-full" :class="props.layoutClass">
    <div class="col-header">
      <slot />
    </div>

    <div class="col-left" :class="props.colClass">
      <slot name="left" />
    </div>

    <div class="col-right" :class="props.colClass">
      <slot name="right" />
    </div>

    <div class="col-bottom" :class="props.colClass">
      <slot name="bottom" />
    </div>
  </div>
</template>

<style scoped>
.two-cols-header {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto 1fr auto;
  column-gap: 20px;
}

.col-header {
  grid-area: 1 / 1 / 2 / 3;
}

.col-left {
  grid-area: 2 / 1 / 3 / 2;
}

.col-right {
  grid-area: 2 / 2 / 3 / 3;
}

.col-bottom {
  align-self: end;
  grid-area: 3 / 1 / 3 / 3;
}
</style>
