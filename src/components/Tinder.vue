<script setup lang="ts">
import TinderCard from './TinderCard.vue';
import { initStatus } from './status';
import { computed, onMounted, reactive, watch } from 'vue';

// Define props
const props = defineProps<{
  allowSuperLike?: boolean;
  allowDown?: boolean;
  queue: Array<Record<string, any>>;
  keyName?: string;
  pointerThreshold?: number;
  superThreshold?: number;
  downThreshold?: number;
  sync?: boolean;
  max?: number;
  scaleStep?: number;
  offsetY?: number;
  offsetUnit?: string;
}>();

// Reactive state
const data = reactive({
  size: {
    top: 0,
    width: 0,
    height: 0
  },
  state: initStatus(),
  list: [] as Array<Record<string, any>>,
  tinderMounted: false
});

// Ratio for x-axis movement
const ratio = computed(() => {
  if (data.size.width) {
    const { start, move } = data.state;
    const x = move.x - start.x || 0;
    return x / (data.size.width * 0.5);
  }
  return 0;
});

// Pointer Opacity
const pointerOpacity = computed(() => {
  return ratio.value / (props.pointerThreshold || 0.5);
});

// Displacement Y Value
const disY = computed(() => {
  return (props.allowSuperLike || props.allowDown) ? (data.state.move.y - data.state.start.y) : 0;
});

// Super Like Opacity
const superOpacity = computed(() => {
  if (!props.allowSuperLike) return 0;
  const ratio = disY.value / (-(props.superThreshold || 0.5) * data.size.height);
  return Math.max(0, ratio - Math.abs(pointerOpacity.value));
});

// Down Opacity
const downOpacity = computed(() => {
  if (!props.allowDown) return 0;
  const ratio = disY.value / ((props.downThreshold || 0.5) * data.size.height);
  return Math.max(0, ratio - Math.abs(pointerOpacity.value));
});

// Like Opacity
const likeOpacity = computed(() => {
  return (superOpacity.value || downOpacity.value) ? 0 : pointerOpacity.value;
});

// Nope Opacity
const nopeOpacity = computed(() => -likeOpacity.value);

// Watch for queue changes
watch(() => props.queue, (newQueue) => {
  // Here you may need to call a method to diff or process new queue if needed
});

// Lifecycle hook for mounting
onMounted(() => {
  if (!data.size.width || !data.size.height) {
    console.error('请设置vue-tinder的宽高');
    return;
  }
  updateSize();
  data.tinderMounted = true;
});

// Update size function
function updateSize() {
  data.size = {
    top: document.documentElement.scrollTop,
    width: document.documentElement.offsetWidth,
    height: document.documentElement.offsetHeight,
  };
}

// Reset status function
function resetStatus() {
  data.state = initStatus();
}
</script>

<template>
  <transition-group
      class="vue-tinder"
      tag="div"
      :css="false"
      @beforeEnter="beforeEnter"
      @leave="leave"
      @touchstart.native="start"
      @touchmove.native="move"
      @touchend.native="end"
      @touchcancel.native="end"
      @mousedown.native="start"
      @mousemove.native="move"
      @mouseup.native="end"
  >
    <template v-for="(item, index) in data.list" :key="item._vtKey || item[props.keyName || 'key']">
      <TinderCard
          v-if="index < (props.max || 3) + 1"
          :ready="index === props.max"
          :data-id="item._vtKey || item[props.keyName || 'key']"
          :index="index"
          :state="data.state"
          :ratio="ratio"
          :rewind="rewindKeys.indexOf(item._vtKey || item[props.keyName]) > -1 ? index : false"
          :tinder-mounted="data.tinderMounted"
          :scale-step="props.scaleStep || 0.05"
          :offset-y="props.offsetY || 0"
          :offset-unit="props.offsetUnit || 'px'"
          @reverted="resetStatus"
      >
        <slot name="default" :data="item" :index="index" :status="data.state.status"></slot>
        <template v-if="index === 0 && data.state.status !== 2">
          <span slot="nope" class="pointer-wrap nope-pointer-wrap" :style="{ opacity: nopeOpacity }">
            <slot name="nope" :opacity="nopeOpacity"/>
          </span>
          <span slot="like" class="pointer-wrap like-pointer-wrap" :style="{ opacity: likeOpacity }">
            <slot name="like" :opacity="likeOpacity"/>
          </span>
          <span v-if="props.allowSuperLike" slot="super" class="pointer-wrap super-pointer-wrap" :style="{ opacity: superOpacity }">
            <slot name="super" :opacity="superOpacity"/>
          </span>
          <span v-if="props.allowDown" slot="down" class="pointer-wrap down-pointer-wrap" :style="{ opacity: downOpacity }">
            <slot name="down" :opacity="downOpacity"/>
          </span>
        </template>
        <span v-if="data.state.status === 4" slot="rewind" class="pointer-wrap rewind-pointer-wrap">
          <slot name="rewind"/>
        </span>
      </TinderCard>
    </template>
  </transition-group>
</template>

<style scoped>
.vue-tinder {
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.v-move {
  transition: none !important;
}

.pointer-wrap {
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.tinder-card.nope .nope-pointer-wrap,
.tinder-card.like .like-pointer-wrap,
.tinder-card.super .super-pointer-wrap,
.tinder-card.down .down-pointer-wrap {
  opacity: 1 !important;
}

.tinder-card.nope .rewind-pointer-wrap,
.tinder-card.like .rewind-pointer-wrap,
.tinder-card.super .rewind-pointer-wrap,
.tinder-card.down .rewind-pointer-wrap {
  display: none;
}
</style>