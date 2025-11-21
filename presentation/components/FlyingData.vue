<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useMotion } from '@vueuse/motion';

type Vec2 = { x?: number, y?: number };

const {
  startPos = {},
  endPos = {},
  delay = 1000,
} = defineProps<{
  startPos: Vec2;
  endPos: Vec2;
  delay?: number;
}>();

const block = useTemplateRef("block");

const { variant } = useMotion(block, {
  initial: {
    ...startPos,
    scale: 0,
  },
  enter: {
    transition: {
      duration: 1,
      onComplete: () => {
        variant.value = 'start';
      },
    },
  },
  start: {
    scale: 1,
    transition: {
      duration: 400,
      onComplete: () => {
        variant.value = 'move';
      },
    },
  },
  move: {
    ...endPos,
    transition: {
      duration: 800,
      delay: 0,
      onComplete: () => {
        variant.value = 'fadeOut';
      },
    }
  },
  fadeOut: {
    scale: 0,
    transition: {
      duration: 415,
      onComplete: () => {
        variant.value = 'reset';
      },
    },
  },
  reset: {
    ...startPos,
    scale: 0,
    transition: {
      duration: delay,
      onComplete: () => {
        variant.value = 'start';
      },
    }
  }
});

</script>

<template>
  <img src="/cube.svg" alt="Data cube" ref="block" />
</template>
