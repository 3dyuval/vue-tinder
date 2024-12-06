<script setup lang="ts">
import Tinder from '@/components/vue-tinder/Tinder.vue'
import source from '@/bing'
import { onMounted, reactive, ref } from "vue"


const tinder = ref<InstanceType<typeof Tinder>>()

const data = reactive({
  queue: [],
  offset: 0,
  history: []
})

onMounted((count = 5, append = true) => {
  const list = []
  for (let i = 0; i < count; i++) {
    list.push({ id: source[data.offset] })
    data.offset++
  }
  if (append) {
    data.queue = data.queue.concat(list)
  } else {
    data.queue.unshift(...list)
  }
})

function onSubmit({ item }) {
  if (data.queue.length < 3) {
    data.mock()
  }
  data.history.push(item)
}

async function decide(choice) {
  if (choice === 'rewind') {
    if (data.history.length) {
      //一个个 rewind
      // tinder.value.rewind([data.history.pop()])
      // 一次性 rewind 全部
      // tinder.value.rewind(data.history)
      // data.history = []
      // 一次随机 rewind 多个
      tinder.value.rewind(
          data.history.splice(-Math.ceil(Math.random() * 3))
      )
      // 非 api调用的添加
      // data.queue.unshift(data.history.pop())
      // data.queue.push(data.history.pop())
      // 非头部添加
      // data.queue.splice(1, 0, data.history.pop())
      // 一次性 rewind 多个，并且含有非头部添加的 item
      // data.queue.unshift(data.history.pop())
      // data.queue.unshift(...data.history)
    }
  } else if (choice === 'help') {
    //
  } else {
    tinder.value.decide(choice)
  }
}



</script>

<template>
  <div id="app">
    <Tinder
        ref="tinder"
        key-name="id"
        v-model:queue="data.queue"
        :max="3"
        :omeffset-y="10"
        allow-down
        @submit="onSubmit"
    >
      <template #default="{ item }">
        <div
            class="pic"
            :style="{
            'background-image': `url(https://cn.bing.com//th?id=OHR.${item.id}_UHD.jpg&pid=hp&w=720&h=1280&rs=1&c=4&r=0)`
          }"
        />
      </template>
      <template #like>
        <img class="like-pointer" src="./assets/like-txt.png" alt="like-pointer"/>
      </template>
      <template #nope>
        <img class="nope-pointer" slot="nope" src="./assets/nope-txt.png" alt="nope-pointer"/>
      </template>
      <template #super>
        <img class="super-pointer" slot="super" src="./assets/super-txt.png" alt="super-pointer"/>
      </template>
      <template #down>
        <img class="down-pointer" slot="down" src="./assets/down-txt.png" alt="down-pointer"/>
      </template>
      <template #rewind>
        <img class="rewind-pointer" slot="rewind" src="./assets/rewind-txt.png" alt="rewind-pointer"/>
      </template>
    </Tinder>
    <div class="btns">
      <img src="./assets/rewind.png" @click="decide('rewind')" alt="rewind"/>
      <img src="./assets/nope.png" @click="decide('nope')" alt="nope"/>
      <img src="./assets/super-like.png" @click="decide('super')" alt="super"/>
      <img src="./assets/like.png" @click="decide('like')" alt="like"/>
      <img src="./assets/help.png" @click="decide('help')" alt="help"/>
    </div>
  </div>
</template>

<style>
html,
body {
  height: 100%;
}

body {
  margin: 0;
  background-color: #20262e;
  overflow: hidden;
}

#app .vue-tinder {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  top: 23px;
  margin: auto;
  width: calc(100% - 20px);
  height: calc(100% - 23px - 65px - 47px - 16px);
  min-width: 300px;
  max-width: 355px;
}

.nope-pointer,
.like-pointer {
  position: absolute;
  z-index: 1;
  top: 20px;
  width: 64px;
  height: 64px;
}

.nope-pointer {
  right: 10px;
}

.like-pointer {
  left: 10px;
}

.super-pointer,
.down-pointer {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  margin: auto;
  width: 112px;
  height: 78px;
}

.super-pointer {
  bottom: 40px;
}

.down-pointer {
  top: 40px;
}

.rewind-pointer {
  position: absolute;
  z-index: 1;
  top: 20px;
  right: 10px;
  width: 112px;
  height: 78px;
}

.pic {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.btns {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 30px;
  margin: auto;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 300px;
  max-width: 355px;
}

.btns img {
  margin-right: 12px;
  box-shadow: 0 4px 9px rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.btns img:nth-child(2n + 1) {
  width: 53px;
}

.btns img:nth-child(2n) {
  width: 65px;
}

.btns img:nth-last-child(1) {
  margin-right: 0;
}

/* .vue-tinder.right-end,
.vue-tinder.left-end {
  transform: translateZ(20px);
}
.vue-tinder.right-end .tinder-card:nth-child(1) {
  animation: rightEnd 0.2s ease-in-out;
}
.vue-tinder.left-end .tinder-card:nth-child(1) {
  animation: leftEnd 0.2s ease-in-out;
}
@keyframes leftEnd {
  50% {
    transform: rotateY(8deg);
  }
}
@keyframes rightEnd {
  50% {
    transform: rotateY(-8deg);
  }
} */
</style>
