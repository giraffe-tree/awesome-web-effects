<script setup>
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';

const sculpture = shallowRef();
const knot = shallowRef();
const bars = Array.from({ length: 12 }, (_, index) => {
  const angle = index / 12 * Math.PI * 2;
  const height = .45 + (index % 4) * .24;
  return {
    position: [Math.cos(angle) * 2.05, -1.05 + height / 2, Math.sin(angle) * 2.05],
    height,
    color: index % 2 ? '#7c5cff' : '#20dcff'
  };
});

function applyTime(time) {
  if (sculpture.value) {
    sculpture.value.rotation.y = time * .38;
    sculpture.value.rotation.x = Math.sin(time * .6) * .08;
  }
  if (knot.value) {
    knot.value.rotation.x = time * .55;
    knot.value.rotation.z = -time * .34;
    const pulse = 1 + Math.sin(time * 1.8) * .04;
    knot.value.scale.setScalar(pulse);
  }
}

onMounted(() => { window.__applyTresTime = applyTime; });
onBeforeUnmount(() => { delete window.__applyTresTime; });
</script>

<template>
  <TresPerspectiveCamera :position="[0, 1.3, 6.8]" :fov="46" />
  <TresAmbientLight :intensity="1.3" color="#7987ff" />
  <TresPointLight :position="[-3, 4, 4]" :intensity="42" color="#28ddff" />
  <TresPointLight :position="[3, 1, 2]" :intensity="32" color="#b04cff" />

  <TresGroup ref="sculpture" :rotation="[0, 0, 0]">
    <TresMesh ref="knot" :position="[0, .15, 0]">
      <TresTorusKnotGeometry :args="[.82, .24, 120, 18]" />
      <TresMeshStandardMaterial color="#9e62ff" :metalness=".72" :roughness=".2" emissive="#321580" :emissive-intensity=".65" />
    </TresMesh>

    <TresMesh v-for="(bar, index) in bars" :key="index" :position="bar.position">
      <TresBoxGeometry :args="[.22, bar.height, .22]" />
      <TresMeshStandardMaterial :color="bar.color" :metalness=".5" :roughness=".28" :emissive="bar.color" :emissive-intensity=".22" />
    </TresMesh>

    <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -1.05, 0]">
      <TresRingGeometry :args="[1.45, 2.55, 64]" />
      <TresMeshBasicMaterial color="#314b78" :transparent="true" :opacity=".42" />
    </TresMesh>
  </TresGroup>
</template>
