import Tinder from './Tinder.vue'

Tinder.install = Vue => {
  Vue.component('vue-tinder', Tinder)
}

export default Tinder

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.component('tinder', Tinder)
}
