Feature: Vue Tinder Component
  As a user
  I want to swipe cards in the tinder component
  So that I can navigate through content

  Scenario: Card swiping
    Given the tinder component is loaded with 3 cards
    When I swipe right on a card
    Then the card should move to the right
    And the next card should be displayed