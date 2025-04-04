import { STATUS } from './status'

export default {
  data: () => ({
    /**
     * Counter for removed cards
     * Each removed card gets a high z-index (10000+) to ensure proper stacking
     * during animations and prevent overlap with visible cards
     */
    leavedCount: 0,
    
    /**
     * Z-index tracking for hidden cards
     * Starting from 50 and changing dynamically based on card movements
     */
    hideIndex: 50,
    lastHideIndex: 50,
    
    /**
     * Tracks keys of cards that have been hidden (due to index > max)
     * Used in the diff() function to prevent DOM reuse issues during animations
     * when cards are being removed while others are being hidden
     */
    hidingKeys: []
  }),
  methods: {
    /**
     * Called before a new card enters the DOM
     * Sets up initial styles for the entering card animation
     * 
     * @param {HTMLElement} el The card element that's entering
     */
    beforeEnter(el) {
      // Calculate initial position based on index + 1
      const beforeIndex = el.dataset.index - 0 + 1
      
      // Initially hidden
      el.style.opacity = 0
      
      // Position card based on its index using the transform helper
      el.style.transform = this.getTransform(beforeIndex)
      
      // Special handling for rewound cards (cards coming back from history)
      if (this.rewindKeys.indexOf(el.dataset.id) > -1) {
        // Position card as if it's coming from the left edge (like a rewind)
        let x = -1 // From left side
        x += this.size.width * (x < 0 ? -0.5 : 0.5)
        const ratio = x / (this.size.width * 0.5)
        const rotate = (ratio / (0.8 / 0.5)) * 15 * 1
        el.style.transform = `translate3d(${x}px, 0, 0) rotate(${rotate}deg)`
      }
      
      // Disable transitions initially
      el.style.transition = 'all 0s'
    },
    
    /**
     * Handles card removal animations
     * Called when a card is leaving the DOM (after swiping/deciding)
     * 
     * @param {HTMLElement} el The card element that's leaving
     * @param {Function} done Callback to be called when transition is complete
     */
    leave(el, done) {
      const state = this.state
      const { start, move, startPoint } = state
      
      // Calculate movement distance based on current state
      let x = move.x - start.x || 0
      let y = move.y - start.y || 0
      
      // Adjust final position based on the result type
      if (state.result === 'super') {
        // Super like - moves upward
        y -= this.size.width
      } else if (state.result === 'down') {
        // Down - moves downward
        y += this.size.width
      } else {
        // Like/nope - moves left/right
        // Add extra movement to ensure card goes fully off screen
        x += this.size.width * (x < 0 ? -0.5 : 0.5)
        // Adjust y proportionally to maintain angle
        y *= x / (move.x - start.x)
      }
      
      // Calculate rotation based on movement ratio
      const ratio = x / (this.size.width * 0.5)
      const rotate = (ratio / (0.8 / 0.5)) * 15 * startPoint
      
      // Set animation duration based on action type
      let duration =
        state.touchId === null ||
        state.result === 'super' ||
        state.result === 'down'
          ? 800   // Programmatic decision (button click) or vertical movement
          : 300   // User touch/drag (faster animation)
      
      // Common styles for leaving cards
      el.style.opacity = 0
      el.style['pointer-events'] = 'none'
      
      // Handle two different leaving scenarios:
      if (this.leavingKeys.indexOf(el.dataset.id) > -1) {
        // SCENARIO 1: Card is being removed by swipe/decision
        // Add the result class (like/nope/etc)
        el.className += ` ${state.result}`
        
        // Transform to final position with rotation
        el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rotate}deg)`
        
        // Ensure proper stacking order during animation
        // Cards that leave first should appear on top
        el.style.zIndex = 1000000 - this.leavedCount++
      } else {
        // SCENARIO 2: Card is being hidden because it's beyond the visible limit
        // (happens after rewinding, when there are more cards than max)
        
        // Track this card as being hidden
        this.hidingKeys.push(el.dataset.id)
        
        // Use a consistent animation for hiding
        duration = 500
        
        // Calculate new position based on index and rewind count
        const index =
          Math.min(this.max, this.onceRewindCount) + (el.dataset.index - 0)
        
        // Transform to the "hidden stack" position
        el.style.transform = this.getTransform(index)
        
        // Get appropriate z-index for this hidden card
        el.style.zIndex = this.getHideIndex(el.dataset.index - 0)
      }
      
      // Set up transition properties
      // Use cubic-bezier for rewound cards, ease for normal swiping
      el.style.transition = `all ${duration}ms ${
        duration === 500 ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease'
      },z-index 0s`
      
      // Listen for animation completion
      el.addEventListener('transitionend', e => {
        if (e.propertyName === 'transform') {
          // Reset hideIndex if this was the last hidden card
          if (this.lastHideIndex === el.style.zIndex - 0) {
            this.lastHideIndex = 50
            this.hideIndex = 50
          }
          
          // If sync mode is enabled, reset status when animation completes
          if (
            this.sync &&
            (this.status === STATUS.NORMAL || this.status === STATUS.LEAVING)
          ) {
            this.resetStatus()
          }
          
          // Tell Vue this transition is complete
          done()
        }
      })
      
      // If not in sync mode and this is the first card (index=0),
      // reset status immediately (don't wait for animation)
      if (
        !this.sync &&
        el.dataset.index - 0 === 0 &&
        this.status !== STATUS.REWINDING
      ) {
        this.resetStatus()
      }
    },
    
    /**
     * Calculates appropriate z-index for hidden cards
     * Handles complex scenarios with multiple rewinds
     * 
     * @param {Number} index The card's index
     * @returns {Number} The z-index to apply
     */
    getHideIndex(index) {
      const max = this.max
      let cur
      
      if (index === max) {
        if (this.lastHideIndex > this.hideIndex) {
          // There was a higher index before, reset hideIndex
          // to avoid conflicts with main cards
          cur = this.hideIndex
          this.hideIndex += 1 + max
        } else {
          // Normal increment
          cur = this.hideIndex++
        }
      } else {
        // Calculate based on distance from max
        cur = this.hideIndex + max - index
      }
      
      // Track the last index used
      this.lastHideIndex = cur
      return cur
    },
    
    /**
     * Generates transform string for card positioning
     * Handles scaling and vertical offset based on card index
     * 
     * @param {Number} index The card's index
     * @returns {String} CSS transform value
     */
    getTransform(index) {
      // Calculate scale based on index and scale step
      const scale = 1 - this.scaleStep * index
      let translateY = 0
      
      // Apply vertical offset if configured
      if (this.offsetY) {
        const inverse = this.offsetY < 0
        const offsetY = Math.abs(this.offsetY)
        let y = index * offsetY
        
        // Calculate percentage offset based on scale difference
        let offsetScale = ((1 - scale) / 2) * 100
        
        // Adjust direction based on inverse setting
        if (inverse) {
          y *= -1
          offsetScale *= -1
        }
        
        // Create CSS calc expression for precise positioning
        translateY = `calc(${offsetScale}% + ${y}${this.offsetUnit})`
      }
      
      // Return complete transform with translate and scale
      return `translate3d(0,${translateY},0) scale3d(${scale},${scale},1)`
    }
  }
}
