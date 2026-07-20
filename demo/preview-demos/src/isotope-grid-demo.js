import Isotope from 'isotope-layout';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#catalog-stage');
  const grid = document.querySelector('#isotope-grid');
  const items = [...grid.querySelectorAll('.grid-item')];
  const images = [...grid.querySelectorAll('.item-photo')];
  const filterControls = document.querySelector('#filter-controls');
  const sortControls = document.querySelector('#sort-controls');
  const filterButtons = [...document.querySelectorAll('.filter-button')];
  const sortButtons = [...document.querySelectorAll('.sort-button')];
  const status = document.querySelector('#collection-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const expectedFiles = [
    '01-folding-field-tool.jpg',
    '03-enamel-field-mug.jpg',
    '05-clothbound-field-journal.jpg',
    '02-field-binoculars.jpg',
    '04-waxed-canvas-pouch.jpg',
    '06-archival-slide-tray.jpg',
  ];
  const filterLabels = {
    all: 'All',
    'field-tools': 'Field tools',
    'camp-utility': 'Camp utility',
    'field-archive': 'Field archive',
  };

  const state = {
    id: 'filterable-grid-reflow',
    automaticFiltering: false,
    automaticSorting: false,
    syntheticInput: false,
    automaticFallback: false,
    filter: 'all',
    sort: 'curated',
    inputKind: 'none',
    inputCount: 0,
    filterChangeCount: 0,
    sortChangeCount: 0,
    arrangeCount: 0,
    arrangePending: false,
    layoutComplete: false,
    layoutCompleteCount: 0,
    layoutEventCount: 0,
    visibleCount: items.length,
    totalCount: items.length,
    renderCount: 0,
    reducedMotion: reducedMotion.matches,
    imagesReady: false,
    assetSourceValid: false,
    sourceCount: 0,
    initialStaticVerified: false,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let resolveInitialLayout;
  const initialLayoutReady = new Promise(resolve => { resolveInitialLayout = resolve; });

  const isotope = new Isotope(grid, {
    itemSelector: '.grid-item',
    layoutMode: 'fitRows',
    initLayout: false,
    resizeContainer: false,
    transitionDuration: reducedMotion.matches ? '0s' : '.46s',
    getSortData: {
      curated: element => Number(element.dataset.rank),
      name: element => element.dataset.name.toLocaleLowerCase('en'),
    },
    sortAscending: {
      curated: true,
      name: true,
    },
  });

  function updateControls() {
    filterButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
    });
    sortButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.sort === state.sort));
    });
  }

  function updateStatus() {
    const sortLabel = state.sort === 'name' ? 'A–Z' : 'Curated';
    status.value = `${state.visibleCount} ${state.visibleCount === 1 ? 'object' : 'objects'} · ${filterLabels[state.filter]} · ${sortLabel}`;
    status.textContent = status.value;
  }

  isotope.on('layoutComplete', () => {
    state.layoutEventCount += 1;
    if (!state.arrangePending) {
      state.layoutComplete = true;
      state.layoutCompleteCount += 1;
      resolveInitialLayout?.();
      resolveInitialLayout = null;
    }
  });

  isotope.on('arrangeComplete', filteredItems => {
    state.arrangePending = false;
    state.layoutComplete = true;
    state.layoutCompleteCount += 1;
    state.visibleCount = filteredItems.length;
    updateStatus();
  });

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
  }

  function selectorForFilter(filter) {
    return filter === 'all' ? '*' : `.category-${filter}`;
  }

  function arrangeCollection() {
    state.arrangePending = true;
    state.layoutComplete = false;
    state.arrangeCount += 1;
    isotope.updateSortData();
    isotope.arrange({
      filter: selectorForFilter(state.filter),
      sortBy: state.sort,
      sortAscending: true,
    });
    state.visibleCount = isotope.filteredItems.length;
    updateStatus();
  }

  function applyFilter(filter, inputKind) {
    recordInput(inputKind);
    if (!Object.hasOwn(filterLabels, filter) || state.filter === filter) return;
    state.filter = filter;
    state.filterChangeCount += 1;
    updateControls();
    arrangeCollection();
  }

  function applySort(sort, inputKind) {
    recordInput(inputKind);
    if (!['curated', 'name'].includes(sort) || state.sort === sort) return;
    state.sort = sort;
    state.sortChangeCount += 1;
    updateControls();
    arrangeCollection();
  }

  [...filterButtons, ...sortButtons].forEach(button => {
    button.addEventListener('pointerdown', event => {
      latestPointerKind = event.pointerType || 'pointer';
    });
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', event => {
      applyFilter(button.dataset.filter, event.detail === 0 ? 'keyboard' : latestPointerKind);
    });
  });

  sortButtons.forEach(button => {
    button.addEventListener('click', event => {
      applySort(button.dataset.sort, event.detail === 0 ? 'keyboard' : latestPointerKind);
    });
  });

  function installArrowNavigation(container, buttons, valueKey, applyValue) {
    container.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const current = buttons.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus({ preventScroll: true });
      applyValue(buttons[next].dataset[valueKey], 'keyboard');
    });
  }

  installArrowNavigation(filterControls, filterButtons, 'filter', applyFilter);
  installArrowNavigation(sortControls, sortButtons, 'sort', applySort);

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    isotope.options.transitionDuration = event.matches ? '0s' : '.46s';
  });

  function sourceMatches(image, filename) {
    const path = decodeURIComponent(new URL(image.currentSrc || image.src, location.href).pathname);
    const exactSourcePath = `/assets/aesthetic-wave-02/filterable-grid-reflow/${filename}`;
    if (path.endsWith(exactSourcePath)) return true;
    const stem = filename.replace(/\.jpg$/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`/assets/${stem}-[A-Za-z0-9_-]+\\.jpg$`).test(path);
  }

  const imageReady = Promise.all(images.map(image => image.decode())).then(() => {
    state.imagesReady = true;
    state.sourceCount = new Set(images.map(image => image.currentSrc)).size;
    state.assetSourceValid = images.every((image, index) => (
      image.naturalWidth === 800
      && image.naturalHeight === 600
      && sourceMatches(image, expectedFiles[index])
    ));
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  updateControls();
  updateStatus();
  isotope.layout();

  const ready = Promise.all([imageReady, initialLayoutReady, document.fonts.ready]).then(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticVerified = state.filter === 'all'
      && state.sort === 'curated'
      && state.inputCount === 0
      && state.filterChangeCount === 0
      && state.sortChangeCount === 0
      && state.arrangeCount === 0
      && state.visibleCount === items.length
      && state.automaticFiltering === false
      && state.automaticSorting === false
      && state.syntheticInput === false;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const stageBounds = stage.getBoundingClientRect();
    const gridBounds = grid.getBoundingClientRect();
    const visibleItems = isotope.filteredItems.map(item => item.element);
    const visibleBounds = visibleItems.map(item => item.getBoundingClientRect());
    const visibleFit = visibleBounds.every(bounds => (
      bounds.left >= gridBounds.left - 1
      && bounds.top >= gridBounds.top - 1
      && bounds.right <= gridBounds.right + 1
      && bounds.bottom <= gridBounds.bottom + 1
      && bounds.width > 0
      && bounds.height > 0
    ));
    const activeFilterButtons = filterButtons.filter(button => button.getAttribute('aria-pressed') === 'true');
    const activeSortButtons = sortButtons.filter(button => button.getAttribute('aria-pressed') === 'true');
    return Boolean(
      isotope.items.length === items.length
      && items.length === 6
      && images.length === 6
      && state.imagesReady
      && state.assetSourceValid
      && state.sourceCount === 6
      && state.initialStaticVerified
      && state.automaticFiltering === false
      && state.automaticSorting === false
      && state.syntheticInput === false
      && state.automaticFallback === false
      && ['all', 'field-tools', 'camp-utility', 'field-archive'].includes(state.filter)
      && ['curated', 'name'].includes(state.sort)
      && state.layoutComplete
      && state.arrangePending === false
      && state.visibleCount === visibleItems.length
      && state.visibleCount >= 2
      && state.visibleCount <= state.totalCount
      && activeFilterButtons.length === 1
      && activeFilterButtons[0].dataset.filter === state.filter
      && activeSortButtons.length === 1
      && activeSortButtons[0].dataset.sort === state.sort
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.filterChangeCount)
      && Number.isInteger(state.sortChangeCount)
      && Number.isInteger(state.arrangeCount)
      && Number.isInteger(state.layoutCompleteCount)
      && Number.isInteger(state.renderCount)
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && visibleFit
      && stageBounds.width >= innerWidth * .99
      && stageBounds.height >= innerHeight * .99
      && gridBounds.left >= -1
      && gridBounds.right <= innerWidth + 1
      && gridBounds.top >= -1
      && gridBounds.bottom <= innerHeight + 1
      && state.renderCount > 0
    );
  };

  installPreviewController({
    id: 'filterable-grid-reflow',
    library: 'isotope-layout@3.0.6',
    renderer: 'dom',
    render: () => { state.renderCount += 1; },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
