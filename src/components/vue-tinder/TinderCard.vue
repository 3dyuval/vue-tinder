<script setup lang="ts">
import { STATUS } from './status'
import { computed, onMounted, reactive, watch } from "vue"

type TinderCardProps = {
  tinderMounted: boolean;
  index: number;
  created: any;  // Define the appropriate type if known
  ready?: boolean;
  state: Record<string, any>;
  ratio?: number;
  rewind?: number | boolean;
  scaleStep: number;
  offsetY: number;
  offsetUnit: string;
};

const { index, created } = defineProps<TinderCardProps>();

const data = reactive({
  inited: false,
  scopedRewind: false,
  willDestory: false
})

const curScale = computed(() => this.scaleStep * this.index)

const isCur = computed(() => this.index === 0)

const style = computed(() => {
  if (!data.inited) {
    return {}
  }
  // 借 inited 的变化覆盖在 beforeEnter 中设置的样式
  const status = this.state.status
  if (status === STATUS.MOVING) {
    return this.movingStyle
  } else {
    return this.normalStyle
  }
})

const normalStyle = computed(() => {
  if (this.isCur) {
    return {
      opacity: 1,
      transform: `translate3d(0,0,0) rotate(0) scale3d(1,1,1)`,
      transition: `all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275), z-index 0s`
    }
  }
  return {
    opacity: this.ready ? 0 : 1,
    transform: this.getTransform(),
    transition: `all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
        data.scopedRewind ? data.scopedRewind * 80 : 0
    }ms, z-index 0s` // 正在 rewind 的 item 的 transition 要与主卡片一致
  }
})

const movingStyle = computed(() => {
  const style = { transition: 'none' }
  if (this.isCur) {
    // 移动中，位移及旋转角度
    const state = this.state
    const { start, move, startPoint } = state
    const x = move.x - start.x || 0
    const y = move.y - start.y || 0
    // 横向滑动卡片一半宽(0.5)时为标准状态
    const rotate = 10 * this.ratio * startPoint
    style['transform'] = `translate3d(${x}px,${y}px,0) rotate(${rotate}deg)`
  } else {
    let ratio = Math.abs(this.ratio)
    if (ratio > 1) {
      ratio = 1
    }
    if (this.ready) {
      style['opacity'] = ratio * 1
    }
    style['transform'] = this.getTransform(ratio)
  }
  return style
})


watch(() => index, (val, oldVal) => {
  // 从本来需要 rewind 过渡到新的目标位置，不需要 delay
  // 如果层级提升需要隐藏，避免快速操作出现闪现 bug
  if (val < oldVal) {
    data.scopedRewind = false
  }
})

watch(() => created, () => {
  data.scopedRewind = this.rewind
  if (!this.tinderMounted) {
    data.inited = true
  }
})

onMounted(() => {
  // 必须要包裹 requestAnimationFrame，保证在 beforeEnter 执行之后
  requestAnimationFrame(() => {
    data.inited = true
  })
})

// 回归原位，可以重置 vue-tinder 状态
function transitionEnd(e) {
  if (e.target === e.currentTarget && e.propertyName === 'transform') {
    // 需要在回到原位后隐藏 rewind slot
    data.scopedRewind = false
    if (this.isCur) {
      const status = this.state.status
      if (status === STATUS.REVERT || status === STATUS.REWINDING) {
        this.$emit('reverted')
      }
    }
  }
}

function getTransform(ratio) {
  const index = this.index
  let translateY = 0
  let scale = 1 - this.scaleStep * index
  if (ratio) {
    scale += ratio * this.scaleStep
  }
  if (this.offsetY) {
    const inverse = this.offsetY < 0
    const offsetY = Math.abs(this.offsetY)
    let y = index * offsetY
    let offsetScale = ((1 - scale) / 2) * 100
    if (ratio) {
      y -= ratio * offsetY
    }
    if (inverse) {
      y *= -1
      offsetScale *= -1
    }
    translateY = `calc(${offsetScale}% + ${y}${this.offsetUnit})`
  }
  return `translate3d(0,${translateY},0) scale3d(${scale},${scale},1)`
}


</script>

<template>
  <div
      :data-index="index"
      class="tinder-card"
      :style="[{ zIndex: 100 - index }, style]"
      @transitionend="transitionEnd"
  >
    <slot/>
    <slot name="nope"/>
    <slot name="like"/>
    <slot name="super"/>
    <slot name="down"/>
    <transition name="tinder-rewind">
      <slot name="rewind" v-if="!data.scopedRewind"/>
    </transition>
  </div>
</template>

<style scoped>
.tinder-card {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fefefe;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.tinder-rewind-leave-active {
  transition: all 0.5s ease;
}

.tinder-rewind-leave-to {
  opacity: 0;
}
</style>
