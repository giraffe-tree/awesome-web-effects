import { arrow, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const anchorElement = document.querySelector('#anchor');
  const popover = document.querySelector('#popover');
  const arrowElement = document.querySelector('#popover-arrow');
  const placementLabel = document.querySelector('#placement');
  let lastResult = null;

  const render = async time => {
    const x = 20 + (Math.sin(time * 1.2) * .5 + .5) * 250;
    const y = 38 + (Math.cos(time * 1.55) * .5 + .5) * 104;
    anchorElement.style.left = `${x}px`;
    anchorElement.style.top = `${y}px`;

    const result = await computePosition(anchorElement, popover, {
      placement: 'top',
      strategy: 'fixed',
      middleware: [offset(8), flip({ fallbackAxisSideDirection: 'start' }), shift({ padding: 6 }), arrow({ element: arrowElement })]
    });
    lastResult = result;
    Object.assign(popover.style, { left: `${result.x}px`, top: `${result.y}px` });
    placementLabel.textContent = result.placement;

    const { x: arrowX, y: arrowY } = result.middlewareData.arrow || {};
    const side = result.placement.split('-')[0];
    const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];
    Object.assign(arrowElement.style, {
      left: arrowX == null ? '' : `${arrowX}px`,
      top: arrowY == null ? '' : `${arrowY}px`,
      right: '',
      bottom: '',
      [staticSide]: '-4px'
    });
  };
  window.__PREVIEW_RUNTIME_ASSERT__ = () => Boolean(lastResult?.middlewareData?.shift && lastResult?.middlewareData?.arrow);

  installPreviewController({
    id: 'anchored-popover-flip-and-shift',
    library: '@floating-ui/dom@1.8.0',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
