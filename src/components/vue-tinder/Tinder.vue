<script setup lang="ts">
import TinderCard from './TinderCard.vue'
import { initStatus } from './status'
import { computed, onBeforeMount, onMounted, reactive, watch } from "vue";

let resizeTimer

const {queue, allowDown} = defineProps({
  // TODO: 考虑添加一个不强制渲染的配置
  allowSuper: {
    type: Boolean,
    default: true
  },
  allowDown: {
    type: Boolean,
    default: false
  },
  queue: {
    type: Array,
    default: () => []
  },
  keyName: {
    type: String,
    default: 'key'
  },
  /**
   * 横向移动直至消失时，移动距离占卡片 "一半宽度" 的比例
   * 因为是占卡片一半宽度的比例，所以默认 0.5 便相当于 1/4（0.5*0.5）卡片宽度
   */
  pointerThreshold: {
    type: Number,
    default: 0.5
  },
  /**
   * 向上移动直至消失时，移动距离占卡片高度的比例
   * 默认移动 1/2 高度便符合移出条件
   */
  superThreshold: {
    type: Number,
    default: 0.5
  },
  downThreshold: {
    type: Number,
    default: 0.5
  },
  // 执行下次操作是否需要等卡片完全消失，默认非同步操作
  sync: {
    type: Boolean,
    default: false
  },
  // 最大渲染数
  max: {
    type: Number,
    default: 3
  },
  scaleStep: {
    type: Number,
    // default: 30
    default: 0.05
  },
  offsetY: {
    type: Number,
    default: 0
  },
  offsetUnit: {
    type: String,
    default: 'px'
  }
})

const data = reactive({
  size: {
    top: 0,
    width: 0,
    height: 0
  },
  state: initStatus(), // 此次触摸及移动坐标等状态
  list: [], // 实际使用的列表，用以与新列表比较，对新列表 item 做唯一处理，避免 dom 被重用
  tinderMounted: false
});


// status() {
//   return data.state.status //TODO use data.status
// },
// 在 x 轴上移动距离相对于卡片一半宽度的比例
const ratio = computed(() => {
  if (data.size.width) {
    const {start, move} = data.state
    const x = move.x - start.x || 0
    const ratio = x / (data.size.width * 0.5)
    return ratio
  }
  return 0
})

// 卡片上喜欢/不喜欢图标的不透明度
const pointerOpacity = computed(() => {
  return this.ratio / this.pointerThreshold
})
const disY = computed(() => {
  if (this.allowSuper || this.allowDown) {
    return data.state.move.y - data.state.start.y
  }
  return 0
})

const superOpacity = computed(() => {
  if (!this.allowSuper) {
    return 0
  }
  const ratio = this.disY / (-this.superThreshold * data.size.height)
  const pointerOpacity = Math.abs(this.pointerOpacity)
  return ratio > pointerOpacity ? ratio : 0
})
const downOpacity = computed(() => {
  if (!allowDown) {
    return 0
  }
  const ratio = this.disY / (this.downThreshold * data.size.height)
  const pointerOpacity = Math.abs(this.pointerOpacity)
  return ratio > pointerOpacity ? ratio : 0
})
const likeOpacity = computed(() => {
  // 如果当前卡片正在往上滑，需要隐藏喜欢/不喜欢
  if (superOpacity.value || downOpacity.value) {
    return 0
  }
  return this.pointerOpacity
})
const nopeOpacity = computed(() => {
  return -likeOpacity.value
})

watch(() => queue, (val) => {
  const keyName = this.keyName
  const newKeys = val.map(item => item[keyName])
  const oldKeys = data.list.map(item => item[keyName])
  this.diff(newKeys, oldKeys)
})

onMounted(() => {
  if (!this.$el.offsetWidth || !this.$el.offsetHeight) {
    /* eslint-disable-next-line */
    console.error('请设置vue-tinder的宽高');
    return
  }
  data.size = {
    top: this.$el.offsetTop,
    width: this.$el.offsetWidth,
    height: this.$el.offsetHeight
  }
  window.onresize = this.getSize
  this.tinderMounted = true
})

onBeforeMount(() => {
  data.list = this.queue.slice(0)
})

onMounted(() => {
  window.removeEventListener('onresize', this.getSize)
})

// 获取组件尺寸及位置，用以决定旋转角度、显示对应状态等
function getSize() {
  clearInterval(resizeTimer)
  resizeTimer = setTimeout(() => {
    data.size = {
      top: this.$el.offsetTop,
      width: this.$el.offsetWidth,
      height: this.$el.offsetHeight
    }
  }, 300)
}

// 当前卡片已经离开
function resetStatus() {
  data.state = initStatus()
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
    <template v-for="(item, index) in list">
      <TinderCard
          v-if="index < max + 1"
          :ready="index === max"
          :key="item.$vtKey || item[keyName]"
          :data-id="item.$vtKey || item[keyName]"
          :index="index"
          :state="state"
          :ratio="ratio"
          :rewind="
          rewindKeys.indexOf(item.$vtKey || item[keyName]) > -1 ? index : false
        "
          :tinder-mounted="tinderMounted"
          :scale-step="scaleStep"
          :offset-y="offsetY"
          :offset-unit="offsetUnit"
          @reverted="resetStatus"
      >
        <slot :data="item" :index="index" :status="status"></slot>
        <template v-if="index === 0 && status !== 2">
          <span
              slot="nope"
              class="pointer-wrap nope-pointer-wrap"
              :style="{ opacity: nopeOpacity }"
          >
            <slot name="nope" :opacity="nopeOpacity"/>
          </span>
          <span
              slot="like"
              class="pointer-wrap like-pointer-wrap"
              :style="{ opacity: likeOpacity }"
          >
            <slot name="like" :opacity="likeOpacity"/>
          </span>
          <span
              v-if="allowSuper"
              slot="super"
              class="pointer-wrap super-pointer-wrap"
              :style="{ opacity: superOpacity }"
          >
            <slot name="super" :opacity="superOpacity"/>
          </span>
          <span
              v-if="allowDown"
              slot="down"
              class="pointer-wrap down-pointer-wrap"
              :style="{ opacity: downOpacity }"
          >
            <slot name="down" :opacity="downOpacity"/>
          </span>
        </template>
        <!-- rewind 指示器显示不需要是第一张卡片，会由内部判断显示 -->
        <span
            v-if="data.state.status === 4"
            slot="rewind"
            class="pointer-wrap rewind-pointer-wrap"
        >
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

/* style正在被数据绑定，只能使用important来覆盖 */
.v-move {
  transition: none !important;
}

.pointer-wrap {
  pointer-events: none;
  transition: opacity 0.2s ease;
}

/* 通过调用函数让卡片消失时需要直接显示对应状态，不需要过渡动画 */
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
