<script setup>
import { TresCanvas } from '@tresjs/core';
import Scene from './Scene.vue';
</script>

<template>
  <TresCanvas clear-color="#070916" :dpr="1" render-mode="always">
    <Scene />
  </TresCanvas>
  <span class="library-badge">TresJS · Vue SFC</span>
  <span class="scene-caption">reactive 3D component tree</span>
</template>
