import Isotope from 'isotope-layout';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const grid = document.querySelector('#isotope-grid');
  const items = [...grid.querySelectorAll('.grid-item')];
  const pills = [...document.querySelectorAll('.filter-pill')];
  let currentPhase = -1;

  const isotope = new Isotope(grid, {
    itemSelector: '.grid-item',
    layoutMode: 'fitRows',
    transitionDuration: '.32s',
    getSortData: {
      rank: element => Number(element.dataset.rank || 0)
    },
    sortAscending: true
  });
  window.__PREVIEW_RUNTIME_ASSERT__ = () => isotope.items.length === items.length && isotope.options.transitionDuration === '.32s';

  const filterNames = ['all', 'warm', 'cool', 'featured'];
  const render = time => {
    const phase = Math.floor(time * 2) % 12;
    if (phase === currentPhase) return;
    currentPhase = phase;
    const activeFilter = filterNames[phase % filterNames.length];
    items.forEach((item, index) => {
      item.dataset.rank = String((index * 7 + phase * 3) % items.length);
    });
    isotope.updateSortData();
    isotope.arrange({
      filter: element => activeFilter === 'all' || element.classList.contains(activeFilter),
      sortBy: 'rank'
    });
    pills.forEach(pill => pill.classList.toggle('active', pill.dataset.filterLabel === activeFilter));
  };

  installPreviewController({
    id: 'filterable-grid-reflow',
    library: 'isotope-layout@3.0.6',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
