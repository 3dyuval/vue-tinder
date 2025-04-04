import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber"
import { expect } from 'vitest';
import { mount, VueWrapper } from "@vue/test-utils";
import App from '../src/App.vue'

const feature = await loadFeature('features/tinder.feature')

describeFeature(feature,
    ({
       BeforeAllScenarios,
       AfterAllScenarios,
       BeforeEachScenario,
       AfterEachScenario,
       Scenario
     }) => {


      let wrapper: VueWrapper

      BeforeAllScenarios(() => {

      })

      AfterAllScenarios(() => {

      })

      BeforeEachScenario(() => {
        wrapper = mount(App)
      })

      AfterEachScenario(() => {

      })

      Scenario(`Card swiping`, async ({ Given, When, Then, And }) => {

        Given(`the tinder component is loaded with 3 cards`, async () => {

          const cards = [
            { id: 1, title: 'Card 1' },
            { id: 2, title: 'Card 2' },
            { id: 3, title: 'Card 3' }
          ]

          await wrapper.setProps({ queue: cards })
          const cardElements = wrapper.findAll('.tinder-card')
          expect(cardElements.length).toBe(3)
        })

        When(`I swipe right on a card`, () => {
          expect(false).toBe(true)

        })
        Then(`the card should move to the right`, () => {
          expect(false).toBe(true)

        })
        And(`the next card should be displayed`, () => {
          expect(false).toBe(true)

        })
      })

    })