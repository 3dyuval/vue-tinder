import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber"
import { mount, type VueWrapper } from "@vue/test-utils"
import { expect } from "vitest"
import Tinder from '../../src/components/vue-tinder/Tinder.vue'

const feature = await loadFeature('tests/features/tinder.feature')

describeFeature(feature, ({ Scenario }) => {
  Scenario('Card swiping', ({ Given, When, Then, And }) => {
    let wrapper: VueWrapper
    const cards = [
      { id: 1, title: 'Card 1' },
      { id: 2, title: 'Card 2' },
      { id: 3, title: 'Card 3' }
    ]

    Given('the tinder component is loaded with 3 cards', () => {
      wrapper = mount(Tinder, {
        props: {
          queue: cards
        }
      })
      expect(wrapper.vm.queue.length).toBe(3)
    })

    When('I swipe right on a card', async () => {
      // Simulate a swipe right action
      await wrapper.vm.like()
    })

    Then('the card should move to the right', () => {
      // Check that the first card was removed from the queue
      expect(wrapper.vm.queue.length).toBe(2)
    })

    And('the next card should be displayed', () => {
      // Check that the next card is now at the top
      expect(wrapper.vm.queue[0].id).toBe(2)
    })
  })
})