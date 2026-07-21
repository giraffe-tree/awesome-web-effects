import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#life-stage');
  const host = document.querySelector('#life-host');
  const observationOutput = document.querySelector('#observation-output');
  const mixingOutput = document.querySelector('#mixing-output');
  const cohesionOutput = document.querySelector('#cohesion-output');
  const ruleName = document.querySelector('#rule-name');
  const relationA = document.querySelector('#relation-a');
  const relationB = document.querySelector('#relation-b');
  const relationC = document.querySelector('#relation-c');
  const ruleControls = [...document.querySelectorAll('.rule-control')];
  const speciesControls = [...document.querySelectorAll('.species-control')];
  const stepCountControl = document.querySelector('#step-count');
  const runToggle = document.querySelector('#run-toggle');
  const resetButton = document.querySelector('#reset-life');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !observationOutput || !mixingOutput || !cohesionOutput || !ruleName || !relationA || !relationB || !relationC || ruleControls.length !== 3 || speciesControls.length !== 3 || !stepCountControl || !runToggle || !resetButton) {
    throw new Error('Colony sandbox DOM is incomplete.');
  }

  const FIXED_SEED = 590216;
  const AGENT_COUNT = 216;
  const SPECIES_COUNT = 3;
  const AGENTS_PER_SPECIES = AGENT_COUNT / SPECIES_COUNT;
  const species = [
    { id: 'foragers', label: 'Foragers', color: [83, 231, 173], center: [.47, .32] },
    { id: 'pollinators', label: 'Pollinators', color: [169, 133, 255], center: [.73, .4] },
    { id: 'sentinels', label: 'Sentinels', color: [255, 107, 114], center: [.61, .69] }
  ];
  const rules = {
    mutualism: {
      label: 'Mutualism',
      matrix: [
        [.12, .68, -.10],
        [.55, .10, .42],
        [-.08, .52, .13]
      ],
      relations: ['seek pollinators', 'bridge colonies', 'guard edges']
    },
    territory: {
      label: 'Territory',
      matrix: [
        [.42, -.70, -.62],
        [-.66, .39, -.68],
        [-.58, -.72, .44]
      ],
      relations: ['hold green ground', 'hold violet ground', 'hold coral ground']
    },
    cycle: {
      label: 'Cyclic pursuit',
      matrix: [
        [.04, .82, -.48],
        [-.48, .04, .82],
        [.82, -.48, .04]
      ],
      relations: ['follow pollinators', 'follow sentinels', 'follow foragers']
    }
  };
  const ruleKeys = Object.keys(rules);

  function deterministic(index, salt) {
    let value = (FIXED_SEED ^ Math.imul(index + 1, 0x45d9f3b) ^ Math.imul(salt + 17, 0x27d4eb2d)) >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 0x7feb352d) >>> 0;
    value ^= value >>> 15;
    value = Math.imul(value, 0x846ca68b) >>> 0;
    value ^= value >>> 16;
    return (value >>> 0) / 4294967296;
  }

  function makeAgents() {
    return Array.from({ length: AGENT_COUNT }, (_, index) => {
      const kind = index % SPECIES_COUNT;
      const angle = deterministic(index, 1) * Math.PI * 2;
      const radius = Math.sqrt(deterministic(index, 2)) * .095;
      const center = species[kind].center;
      return {
        id: index,
        species: kind,
        x: (center[0] + Math.cos(angle) * radius + 1) % 1,
        y: (center[1] + Math.sin(angle) * radius + 1) % 1,
        previousX: 0,
        previousY: 0,
        vx: 0,
        vy: 0,
        neighborCount: 0
      };
    });
  }

  const agents = makeAgents();
  const state = {
    task: 'bounded-colony-relationship-experiment',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    rule: 'mutualism',
    selectedSpecies: 0,
    selectedStepBudget: 72,
    remainingSteps: 0,
    completedSteps: 0,
    lastRunSteps: 0,
    running: false,
    phase: 'idle',
    interventionActive: false,
    interventionX: .61,
    interventionY: .5,
    pointerCaptured: false,
    dragging: false,
    activePointerId: null,
    inputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    pointerMoveCount: 0,
    runCount: 0,
    pauseCount: 0,
    resetCount: 0,
    ruleChangeCount: 0,
    interventionCount: 0,
    reducedMotionBatchCount: 0,
    lastInput: 'none',
    lastInputTrusted: false,
    lastPointerType: 'none',
    observation: 'Awaiting run',
    mixing: 0,
    cohesion: 0,
    centroidSpread: 0,
    meanSpeed: 0,
    fixedSeed: FIXED_SEED,
    deterministicInitialization: true,
    randomSourceUsed: false,
    automaticPlayback: false,
    automaticFallback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    reducedMotion: reducedMotionQuery.matches,
    initialStaticConfirmed: false,
    initialStateChecksum: 0,
    renderCount: 0,
    simulationStepCount: 0,
    forceEvaluationCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    p5Instance: false,
    claimedLibrary: 'p5@2.3.0',
    inputAdapters: ['pointer', 'touch', 'pen', 'keyboard', 'control']
  };

  let sketch;
  let resolveSetup;
  let dirty = true;
  let previousFrameAt = 0;
  let accumulator = 0;
  const setupReady = new Promise(resolve => { resolveSetup = resolve; });
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  function toroidalDelta(from, to) {
    let delta = to - from;
    if (delta > .5) delta -= 1;
    if (delta < -.5) delta += 1;
    return delta;
  }

  function stateChecksum() {
    let checksum = 2166136261;
    agents.forEach(agent => {
      for (const value of [agent.species, agent.x, agent.y, agent.vx, agent.vy]) {
        checksum = Math.imul(checksum ^ Math.round((value + 2) * 1000000), 16777619) >>> 0;
      }
    });
    return checksum;
  }

  function resetAgents() {
    const fresh = makeAgents();
    agents.forEach((agent, index) => Object.assign(agent, fresh[index]));
    state.remainingSteps = 0;
    state.completedSteps = 0;
    state.lastRunSteps = 0;
    state.running = false;
    state.phase = 'idle';
    state.interventionActive = false;
    state.interventionX = .61;
    state.interventionY = .5;
    state.observation = 'Awaiting run';
    state.mixing = 0;
    state.cohesion = 0;
    state.centroidSpread = 0;
    state.meanSpeed = 0;
    state.simulationStepCount = 0;
    state.forceEvaluationCount = 0;
    previousFrameAt = 0;
    accumulator = 0;
    dirty = true;
  }

  function recordInput(source, kind = 'control', pointerType = 'none', event = null) {
    if (!event || event.isTrusted !== true) return false;
    state.inputCount += 1;
    state.lastInput = source;
    state.lastInputTrusted = true;
    if (kind === 'pointer') {
      state.pointerInputCount += 1;
      state.lastPointerType = pointerType;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    } else if (kind === 'keyboard') {
      state.keyboardInputCount += 1;
    } else {
      state.controlInputCount += 1;
    }
    return true;
  }

  function simulationStep() {
    const matrix = rules[state.rule].matrix;
    const accelerations = agents.map(() => ({ x: 0, y: 0 }));
    const interactionRadius = .155;
    const separationRadius = .018;

    for (let index = 0; index < agents.length; index += 1) {
      const agent = agents[index];
      let neighbors = 0;
      for (let otherIndex = 0; otherIndex < agents.length; otherIndex += 1) {
        if (index === otherIndex) continue;
        const other = agents[otherIndex];
        const dx = toroidalDelta(agent.x, other.x);
        const dy = toroidalDelta(agent.y, other.y);
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared <= .0000001 || distanceSquared >= interactionRadius * interactionRadius) continue;
        const distance = Math.sqrt(distanceSquared);
        let force;
        if (distance < separationRadius) {
          force = -1.35 * (1 - distance / separationRadius);
        } else {
          const normalized = (distance - separationRadius) / (interactionRadius - separationRadius);
          const envelope = 1 - Math.abs(normalized * 2 - 1);
          force = matrix[agent.species][other.species] * envelope;
        }
        accelerations[index].x += dx / distance * force * .00034;
        accelerations[index].y += dy / distance * force * .00034;
        neighbors += 1;
        state.forceEvaluationCount += 1;
      }

      if (state.interventionActive) {
        const dx = toroidalDelta(agent.x, state.interventionX);
        const dy = toroidalDelta(agent.y, state.interventionY);
        const distance = Math.max(.01, Math.hypot(dx, dy));
        const influence = Math.max(0, 1 - distance / .36);
        const polarity = agent.species === state.selectedSpecies ? 1 : -.18;
        accelerations[index].x += dx / distance * influence * polarity * .00085;
        accelerations[index].y += dy / distance * influence * polarity * .00085;
      }
      agent.neighborCount = neighbors;
    }

    agents.forEach((agent, index) => {
      agent.previousX = agent.x;
      agent.previousY = agent.y;
      agent.vx = (agent.vx + accelerations[index].x) * .89;
      agent.vy = (agent.vy + accelerations[index].y) * .89;
      const speed = Math.hypot(agent.vx, agent.vy);
      const maximumSpeed = .0054;
      if (speed > maximumSpeed) {
        agent.vx = agent.vx / speed * maximumSpeed;
        agent.vy = agent.vy / speed * maximumSpeed;
      }
      agent.x = (agent.x + agent.vx + 1) % 1;
      agent.y = (agent.y + agent.vy + 1) % 1;
    });

    state.completedSteps += 1;
    state.simulationStepCount += 1;
    state.remainingSteps = Math.max(0, state.remainingSteps - 1);
  }

  function computeMetrics() {
    let mixed = 0;
    agents.forEach((agent, index) => {
      let nearestDistance = Infinity;
      let nearestSpecies = agent.species;
      for (let otherIndex = 0; otherIndex < agents.length; otherIndex += 1) {
        if (index === otherIndex) continue;
        const other = agents[otherIndex];
        const dx = toroidalDelta(agent.x, other.x);
        const dy = toroidalDelta(agent.y, other.y);
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestSpecies = other.species;
        }
      }
      if (nearestSpecies !== agent.species) mixed += 1;
    });

    const centroids = species.map((_, speciesIndex) => {
      const members = agents.filter(agent => agent.species === speciesIndex);
      return {
        x: members.reduce((sum, agent) => sum + agent.x, 0) / members.length,
        y: members.reduce((sum, agent) => sum + agent.y, 0) / members.length
      };
    });
    let cohesionDistance = 0;
    agents.forEach(agent => {
      const center = centroids[agent.species];
      cohesionDistance += Math.hypot(toroidalDelta(center.x, agent.x), toroidalDelta(center.y, agent.y));
    });
    cohesionDistance /= agents.length;
    const centroidDistances = [
      Math.hypot(toroidalDelta(centroids[0].x, centroids[1].x), toroidalDelta(centroids[0].y, centroids[1].y)),
      Math.hypot(toroidalDelta(centroids[1].x, centroids[2].x), toroidalDelta(centroids[1].y, centroids[2].y)),
      Math.hypot(toroidalDelta(centroids[2].x, centroids[0].x), toroidalDelta(centroids[2].y, centroids[0].y))
    ];
    state.mixing = Math.round(mixed / agents.length * 100);
    state.cohesion = Math.round(clamp(1 - cohesionDistance / .31) * 100);
    state.centroidSpread = centroidDistances.reduce((sum, value) => sum + value, 0) / centroidDistances.length;
    state.meanSpeed = agents.reduce((sum, agent) => sum + Math.hypot(agent.vx, agent.vy), 0) / agents.length;

    if (state.rule === 'mutualism') {
      state.observation = state.mixing >= 34 ? 'Shared hub formed' : 'Colonies converging';
    } else if (state.rule === 'territory') {
      state.observation = state.centroidSpread >= .28 ? 'Three territories hold' : 'Boundaries emerging';
    } else {
      state.observation = state.meanSpeed >= .0012 ? 'Pursuit loop active' : 'Pursuit chain forming';
    }
  }

  function finishRun() {
    state.running = false;
    state.phase = 'observed';
    state.lastRunSteps = state.selectedStepBudget;
    state.remainingSteps = 0;
    computeMetrics();
    dirty = true;
  }

  function runReducedBatch() {
    for (let step = 0; step < state.selectedStepBudget; step += 1) simulationStep();
    state.reducedMotionBatchCount += 1;
    finishRun();
  }

  function toggleRun(source, kind = 'control', event = null) {
    if (!recordInput(source, kind, 'none', event)) return;
    if (state.running) {
      state.running = false;
      state.phase = 'paused';
      state.pauseCount += 1;
      computeMetrics();
      dirty = true;
      return;
    }
    state.runCount += 1;
    state.remainingSteps = state.selectedStepBudget;
    state.phase = state.reducedMotion ? 'batching' : 'running';
    state.observation = state.reducedMotion ? 'Computing fixed run' : 'Evolution in progress';
    previousFrameAt = performance.now();
    accumulator = 0;
    if (state.reducedMotion) {
      runReducedBatch();
    } else {
      state.running = true;
    }
    dirty = true;
  }

  function pauseWithoutInput() {
    if (!state.running) return;
    state.running = false;
    state.phase = 'paused';
    state.pauseCount += 1;
    computeMetrics();
    dirty = true;
  }

  function singleStep(source, kind = 'keyboard', event = null) {
    if (!recordInput(source, kind, 'none', event)) return;
    pauseWithoutInput();
    simulationStep();
    state.lastRunSteps = 1;
    state.phase = 'observed';
    computeMetrics();
    dirty = true;
  }

  function changeRule(nextRule, source, kind = 'control', event = null) {
    if (!rules[nextRule]) return;
    if (!recordInput(source, kind, 'none', event)) return;
    pauseWithoutInput();
    state.rule = nextRule;
    state.ruleChangeCount += 1;
    state.phase = 'configured';
    state.observation = `${rules[nextRule].label} ready`;
    dirty = true;
  }

  function selectSpecies(index, source, kind = 'control', event = null) {
    if (!recordInput(source, kind, 'none', event)) return;
    state.selectedSpecies = (index + SPECIES_COUNT) % SPECIES_COUNT;
    state.phase = state.running ? 'running' : 'configured';
    state.observation = `${species[state.selectedSpecies].label} intervention`;
    dirty = true;
  }

  function changeStepBudget(budget, source, kind = 'control', event = null) {
    if (![24, 72, 144].includes(budget)) return;
    if (!recordInput(source, kind, 'none', event)) return;
    pauseWithoutInput();
    state.selectedStepBudget = budget;
    state.phase = 'configured';
    state.observation = `${state.selectedStepBudget} steps selected`;
    dirty = true;
  }

  function resetFromInput(source, kind = 'control', event = null) {
    if (!recordInput(source, kind, 'none', event)) return;
    state.resetCount += 1;
    if (state.pointerCaptured && state.activePointerId !== null && stage.hasPointerCapture(state.activePointerId)) {
      stage.releasePointerCapture(state.activePointerId);
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
    resetAgents();
  }

  function setInterventionFromPointer(event, record = false) {
    const bounds = stage.getBoundingClientRect();
    state.interventionX = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width));
    state.interventionY = clamp((event.clientY - bounds.top) / Math.max(1, bounds.height));
    state.interventionActive = true;
    state.interventionCount += record ? 1 : 0;
    state.phase = state.running ? 'running' : 'configured';
    state.observation = `${species[state.selectedSpecies].label} beacon placed`;
    dirty = true;
  }

  function advanceSimulation(now) {
    if (!state.running || state.reducedMotion) return;
    const elapsed = clamp((now - previousFrameAt) / 1000, 0, .08);
    previousFrameAt = now;
    accumulator += elapsed;
    const fixedInterval = 1 / 30;
    let stepsThisFrame = 0;
    while (accumulator >= fixedInterval && state.running && stepsThisFrame < 4) {
      simulationStep();
      accumulator -= fixedInterval;
      stepsThisFrame += 1;
      if (state.remainingSteps <= 0) finishRun();
    }
    if (stepsThisFrame > 0) dirty = true;
  }

  function resizeSketch() {
    if (!sketch) return;
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    if (sketch.width !== width || sketch.height !== height) {
      sketch.resizeCanvas(width, height, true);
      state.canvasWidth = width;
      state.canvasHeight = height;
      dirty = true;
    }
  }

  function ruleLinkTarget(sourceSpecies) {
    if (state.rule === 'mutualism') return [1, 2, 1][sourceSpecies];
    if (state.rule === 'territory') return sourceSpecies;
    return (sourceSpecies + 1) % SPECIES_COUNT;
  }

  function nearestOfSpecies(agent, targetSpecies) {
    let nearest = null;
    let nearestDistance = Infinity;
    agents.forEach(other => {
      if (other === agent || other.species !== targetSpecies) return;
      const dx = toroidalDelta(agent.x, other.x);
      const dy = toroidalDelta(agent.y, other.y);
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = { other, dx, dy, distance };
      }
    });
    return nearest;
  }

  function syncInterface() {
    const activeRule = rules[state.rule];
    observationOutput.textContent = state.observation;
    mixingOutput.textContent = `${String(state.mixing).padStart(2, '0')}%`;
    cohesionOutput.textContent = `${String(state.cohesion).padStart(2, '0')}%`;
    ruleName.textContent = activeRule.label;
    [relationA, relationB, relationC].forEach((element, index) => { element.textContent = activeRule.relations[index]; });
    ruleControls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rule === state.rule)));
    speciesControls.forEach((button, index) => button.setAttribute('aria-pressed', String(index === state.selectedSpecies)));
    stepCountControl.value = String(state.selectedStepBudget);
    const tiny = stage.clientWidth <= 180 || stage.clientHeight <= 100;
    runToggle.textContent = state.running ? 'Pause' : tiny ? 'Run' : `Run ${state.selectedStepBudget}`;
    runToggle.setAttribute('aria-pressed', String(state.running));
    runToggle.setAttribute('aria-label', state.running ? 'Pause colony simulation' : `Run colony simulation for ${state.selectedStepBudget} steps`);

    stage.dataset.phase = state.phase;
    stage.dataset.rule = state.rule;
    stage.dataset.running = String(state.running);
    stage.dataset.dragging = String(state.dragging);
    stage.dataset.selectedSpecies = String(state.selectedSpecies);
    stage.dataset.stepBudget = String(state.selectedStepBudget);
    stage.dataset.completedSteps = String(state.completedSteps);
    stage.dataset.remainingSteps = String(state.remainingSteps);
    stage.dataset.intervention = state.interventionActive ? `${state.interventionX.toFixed(3)},${state.interventionY.toFixed(3)}` : 'none';
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerInputCount = String(state.pointerInputCount);
    stage.dataset.touchInputCount = String(state.touchInputCount);
    stage.dataset.penInputCount = String(state.penInputCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.controlInputCount = String(state.controlInputCount);
    stage.dataset.lastInput = state.lastInput;
    stage.dataset.lastPointerType = state.lastPointerType;
    stage.dataset.reducedMotion = String(state.reducedMotion);
    stage.setAttribute('aria-label', `${activeRule.label} colony sandbox. ${state.observation}. ${state.completedSteps} deterministic steps completed.`);
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function' && state.p5Instance && state.initialStaticConfirmed && state.renderCount > 1) {
      try {
        stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
      } catch {
        stage.dataset.runtimeAssert = 'false';
      }
    }
  }

  sketch = new p5(instance => {
    instance.setup = () => {
      instance.pixelDensity(1);
      const width = Math.max(1, Math.round(stage.clientWidth));
      const height = Math.max(1, Math.round(stage.clientHeight));
      instance.createCanvas(width, height).parent(host);
      instance.noLoop();
      state.canvasWidth = width;
      state.canvasHeight = height;
      state.p5Instance = instance instanceof p5;
      resolveSetup();
    };

    instance.draw = () => {
      const width = instance.width;
      const height = instance.height;
      const compact = width <= 420 || height <= 250;
      const tiny = width <= 180 || height <= 100;
      const dotSize = clamp(width * .0045, tiny ? .75 : 1.15, 3.4);
      const context = instance.drawingContext;
      state.renderCount += 1;

      instance.background('#07100e');
      context.save();
      const fieldWash = context.createRadialGradient(width * .64, height * .48, 0, width * .64, height * .48, Math.max(width, height) * .7);
      fieldWash.addColorStop(0, 'rgba(30,56,43,.34)');
      fieldWash.addColorStop(.55, 'rgba(9,28,22,.16)');
      fieldWash.addColorStop(1, 'rgba(2,9,8,0)');
      context.fillStyle = fieldWash;
      context.fillRect(0, 0, width, height);
      context.restore();

      instance.stroke(114, 138, 120, tiny ? 13 : 19);
      instance.strokeWeight(1);
      const columns = tiny ? 9 : compact ? 12 : 16;
      const rows = tiny ? 5 : compact ? 7 : 9;
      for (let column = 1; column < columns; column += 1) instance.line(column / columns * width, 0, column / columns * width, height);
      for (let row = 1; row < rows; row += 1) instance.line(0, row / rows * height, width, row / rows * height);

      instance.noFill();
      species.forEach((entry, speciesIndex) => {
        const members = agents.filter(agent => agent.species === speciesIndex);
        const centerX = members.reduce((sum, agent) => sum + agent.x, 0) / members.length * width;
        const centerY = members.reduce((sum, agent) => sum + agent.y, 0) / members.length * height;
        const radius = members.reduce((sum, agent) => sum + Math.hypot(agent.x * width - centerX, agent.y * height - centerY), 0) / members.length;
        instance.stroke(entry.color[0], entry.color[1], entry.color[2], tiny ? 24 : 35);
        instance.circle(centerX, centerY, Math.max(dotSize * 8, radius * 1.65));
      });

      context.save();
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < agents.length; index += tiny ? 9 : compact ? 7 : 5) {
        const agent = agents[index];
        const target = nearestOfSpecies(agent, ruleLinkTarget(agent.species));
        if (!target || target.distance > .075 * .075 || Math.abs(target.dx) > .25 || Math.abs(target.dy) > .25) continue;
        const entry = species[agent.species];
        context.strokeStyle = `rgba(${entry.color.join(',')},${state.rule === 'territory' ? .08 : .13})`;
        context.lineWidth = tiny ? .25 : .55;
        context.beginPath();
        context.moveTo(agent.x * width, agent.y * height);
        context.lineTo((agent.x + target.dx) * width, (agent.y + target.dy) * height);
        context.stroke();
      }
      context.restore();

      agents.forEach(agent => {
        const entry = species[agent.species];
        const x = agent.x * width;
        const y = agent.y * height;
        if ((state.completedSteps > 0 || state.running) && Math.abs(agent.x - agent.previousX) < .2 && Math.abs(agent.y - agent.previousY) < .2) {
          instance.stroke(entry.color[0], entry.color[1], entry.color[2], tiny ? 35 : 50);
          instance.strokeWeight(Math.max(.35, dotSize * .28));
          instance.line(agent.previousX * width, agent.previousY * height, x, y);
        }
        instance.noStroke();
        context.shadowColor = `rgba(${entry.color.join(',')},.68)`;
        context.shadowBlur = tiny ? 2 : dotSize * 3.2;
        instance.fill(entry.color[0], entry.color[1], entry.color[2], 218);
        instance.circle(x, y, dotSize * (1.15 + agent.neighborCount / 50));
      });
      context.shadowBlur = 0;

      if (state.interventionActive) {
        const x = state.interventionX * width;
        const y = state.interventionY * height;
        const entry = species[state.selectedSpecies];
        instance.noFill();
        instance.stroke(entry.color[0], entry.color[1], entry.color[2], 205);
        instance.strokeWeight(tiny ? .5 : 1.2);
        instance.circle(x, y, tiny ? 8 : compact ? 17 : 25);
        instance.circle(x, y, tiny ? 3 : 6);
        instance.line(x - (tiny ? 6 : 14), y, x + (tiny ? 6 : 14), y);
        instance.line(x, y - (tiny ? 6 : 14), x, y + (tiny ? 6 : 14));
      }

      syncInterface();
    };
  }, host);

  const isControlTarget = target => target instanceof Element && Boolean(target.closest('.sandbox-controls'));

  stage.addEventListener('pointerdown', event => {
    if (isControlTarget(event.target)) return;
    event.preventDefault();
    const pointerType = event.pointerType || 'mouse';
    if (!recordInput(`pointer-${pointerType}-intervention`, 'pointer', pointerType, event)) return;
    state.dragging = true;
    state.activePointerId = event.pointerId;
    state.pointerCaptured = typeof stage.setPointerCapture === 'function';
    if (state.pointerCaptured) stage.setPointerCapture(event.pointerId);
    setInterventionFromPointer(event, true);
  });

  stage.addEventListener('pointermove', event => {
    if (!state.dragging || event.pointerId !== state.activePointerId) return;
    event.preventDefault();
    state.pointerMoveCount += 1;
    setInterventionFromPointer(event);
  });

  const finishPointer = event => {
    if (!state.dragging || event.pointerId !== state.activePointerId) return;
    const shouldRelease = state.pointerCaptured && stage.hasPointerCapture(event.pointerId);
    state.dragging = false;
    state.pointerCaptured = false;
    state.activePointerId = null;
    if (shouldRelease) stage.releasePointerCapture(event.pointerId);
    dirty = true;
  };
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);

  stage.addEventListener('keydown', event => {
    if (isControlTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'r') {
      event.preventDefault();
      resetFromInput('keyboard-R', 'keyboard', event);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleRun(`keyboard-${event.key === ' ' ? 'Space' : 'Enter'}`, 'keyboard', event);
      return;
    }
    if (event.key === '.') {
      event.preventDefault();
      singleStep('keyboard-Period', 'keyboard', event);
      return;
    }
    if (['q', 'w', 'e'].includes(key)) {
      event.preventDefault();
      changeRule(ruleKeys[['q', 'w', 'e'].indexOf(key)], `keyboard-${key.toUpperCase()}`, 'keyboard', event);
      return;
    }
    if (['a', 's', 'd'].includes(key)) {
      event.preventDefault();
      selectSpecies(['a', 's', 'd'].indexOf(key), `keyboard-${key.toUpperCase()}`, 'keyboard', event);
      return;
    }
    if (['1', '2', '3'].includes(key)) {
      event.preventDefault();
      changeStepBudget([24, 72, 144][Number(key) - 1], `keyboard-${key}-step-budget`, 'keyboard', event);
      return;
    }
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    if (!recordInput(`keyboard-${event.key}`, 'keyboard', 'none', event)) return;
    if (!state.interventionActive) state.interventionActive = true;
    const distance = event.shiftKey ? .08 : .035;
    state.interventionX = clamp(state.interventionX + direction[0] * distance);
    state.interventionY = clamp(state.interventionY + direction[1] * distance);
    state.interventionCount += 1;
    state.phase = state.running ? 'running' : 'configured';
    state.observation = `${species[state.selectedSpecies].label} beacon moved`;
    dirty = true;
  });

  ruleControls.forEach(button => {
    button.addEventListener('click', event => changeRule(button.dataset.rule, `control-rule-${button.dataset.rule}`, 'control', event));
  });
  speciesControls.forEach((button, index) => {
    button.addEventListener('click', event => selectSpecies(index, `control-species-${species[index].id}`, 'control', event));
  });
  stepCountControl.addEventListener('change', event => {
    changeStepBudget(Number(stepCountControl.value), `control-steps-${stepCountControl.value}`, 'control', event);
  });
  runToggle.addEventListener('click', event => toggleRun(state.running ? 'control-pause' : 'control-run', 'control', event));
  resetButton.addEventListener('click', event => resetFromInput('control-reset', 'control', event));

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.running) {
      const steps = state.remainingSteps;
      for (let step = 0; step < steps; step += 1) simulationStep();
      state.reducedMotionBatchCount += 1;
      finishRun();
    }
    dirty = true;
  });

  window.__PARTICLE_LIFE_STATE__ = state;
  window.__PARTICLE_LIFE_AGENTS__ = agents;
  window.__PARTICLE_LIFE_RULES__ = rules;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`emergent-particle-life-colonies: ${message}`);
    };
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const canvasRect = canvas?.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const finiteAgents = agents.every(agent => [agent.x, agent.y, agent.vx, agent.vy].every(Number.isFinite));
    const boundedAgents = agents.every(agent => agent.x >= 0 && agent.x < 1 && agent.y >= 0 && agent.y < 1);
    const exactSpeciesCounts = species.every((_, speciesIndex) => agents.filter(agent => agent.species === speciesIndex).length === AGENTS_PER_SPECIES);
    const initialContract = state.inputCount > 0 || (
      state.initialStaticConfirmed
      && !state.running
      && state.phase === 'idle'
      && state.completedSteps === 0
      && !state.interventionActive
      && agents.every(agent => agent.vx === 0 && agent.vy === 0)
    );
    const reducedMotionContract = !state.reducedMotion || !state.running;

    invariant(state.claimedLibrary === 'p5@2.3.0' && sketch instanceof p5 && state.p5Instance, 'real p5 instance is missing');
    invariant(context instanceof CanvasRenderingContext2D && sketch.drawingContext === context, 'real p5 Canvas2D renderer is missing');
    invariant(agents.length === AGENT_COUNT && AGENT_COUNT === 216 && exactSpeciesCounts, 'three equal colonies are missing');
    invariant(Object.keys(rules).join('|') === 'mutualism|territory|cycle' && Object.values(rules).every(rule => rule.matrix.length === 3 && rule.matrix.every(row => row.length === 3)), 'relationship matrices are invalid');
    invariant(state.fixedSeed === FIXED_SEED && state.deterministicInitialization && !state.randomSourceUsed, 'fixed-seed initialization changed');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.captureClockDriven === false && state.syntheticInputDispatch === false, 'automatic or preview-clock evolution is forbidden');
    invariant(state.task === 'bounded-colony-relationship-experiment' && state.userInputRequired === true && state.acceptedInputs.join('|') === 'mouse|touch|pen|keyboard|control', 'human-owned task contract changed');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|pen|keyboard|control', 'human input contract changed');
    invariant(state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount && state.touchInputCount + state.penInputCount <= state.pointerInputCount, 'trusted input accounting diverged');
    invariant(finiteAgents && boundedAgents, 'particle state is invalid');
    invariant(state.selectedStepBudget === 24 || state.selectedStepBudget === 72 || state.selectedStepBudget === 144, 'step budget is invalid');
    invariant(state.remainingSteps >= 0 && state.completedSteps >= 0 && state.simulationStepCount === state.completedSteps, 'step accounting diverged');
    invariant(!state.running || state.remainingSteps > 0, 'running simulation has no explicit step budget');
    invariant(reducedMotionContract, 'reduced motion must batch directly without continuous evolution');
    invariant(initialContract, 'initial field moved without explicit user input');
    invariant(state.renderCount > 1 && canvas.width === state.canvasWidth && canvas.height === state.canvasHeight, 'p5 render surface is stale');
    invariant(canvasRect.width > 0 && canvasRect.height > 0 && Math.abs(canvasRect.width - stageRect.width) <= Math.max(3, stageRect.width * .02) && Math.abs(canvasRect.height - stageRect.height) <= Math.max(3, stageRect.height * .02), 'particle field escaped the preview');
    invariant(runToggle.type === 'button' && resetButton.type === 'button' && stage.tabIndex === 0 && getComputedStyle(stage).touchAction === 'none', 'controls or accessible stage changed');
    invariant(stage.dataset.rule === state.rule && stage.dataset.running === String(state.running) && Number(stage.dataset.completedSteps) === state.completedSteps, 'DOM simulation evidence is stale');
    invariant(window.__PARTICLE_LIFE_STATE__ === state && window.__PARTICLE_LIFE_AGENTS__ === agents && window.__PARTICLE_LIFE_RULES__ === rules, 'runtime evidence identity changed');
    return true;
  };

  const render = () => {
    resizeSketch();
    advanceSimulation(performance.now());
    syncInterface();
    if (dirty || state.running) {
      dirty = false;
      sketch.redraw();
    }
  };

  syncInterface();
  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([setupReady, document.fonts.ready])
    .then(async () => {
      dirty = true;
      render();
      await doubleFrame();
      const before = stateChecksum();
      dirty = true;
      render();
      await doubleFrame();
      const after = stateChecksum();
      state.initialStateChecksum = before;
      state.initialStaticConfirmed = before === after
        && state.completedSteps === 0
        && !state.running
        && !state.interventionActive
        && agents.every(agent => agent.vx === 0 && agent.vy === 0);
      if (!state.initialStaticConfirmed) throw new Error('Initial colony field changed without explicit user input.');
      dirty = true;
      render();
      await doubleFrame();
      if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial colony runtime assertion failed.');
    });

  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'emergent-particle-life-colonies',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
