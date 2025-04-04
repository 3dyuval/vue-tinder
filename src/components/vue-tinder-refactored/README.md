# useCardDeck Composable

A powerful, flexible card deck management system for Vue 3 applications using the Composition API. This composable provides a generic foundation for building card-based UIs like Tinder-style swipeable cards, card games, or any application that needs to manage an ordered collection of items with rich interactions.

## Current Implementation

The `useCardDeck` composable is a reactive card management system with a built-in event hook mechanism for creating rich, decoupled interactions.

### Key Features

- **Generic Implementation**: Works with any type of data
- **Comprehensive Operations**: Add, remove, move, shuffle, and clear items
- **Reactive State**: Full Vue 3 reactivity for responsive UIs
- **Event-Driven Architecture**: Clear separation between state and UI through event hooks
- **Position-Based Operations**: Top/bottom operations for intuitive card stack management

### Core API

```typescript
// Initialize the card deck
const deck = useCardDeck<Card>({
  keyFn: (item) => item.id.toString(), // Function to generate unique keys
  initialItems: [] // Initial cards in the deck
});

// State and computed properties
deck.items         // Reactive array of all cards
deck.isEmpty       // Is the deck empty?
deck.topItem       // The top card in the deck
deck.bottomItem    // The bottom card in the deck
deck.size          // Number of cards in the deck

// Methods
deck.addToTop(card1, card2)     // Add cards to the top
deck.addToBottom(card1, card2)  // Add cards to the bottom
deck.insertAt(index, ...cards)  // Insert cards at specific position
deck.removeTop()                // Remove and return the top card
deck.removeBottom()             // Remove and return the bottom card
deck.removeAt(index)            // Remove card at specific index
deck.move(fromIndex, toIndex)   // Move a card to a new position
deck.cycleTopToBottom()         // Move top card to the bottom
deck.cycleBottomToTop()         // Move bottom card to the top
deck.shuffle()                  // Randomly shuffle the deck
deck.clear()                    // Remove all cards
deck.getAt(index)               // Get card at specific index
deck.replace(newCards)          // Replace all cards

// Event Hooks
deck.onAdd((event) => {})       // When cards are added
deck.onRemove((event) => {})    // When a card is removed
deck.onMove((event) => {})      // When a card changes position
deck.onShuffle(() => {})        // When the deck is shuffled
deck.onClear(() => {})          // When the deck is cleared
deck.onUpdate(() => {})         // After any state change
```

## Evolution Roadmap

The next steps in evolving this composable include:

1. **Custom Events System**: Expand the event hooks to support custom named events (like "swipeRight", "superLike")

2. **Metadata Tracking**: Support for tracking card state (entering, leaving, rewinding) with history

3. **Gesture Integration**: Direct integration with touch/pointer events for handling swipes

4. **Animation Management**: Framework for handling enter/leave/move transitions

5. **Advanced Utilities**: Card sorting, filtering, and grouping operations

6. **Persistent History**: Track card history with undo/redo capabilities 

## Integration Examples

### Basic Usage Example

```vue
<script setup>
import { useCardDeck } from './useCardDeck';

// Initialize with some cards
const deck = useCardDeck({
  initialItems: [
    { id: 1, title: 'Card 1' },
    { id: 2, title: 'Card 2' },
    { id: 3, title: 'Card 3' },
  ]
});

// Log all events
deck.onAdd(event => console.log('Added:', event));
deck.onRemove(event => console.log('Removed:', event));
deck.onUpdate(() => console.log('Deck updated:', deck.items.value));

// Handle a "like" action
function likeCard() {
  const card = deck.removeTop();
  if (card) {
    console.log('Liked card:', card);
  }
}
</script>

<template>
  <div>
    <!-- Render the top 3 cards -->
    <div class="card-stack">
      <div 
        v-for="(card, index) in deck.items.slice(0, 3)" 
        :key="card.id"
        class="card"
        :style="{ zIndex: 3 - index }"
      >
        {{ card.title }}
      </div>
    </div>
    
    <button @click="likeCard">Like</button>
    <button @click="deck.removeTop()">Dislike</button>
    <button @click="deck.shuffle()">Shuffle</button>
  </div>
</template>
```

### Hooking into Touch Events

Here's how you could integrate with touch events (similar to the original `touch-event.js`):

```vue
<script setup>
import { ref } from 'vue';
import { useCardDeck } from './useCardDeck';

// Set up the card deck
const deck = useCardDeck({
  initialItems: [
    { id: 1, title: 'Card 1' },
    { id: 2, title: 'Card 2' },
    { id: 3, title: 'Card 3' },
  ]
});

// Touch state
const touchState = ref({
  touchId: null,
  start: { x: 0, y: 0 },
  move: { x: 0, y: 0 },
  isSwiping: false
});

// Handle touch start
function handleTouchStart(e) {
  if (deck.isEmpty.value || touchState.value.touchId !== null) {
    return;
  }
  
  // Extract touch coordinates
  let pageX, pageY;
  if (e.type === 'touchstart') {
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
    touchState.value.touchId = e.touches[0].identifier;
  } else {
    pageX = e.clientX;
    pageY = e.clientY;
    touchState.value.touchId = 'mouse';
  }
  
  // Update touch state
  touchState.value.start = { x: pageX, y: pageY };
  touchState.value.move = { x: pageX, y: pageY };
  touchState.value.isSwiping = true;
}

// Handle touch move
function handleTouchMove(e) {
  if (!touchState.value.isSwiping) return;
  
  e.preventDefault();
  
  // Extract touch coordinates
  let pageX, pageY;
  if (e.type === 'touchmove') {
    // Check if this is the same touch that started the swipe
    if (touchState.value.touchId !== e.touches[0].identifier) return;
    pageX = e.touches[0].pageX;
    pageY = e.touches[0].pageY;
  } else {
    pageX = e.clientX;
    pageY = e.clientY;
  }
  
  // Update move coordinates
  touchState.value.move = { x: pageX, y: pageY };
}

// Handle touch end
function handleTouchEnd() {
  if (!touchState.value.isSwiping) return;
  
  // Calculate swipe distance
  const deltaX = touchState.value.move.x - touchState.value.start.x;
  const deltaY = touchState.value.move.y - touchState.value.start.y;
  
  // Determine swipe direction based on distance threshold
  const swipeThreshold = 100;
  
  if (Math.abs(deltaX) > swipeThreshold) {
    // Horizontal swipe
    if (deltaX > 0) {
      // Right swipe (like)
      const card = deck.removeTop();
      if (card) {
        console.log('Liked card:', card);
      }
    } else {
      // Left swipe (dislike)
      const card = deck.removeTop();
      if (card) {
        console.log('Disliked card:', card);
      }
    }
  } else if (Math.abs(deltaY) > swipeThreshold) {
    // Vertical swipe
    if (deltaY < 0) {
      // Up swipe (super like)
      const card = deck.removeTop();
      if (card) {
        console.log('Super liked card:', card);
      }
    } else {
      // Down swipe (skip)
      const card = deck.removeTop();
      if (card) {
        console.log('Skipped card:', card);
      }
    }
  }
  
  // Reset touch state
  touchState.value.touchId = null;
  touchState.value.isSwiping = false;
}
</script>

<template>
  <div 
    class="card-stack"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
    @mousedown="handleTouchStart"
    @mousemove="handleTouchMove"
    @mouseup="handleTouchEnd"
  >
    <!-- Render the top 3 cards -->
    <div 
      v-for="(card, index) in deck.items.slice(0, 3)"
      :key="card.id"
      class="card"
      :style="{
        zIndex: 3 - index,
        transform: index === 0 && touchState.isSwiping
          ? `translate(${touchState.move.x - touchState.start.x}px, ${touchState.move.y - touchState.start.y}px) rotate(${(touchState.move.x - touchState.start.x) / 20}deg)`
          : `translateY(${index * 10}px) scale(${1 - index * 0.05})` 
      }"
    >
      {{ card.title }}
    </div>
  </div>
</template>
```

### Creating a Custom Tinder-like Component

Here's how you could build a Tinder-like component on top of `useCardDeck`:

```vue
<script setup>
import { ref, computed, watch } from 'vue';
import { useCardDeck } from './useCardDeck';

// Props
const props = defineProps({
  cards: {
    type: Array,
    default: () => [],
  },
  maxVisible: {
    type: Number,
    default: 3
  }
});

// Emits
const emit = defineEmits([
  'like', 
  'dislike', 
  'superLike', 
  'skip',
  'update:cards'
]);

// Initialize card deck
const deck = useCardDeck({
  keyFn: item => item.id?.toString(),
  initialItems: props.cards
});

// Visible cards
const visibleCards = computed(() => 
  deck.items.value.slice(0, props.maxVisible)
);

// Custom card actions
function likeCard() {
  const card = deck.removeTop();
  if (card) {
    emit('like', card);
  }
}

function dislikeCard() {
  const card = deck.removeTop();
  if (card) {
    emit('dislike', card);
  }
}

function superLikeCard() {
  const card = deck.removeTop();
  if (card) {
    emit('superLike', card);
  }
}

function skipCard() {
  const card = deck.removeTop();
  if (card) {
    emit('skip', card);
  }
}

// Update the parent when the deck changes
deck.onUpdate(() => {
  emit('update:cards', deck.items.value);
});

// Watch for external changes to cards prop
watch(() => props.cards, newCards => {
  if (JSON.stringify(newCards) !== JSON.stringify(deck.items.value)) {
    deck.replace(newCards);
  }
}, { deep: true });

// Expose methods to parent components
defineExpose({
  likeCard,
  dislikeCard,
  superLikeCard,
  skipCard,
  addCards: deck.addToBottom,
  shuffleCards: deck.shuffle
});
</script>

<template>
  <div class="tinder-deck">
    <!-- Card stack -->
    <div class="card-stack">
      <slot
        v-for="(card, index) in visibleCards"
        :name="'card-' + index"
        :card="card"
        :index="index"
      >
        <!-- Default card template if no slot provided -->
        <div 
          :key="card.id"
          class="tinder-card"
          :class="{ 'top-card': index === 0 }"
          :style="{ 
            zIndex: visibleCards.length - index,
            transform: `translateY(${index * 10}px) scale(${1 - index * 0.05})`
          }"
        >
          <slot name="card-content" :card="card" :index="index">
            <div class="card-content">{{ card.title || 'Card #' + card.id }}</div>
          </slot>
        </div>
      </slot>
    </div>
    
    <!-- Action buttons -->
    <div class="action-buttons">
      <slot name="actions" :actions="{ 
        like: likeCard, 
        dislike: dislikeCard, 
        superLike: superLikeCard, 
        skip: skipCard 
      }">
        <button @click="dislikeCard" class="dislike-btn">✕</button>
        <button @click="superLikeCard" class="super-btn">★</button>
        <button @click="likeCard" class="like-btn">♥</button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.tinder-deck {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.card-stack {
  position: relative;
  height: 400px;
}

.tinder-card {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.top-card {
  cursor: grab;
}

.top-card:active {
  cursor: grabbing;
}

.card-content {
  padding: 20px;
  text-align: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.1);
}

.dislike-btn {
  background: #ff4757;
  color: white;
}

.super-btn {
  background: #48dbfb;
  color: white;
}

.like-btn {
  background: #2ed573;
  color: white;
}
</style>
```

## Next Steps for Implementation

To fully implement the Tinder-like experience:

1. **Add custom event hooks**: Extend the composable with hooks for swipe directions

```javascript
// Inside useCardDeck.ts
const swipeRightHook = createEventHook();
const swipeLeftHook = createEventHook();
const swipeUpHook = createEventHook();
const swipeDownHook = createEventHook();

// Add to returned object
return {
  // ... existing properties
  onSwipeRight: swipeRightHook.on,
  onSwipeLeft: swipeLeftHook.on,
  onSwipeUp: swipeUpHook.on,
  onSwipeDown: swipeDownHook.on,
};
```

2. **Add swipe actions that trigger the hooks**:

```javascript 
function swipeRight(item) {
  const card = removeTop();
  if (card) {
    swipeRightHook.trigger(card);
    return card;
  }
  return undefined;
}
```

3. **Implement touch handling** that integrates directly with the deck:

```javascript
// Could be added to useCardDeck or as a separate composable
export function useCardTouch(deck, options = {}) {
  // Touch state implementation
  
  // Connect the touch handlers to the deck operations
  function processSwipe(direction) {
    switch(direction) {
      case 'right': return deck.swipeRight();
      case 'left': return deck.swipeLeft();
      case 'up': return deck.swipeUp();
      case 'down': return deck.swipeDown();
    }
  }
  
  // Return methods for component to use
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Current touch state for animations
    touchState
  };
}
```

By building on this foundation, you can create a fully featured Tinder-like UI that maintains a clean separation between data management and UI interactions.