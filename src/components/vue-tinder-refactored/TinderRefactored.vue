<template>
  <div class="vue-tinder" :class="{ 'swiping': swiping }">
    <transition-group
      tag="div"
      :css="false"
      @before-enter="beforeEnter"
      @leave="leave"
      @touchstart="start"
      @touchmove="move"
      @touchend="end"
      @touchcancel="end"
      @mousedown="start"
      @mousemove="move"
      @mouseup="end"
    >
      <div
        v-for="(item, index) in visibleItems"
        v-if="index < props.max + 1"
        :key="getItemKey(item)"
        :data-id="getItemKey(item)"
        :data-index="index"
        class="tinder-card"
        :class="{
          'leave': queue.isLeaving(item),
          'rewind': queue.isRewinding(item),
          'like': queue.state.result === 'like' && index === 0,
          'nope': queue.state.result === 'nope' && index === 0,
          'super': queue.state.result === 'super' && index === 0,
          'down': queue.state.result === 'down' && index === 0
        }"
        :style="getCardStyle(item, index)"
        @transitionend="onTransitionEnd($event, item)"
      >
        <!-- Default slot for card content -->
        <slot :data="item" :index="index" :status="queue.state.status" />
        
        <!-- Action indicator slots -->
        <template v-if="index === 0 && queue.state.status !== STATUS.LEAVING">
          <!-- Like indicator -->
          <span
            v-if="showLike"
            class="pointer-wrap like-pointer-wrap"
            :style="{ opacity: likeOpacity }"
          >
            <slot name="like" :opacity="likeOpacity" />
          </span>
          
          <!-- Nope indicator -->
          <span
            v-if="showNope"
            class="pointer-wrap nope-pointer-wrap"
            :style="{ opacity: nopeOpacity }"
          >
            <slot name="nope" :opacity="nopeOpacity" />
          </span>
          
          <!-- Super like indicator -->
          <span
            v-if="props.allowSuper && showSuper"
            class="pointer-wrap super-pointer-wrap"
            :style="{ opacity: superOpacity }"
          >
            <slot name="super" :opacity="superOpacity" />
          </span>
          
          <!-- Down indicator -->
          <span
            v-if="props.allowDown && showDown"
            class="pointer-wrap down-pointer-wrap"
            :style="{ opacity: downOpacity }"
          >
            <slot name="down" :opacity="downOpacity" />
          </span>
        </template>
        
        <!-- Rewind indicator -->
        <span
          v-if="queue.isRewinding(item)"
          class="pointer-wrap rewind-pointer-wrap"
        >
          <slot name="rewind" />
        </span>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useQueue } from './useQueue';
import { STATUS } from '../vue-tinder/status';

// Define props
const props = withDefaults(defineProps<{
  items?: any[];
  keyName?: string;
  max?: number;
  allowSuper?: boolean;
  allowDown?: boolean;
  pointerThreshold?: number;
  superThreshold?: number;
  downThreshold?: number;
  scaleStep?: number;
  offsetY?: number;
  offsetUnit?: string;
}>(), {
  items: () => [],
  keyName: 'id',
  max: 3,
  allowSuper: true,
  allowDown: false,
  pointerThreshold: 0.5,
  superThreshold: 0.5,
  downThreshold: 0.5,
  scaleStep: 0.05,
  offsetY: 0,
  offsetUnit: 'px'
});

// Define emits
const emit = defineEmits(['update:items', 'submit']);

// Set up the queue with our items
const queue = useQueue({
  keyName: props.keyName,
  initialItems: props.items,
  onSubmit: (data) => emit('submit', data),
  onQueueChange: (items) => emit('update:items', items)
});

// Component state
const size = ref({ width: 0, height: 0, top: 0 });
const swiping = ref(false);
const leavedCount = ref(0);

// Computed values for visible items
const visibleItems = computed(() => {
  return queue.items.value.slice(0, props.max + 1);
});

// Calculate swipe ratios and pointer opacities
const ratio = computed(() => {
  if (size.value.width) {
    const { start, move } = queue.state;
    const x = move.x - start.x || 0;
    return x / (size.value.width * 0.5);
  }
  return 0;
});

const pointerOpacity = computed(() => {
  return ratio.value / props.pointerThreshold;
});

const disY = computed(() => {
  if (props.allowSuper || props.allowDown) {
    return queue.state.move.y - queue.state.start.y;
  }
  return 0;
});

const superOpacity = computed(() => {
  if (!props.allowSuper) return 0;
  
  const value = disY.value / (-props.superThreshold * size.value.height);
  const pointerValue = Math.abs(pointerOpacity.value);
  return value > pointerValue ? value : 0;
});

const downOpacity = computed(() => {
  if (!props.allowDown) return 0;
  
  const value = disY.value / (props.downThreshold * size.value.height);
  const pointerValue = Math.abs(pointerOpacity.value);
  return value > pointerValue ? value : 0;
});

const likeOpacity = computed(() => {
  if (superOpacity.value || downOpacity.value) return 0;
  return pointerOpacity.value;
});

const nopeOpacity = computed(() => {
  return -likeOpacity.value;
});

// Computed values for pointer visibility
const showLike = computed(() => likeOpacity.value > 0);
const showNope = computed(() => nopeOpacity.value > 0);
const showSuper = computed(() => superOpacity.value > 0);
const showDown = computed(() => downOpacity.value > 0);

// Watch for changes in props.items
watch(() => props.items, (newItems) => {
  // Update the queue items if the input props change
  if (newItems && newItems.length > 0) {
    // Replace the queue with the new items
    queue.clear();
    newItems.forEach(item => queue.push(item));
  }
}, { deep: true });

// Component methods
function getItemKey(item: any): string {
  return item[props.keyName]?.toString() || '';
}

function getSize() {
  const el = document.querySelector('.vue-tinder');
  if (el) {
    size.value = {
      top: el.getBoundingClientRect().top,
      width: el.clientWidth,
      height: el.clientHeight
    };
  }
}

function getCardStyle(item: any, index: number) {
  if (!queue.isRewinding(item) && !queue.isLeaving(item)) {
    // Normal card in the stack
    const scale = 1 - props.scaleStep * index;
    let translateY = 0;
    
    if (props.offsetY) {
      const inverse = props.offsetY < 0;
      const offsetY = Math.abs(props.offsetY);
      let y = index * offsetY;
      let offsetScale = ((1 - scale) / 2) * 100;
      
      if (inverse) {
        y *= -1;
        offsetScale *= -1;
      }
      
      translateY = `calc(${offsetScale}% + ${y}${props.offsetUnit})`;
    }
    
    if (index === 0 && queue.state.status === STATUS.MOVING) {
      // Moving the top card
      const { start, move, startPoint } = queue.state;
      const x = move.x - start.x || 0;
      const y = move.y - start.y || 0;
      
      // Apply rotation based on horizontal movement
      const rotate = 10 * ratio.value * startPoint;
      
      return {
        zIndex: 100 - index,
        transform: `translate3d(${x}px,${y}px,0) rotate(${rotate}deg)`,
        transition: 'none'
      };
    }
    
    // Static card in the stack
    return {
      zIndex: 100 - index,
      transform: `translate3d(0,${translateY},0) scale3d(${scale},${scale},1)`,
      transition: 'transform 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275), z-index 0s'
    };
  }
  
  // Let CSS handle styles for cards that are leaving or rewinding
  return {
    zIndex: queue.isLeaving(item) ? 1000000 - leavedCount.value : 100 - index
  };
}

function beforeEnter(el: HTMLElement) {
  const index = parseInt(el.dataset.index || '0', 10) + 1;
  el.style.opacity = '0';
  
  if (queue.isRewinding(el)) {
    // Setup for rewind animation
    let x = -1; // From left side
    x += size.value.width * (x < 0 ? -0.5 : 0.5);
    const ratio = x / (size.value.width * 0.5);
    const rotate = (ratio / (0.8 / 0.5)) * 15 * 1;
    el.style.transform = `translate3d(${x}px, 0, 0) rotate(${rotate}deg)`;
  } else {
    // Setup for normal entry
    const scale = 1 - props.scaleStep * index;
    el.style.transform = `translate3d(0,0,0) scale3d(${scale},${scale},1)`;
  }
  
  el.style.transition = 'all 0s';
}

function leave(el: HTMLElement, done: () => void) {
  const itemId = el.dataset.id;
  const item = queue.items.value.find(item => getItemKey(item) === itemId);
  
  if (!item) {
    done();
    return;
  }
  
  if (queue.isLeaving(item)) {
    // Handle leaving animation for swiped card
    const { start, move, startPoint } = queue.state;
    let x = move.x - start.x || 0;
    let y = move.y - start.y || 0;
    
    if (queue.state.result === 'super') {
      y -= size.value.width;
    } else if (queue.state.result === 'down') {
      y += size.value.width;
    } else {
      x += size.value.width * (x < 0 ? -0.5 : 0.5);
      y *= x / (move.x - start.x || 1);
    }
    
    const calcRatio = x / (size.value.width * 0.5);
    const rotate = (calcRatio / (0.8 / 0.5)) * 15 * startPoint;
    
    // Determine animation duration
    const duration = queue.state.touchId === null ||
                      queue.state.result === 'super' ||
                      queue.state.result === 'down'
                        ? 800 : 300;
    
    // Apply leaving styles
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rotate}deg)`;
    el.style.zIndex = (1000000 - leavedCount.value++).toString();
    el.style.transition = `all ${duration}ms ease, z-index 0s`;
  } else {
    // Handle hiding animation for cards beyond the visible limit
    el.style.opacity = '0';
    el.style.transition = 'all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275), z-index 0s';
  }
  
  // Handle transition end
  el.addEventListener('transitionend', function handler(e) {
    if (e.propertyName === 'transform') {
      el.removeEventListener('transitionend', handler);
      done();
    }
  });
}

function onTransitionEnd(e: TransitionEvent, item: any) {
  if (e.target === e.currentTarget && e.propertyName === 'transform') {
    // Reset rewinding status after animation completes
    if (queue.isRewinding(item)) {
      queue.resetRewindStatus(item);
    }
    
    // Reset queue status if needed
    if (queue.state.status === STATUS.LEAVING || queue.state.status === STATUS.REVERT) {
      queue.resetStatus();
    }
  }
}

// Touch/mouse event handlers
function start(e: MouseEvent | TouchEvent) {
  if (
    queue.state.touchId !== null ||
    queue.state.status === STATUS.LEAVING ||
    queue.state.status === STATUS.REVERT ||
    queue.state.status === STATUS.REWINDING ||
    !queue.firstItem.value
  ) {
    return;
  }
  
  let pageX: number, pageY: number;
  
  if ('touches' in e) {
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
  } else {
    pageX = e.clientX;
    pageY = e.clientY;
  }
  
  // Determine touch start position relative to card center
  const centerY = size.value.top + size.value.height / 2;
  const startPoint = pageY > centerY ? -1 : 1;
  
  // Initialize swipe state
  queue.state.status = STATUS.MOVING;
  queue.state.touchId = 'touches' in e ? e.touches[0].identifier : 'mouse';
  queue.state.start = {
    x: pageX,
    y: pageY
  };
  queue.state.move = { x: 0, y: 0 };
  queue.state.startPoint = startPoint;
  queue.state.result = null;
  
  swiping.value = true;
}

function move(e: MouseEvent | TouchEvent) {
  e.preventDefault();
  
  if (
    queue.state.touchId === null ||
    queue.state.status !== STATUS.MOVING ||
    ('touches' in e && queue.state.touchId !== e.touches[0].identifier)
  ) {
    return;
  }
  
  let pageX: number, pageY: number;
  
  if ('touches' in e) {
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
  } else {
    pageX = e.clientX;
    pageY = e.clientY;
  }
  
  // Update move coordinates
  queue.state.move = {
    x: pageX,
    y: pageY
  };
}

function end() {
  swiping.value = false;
  
  if (queue.state.status !== STATUS.MOVING) {
    return;
  }
  
  // Check if the swipe was significant enough for an action
  if (
    Math.abs(pointerOpacity.value) >= 1 ||
    superOpacity.value >= 1 ||
    downOpacity.value >= 1
  ) {
    const result =
      superOpacity.value >= 1
        ? 'super'
        : downOpacity.value >= 1
        ? 'down'
        : pointerOpacity.value > 0
        ? 'like'
        : 'nope';
    
    // Remove the card with the appropriate result
    queue.decide(result);
  } else {
    // Reset to normal state if no action taken
    queue.resetStatus();
  }
}

// Public methods exposed to parent components
defineExpose({
  // Allow parent to call these methods
  decide: queue.decide,
  rewind: queue.rewind,
  getQueue: () => queue.items.value,
  resetStatus: queue.resetStatus
});

// Lifecycle hooks
onMounted(() => {
  getSize();
  window.addEventListener('resize', getSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', getSize);
});
</script>

<style scoped>
.vue-tinder {
  position: relative;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.tinder-card {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fefefe;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.pointer-wrap {
  pointer-events: none;
  transition: opacity 0.2s ease;
  position: absolute;
  z-index: 1;
}

.nope-pointer-wrap,
.like-pointer-wrap {
  top: 20px;
}

.nope-pointer-wrap {
  right: 10px;
}

.like-pointer-wrap {
  left: 10px;
}

.super-pointer-wrap,
.down-pointer-wrap {
  left: 0;
  right: 0;
  margin: auto;
}

.super-pointer-wrap {
  bottom: 40px;
}

.down-pointer-wrap {
  top: 40px;
}

.rewind-pointer-wrap {
  top: 20px;
  right: 10px;
}

/* Action states */
.tinder-card.like .like-pointer-wrap,
.tinder-card.nope .nope-pointer-wrap,
.tinder-card.super .super-pointer-wrap,
.tinder-card.down .down-pointer-wrap {
  opacity: 1 !important;
}

/* Transition animation for rewind indicator */
.tinder-rewind-leave-active {
  transition: all 0.5s ease;
}

.tinder-rewind-leave-to {
  opacity: 0;
}
</style>