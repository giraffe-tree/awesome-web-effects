import { getProject } from '@theatre/core';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const positions = [0, .7, 1.5, 2.25, 3];
const handles = [
  [.5, .5, .24, .06],
  [.74, .94, .28, .12],
  [.72, .9, .24, .08],
  [.76, .96, .3, .1],
  [.72, .94, .5, .5]
];

const makeTrack = (id, debugName, values) => ({
  type: 'BasicKeyframedTrack',
  __debugName: debugName,
  keyframes: values.map((value, index) => ({
    id: `${id}-${index}`,
    value,
    position: positions[index],
    handles: handles[index],
    connectedRight: index < values.length - 1
  }))
});

const projectState = {
  sheetsById: {
    Scene: {
      staticOverrides: { byObject: {} },
      sequence: {
        type: 'PositionalSequence',
        length: 3,
        subUnitsPerUnit: 30,
        tracksByObject: {
          'Hero Card': {
            trackIdByPropPath: {
              '["x"]': 'hero-x',
              '["y"]': 'hero-y',
              '["rotation"]': 'hero-rotation',
              '["scale"]': 'hero-scale',
              '["roundness"]': 'hero-roundness',
              '["tone"]': 'hero-tone'
            },
            trackData: {
              'hero-x': makeTrack('x', 'Hero Card.x', [-86, -28, 66, 24, -86]),
              'hero-y': makeTrack('y', 'Hero Card.y', [18, -22, 10, -28, 18]),
              'hero-rotation': makeTrack('rotation', 'Hero Card.rotation', [-12, 8, -5, 14, -12]),
              'hero-scale': makeTrack('scale', 'Hero Card.scale', [.72, 1.08, 1.18, .9, .72]),
              'hero-roundness': makeTrack('roundness', 'Hero Card.roundness', [8, 22, 12, 28, 8]),
              'hero-tone': makeTrack('tone', 'Hero Card.tone', [185, 255, 325, 395, 545])
            }
          }
        }
      }
    }
  },
  definitionVersion: '0.4.0',
  revisionHistory: ['visually-authored-keyframe-sequence-v1']
};

try {
  const actorElement = document.querySelector('#theatre-actor');
  const timeReadout = document.querySelector('#time-readout');
  const playhead = document.querySelector('#playhead');
  const timelineKeyframes = [...document.querySelectorAll('.timeline-keyframe')];
  const project = getProject('Authored Keyframe Sequence', { state: projectState });
  const sheet = project.sheet('Scene');
  const actor = sheet.object('Hero Card', {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    roundness: 12,
    tone: 185
  });

  const applyValues = ({ x, y, rotation, scale, roundness, tone }) => {
    actorElement.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
    actorElement.style.borderRadius = `${roundness}px`;
    actorElement.style.backgroundColor = `hsl(${tone} 82% 66%)`;
    actorElement.style.setProperty('--tone', tone);
  };
  actor.onValuesChange(applyValues);

  const xKeyframes = sheet.sequence.__experimental_getKeyframes(actor.props.x);
  const rotationKeyframes = sheet.sequence.__experimental_getKeyframes(actor.props.rotation);
  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    project.address.projectId === 'Authored Keyframe Sequence'
    && sheet.address.sheetId === 'Scene'
    && actor.address.objectKey === 'Hero Card'
    && sheet.sequence.type === 'Theatre_Sequence_PublicAPI'
    && xKeyframes.length === 5
    && rotationKeyframes.length === 5
    && xKeyframes[2].position === 1.5
  );

  const render = time => {
    const position = time % 3;
    sheet.sequence.position = position;
    applyValues(actor.value);
    const progress = position / 3;
    timeReadout.textContent = `${position.toFixed(2)} s`;
    playhead.style.left = `${4.7 + progress * 90.6}%`;
    timelineKeyframes.forEach(marker => {
      marker.classList.toggle('passed', Number(marker.dataset.position) <= position + .02);
    });
  };

  installPreviewController({
    id: 'visually-authored-keyframe-sequence',
    library: '@theatre/core@0.7.2',
    renderer: 'dom',
    render,
    ready: Promise.all([project.ready, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
