import { reactive } from 'vue';

interface TransformConfig {
  scaleStep: number;
  offsetY: number;
  offsetUnit: string;
  max: number;
}

const defaultTransformConfig = {
  scaleStep: 0.05,
  offsetY: 0,
  offsetUnit: 'px',
  max: 3,
}

export function useCardAnimation(config: TransformConfig = defaultTransformConfig) {

  const state = reactive({
    leavedCount: 0,
    hideIndex: 50,
    lastHideIndex: 50,
    hidingKeys: [] as string[],
  });

  const beforeEnter = (el: HTMLElement) => {
    const beforeIndex = parseInt(el.dataset.index || '0') + 1;
    el.style.opacity = '0';
    el.style.transform = getTransform(beforeIndex, config);
  };

  const leave = (el: HTMLElement, done: () => void) => {
    const { x, y } = calculateElementMovement(el);
    const duration = calculateDuration(el, state);
    applyLeaveStyles(el, x, y, state, duration);

    el.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'transform') {
        resetIndexes();
        done();
      }
    });

  };

  function calculateElementMovement(el: HTMLElement) {
    const { start, move, result } = (el as any).state;
    const width = el.offsetWidth;
    let x = move.x - start.x || 0;
    let y = move.y - start.y || 0;

    if (result === 'super') {
      y -= width;
    } else if (result === 'down') {
      y += width;
    } else {
      x += width * (x < 0 ? -0.5 : 0.5);
      y *= x / (move.x - start.x);
    }

    return { x, y };
  }

  function calculateDuration(el: HTMLElement, state: { leavedCount: number }) {
    return (el as any).state.touchId === null ||
    (el as any).state.result === 'super' ||
    (el as any).state.result === 'down'
        ? 800
        : 300;
  }

  function applyLeaveStyles(el: HTMLElement, x: number, y: number, state: { leavedCount: number }, duration: number) {
    const ratio = x / (el.offsetWidth * 0.5);
    const rotate = (ratio / (0.8 / 0.5)) * 15 * (el as any).state.startPoint;

    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rotate}deg)`;
    el.style.zIndex = `${1000000 - state.leavedCount++}`;
    el.style.transition = `all ${duration}ms ease, z-index 0s`;
  }

  function resetIndexes() {
    if (state.lastHideIndex === state.hideIndex) {
      state.lastHideIndex = 50;
      state.hideIndex = 50;
    }
  }



  function getTransform(index: number, config: TransformConfig): string {
    const { scaleStep, offsetY, offsetUnit } = config;
    const scale = 1 - scaleStep * index;
    let translateY = 0 as any;

    if (offsetY) {
      const inverse = offsetY < 0;
      const absOffsetY = Math.abs(offsetY);
      let y = index * absOffsetY;
      let offsetScale = ((1 - scale) / 2) * 100;

      if (inverse) {
        y *= -1;
        offsetScale *= -1;
      }

      translateY = `calc(${offsetScale}% + ${y}${offsetUnit})`;
    }

    return `translate3d(0,${translateY},0) scale3d(${scale},${scale},1)`;
  }

  return {
    beforeEnter,
    leave,
  };
}