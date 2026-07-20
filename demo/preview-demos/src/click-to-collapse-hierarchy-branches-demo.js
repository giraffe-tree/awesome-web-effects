import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { cosineLoop } from './batch-c-utils.js';

try {
  const svg = document.querySelector('#tree-svg');
  const nodeLayer = document.querySelector('#tree-nodes');
  const edgeLayer = document.querySelector('#tree-edges');
  const state = document.querySelector('#tree-state');
  const NS = 'http://www.w3.org/2000/svg';
  const nodes = [
    { id: 0, label: 'CONCEPT', parent: null, expanded: [205, 45], collapsed: [205, 45] },
    { id: 1, label: 'TYPE', parent: 0, expanded: [145, 85], collapsed: [165, 92] },
    { id: 2, label: 'LIGHT', parent: 0, expanded: [205, 85], collapsed: [205, 92] },
    { id: 3, label: 'SOUND', parent: 0, expanded: [265, 85], collapsed: [245, 92] },
    { id: 4, label: 'VOICE', parent: 1, expanded: [130, 135], collapsed: [165, 92] },
    { id: 5, label: 'RHYTHM', parent: 1, expanded: [165, 135], collapsed: [165, 92] },
    { id: 6, label: 'SHADOW', parent: 2, expanded: [200, 135], collapsed: [198, 138] },
    { id: 7, label: 'GLOW', parent: 2, expanded: [235, 135], collapsed: [220, 138] },
    { id: 8, label: 'TONE', parent: 3, expanded: [270, 135], collapsed: [245, 92] }
  ];
  const edges = nodes.filter(node => node.parent !== null).map(node => {
    const pathElement = document.createElementNS(NS, 'path');
    pathElement.classList.add('tree-edge');
    edgeLayer.append(pathElement);
    return { node, path: pathElement };
  });
  const controls = nodes.map(node => {
    const group = document.createElementNS(NS, 'g');
    group.classList.add('tree-node');
    if (node.id === 0) group.classList.add('root');
    group.dataset.id = node.id;
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('r', node.id === 0 ? '22' : '17');
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('dy', '2');
    text.textContent = node.label;
    group.append(circle, text);
    nodeLayer.append(group);
    const control = animate(group, {
      x: [node.expanded[0], node.collapsed[0]],
      y: [node.expanded[1], node.collapsed[1]],
      opacity: [1, node.id >= 4 && ![6, 7].includes(node.id) ? 0 : 1]
    }, { duration: 1, ease: [.25, .65, .2, 1] });
    control.pause();
    return { group, control };
  });
  let forced = null;
  const toggle = () => { forced = forced === 1 ? 0 : 1; };
  nodeLayer.addEventListener('click', toggle);
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    toggle();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    controls.length === 9 &&
    controls.every(item => typeof item.control.pause === 'function' && 'time' in item.control) &&
    edges.length === 8
  );
  installPreviewController({
    id: 'click-to-collapse-hierarchy-branches',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render: time => {
      const progress = forced ?? cosineLoop(time);
      controls.forEach(item => { item.control.time = progress; });
      const position = node => ({
        x: node.expanded[0] + (node.collapsed[0] - node.expanded[0]) * progress,
        y: node.expanded[1] + (node.collapsed[1] - node.expanded[1]) * progress
      });
      edges.forEach(({ node, path: edge }) => {
        const a = position(nodes[node.parent]);
        const b = position(node);
        edge.style.opacity = node.id >= 4 && ![6, 7].includes(node.id) ? 1 - progress : 1;
        edge.setAttribute('d', `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}`);
      });
      state.textContent = progress > .52 ? 'COLLAPSED' : 'EXPANDED';
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
