<script>
  import { onDestroy, onMount } from 'svelte';
  import { T } from '@threlte/core';

  let orbit;
  let planet;
  let moon;

  function applyTime(time) {
    if (orbit) {
      orbit.rotation.y = time * .48;
      orbit.rotation.z = Math.sin(time * .62) * .1;
    }
    if (planet) {
      planet.rotation.y = -time * .34;
      planet.rotation.x = time * .08;
    }
    if (moon) moon.rotation.y = time * 1.15;
  }

  onMount(() => { window.__applyThrelteTime = applyTime; });
  onDestroy(() => { delete window.__applyThrelteTime; });
</script>

<T.PerspectiveCamera makeDefault position={[0, 1.05, 6.3]} fov={44} />
<T.Color attach="background" args={['#06131a']} />
<T.AmbientLight intensity={1.15} color="#76b3cf" />
<T.PointLight position={[-3, 3, 4]} intensity={36} color="#5fffe0" />
<T.PointLight position={[3, 0, 3]} intensity={28} color="#ff7a45" />

<T.Group bind:ref={orbit} rotation={[.22, 0, -.18]}>
  <T.Mesh bind:ref={planet}>
    <T.IcosahedronGeometry args={[1.18, 2]} />
    <T.MeshStandardMaterial color="#25c9a6" metalness={.35} roughness={.42} emissive="#075949" emissiveIntensity={.55} flatShading />
  </T.Mesh>

  <T.Mesh rotation={[1.12, 0, .32]}>
    <T.TorusGeometry args={[1.68, .055, 10, 100]} />
    <T.MeshStandardMaterial color="#ff9e55" metalness={.7} roughness={.24} emissive="#8b3212" emissiveIntensity={.72} />
  </T.Mesh>

  <T.Group bind:ref={moon}>
    <T.Mesh position={[2.15, .25, 0]}>
      <T.OctahedronGeometry args={[.32, 1]} />
      <T.MeshStandardMaterial color="#fff2d2" metalness={.2} roughness={.5} emissive="#7c5627" emissiveIntensity={.38} />
    </T.Mesh>
    <T.Mesh position={[1.7, -.5, .1]}>
      <T.SphereGeometry args={[.09, 12, 8]} />
      <T.MeshBasicMaterial color="#ff7548" />
    </T.Mesh>
  </T.Group>

  <T.Mesh position={[0, -1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <T.RingGeometry args={[1.2, 2.7, 72]} />
    <T.MeshBasicMaterial color="#103a45" transparent opacity={.5} />
  </T.Mesh>
</T.Group>
