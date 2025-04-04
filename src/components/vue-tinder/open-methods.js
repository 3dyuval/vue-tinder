import { STATUS } from './status'

export default {
  data: () => ({
    /**
     * Array that tracks keys of cards being brought back (rewound)
     * Used in the diff() method to handle animation and component state
     */
    rewindKeys: []
  }),
  methods: {
    /**
     * Public method for making a card decision (like/dislike/etc)
     * Called when a user clicks a decision button or programmatically
     * 
     * @param {String} type Decision type: 'like', 'nope', 'super', or 'down'
     */
    decide(type) {
      // Prevent action if touch is in progress or component is in a non-normal state
      if (this.state.touchId || this.status !== STATUS.NORMAL) {
        return
      }
      
      // Set virtual touch/swipe coordinates based on the decision type
      this.state.start = { x: 0, y: 0 }
      this.state.move = {
        // X movement: -1 for nope (left), 1 for like (right), 0 for super/down
        x: type === 'super' || type === 'down' ? 0 : type === 'like' ? 1 : -1,
        // Y movement: -1 for super (up), 1 for down, 0 for like/nope
        y: type === 'super' ? -1 : type === 'down' ? 1 : 0
      }
      // Set the starting point for rotation calculation
      this.state.startPoint = 1
      
      // Process the card movement
      this.shiftCard(type)
    },
    
    /**
     * Public method to bring back previously swiped cards
     * Adds cards back to the beginning of the queue (prepend)
     * 
     * @param {Array} list Array of card items to rewind
     */
    rewind(list) {
      const keyName = this.keyName
      
      // Track each card's key in rewindKeys for animation handling
      for (const item of list) {
        // Convert to string to avoid type mismatch issues
        this.rewindKeys.push(item[keyName] + '')
      }
      
      // Add the cards to the beginning of the queue
      this.queue.unshift(...list)
    },
    
    /***************** Internal methods (not meant to be called directly) *****************/
    
    /**
     * Removes the top card from the queue based on the decision type
     * Updates component state and emits events
     * 
     * @param {String} type Decision type: 'like', 'nope', 'super', or 'down'
     */
    shiftCard(type) {
      // Update component state to leaving (animating out)
      this.state.status = STATUS.LEAVING
      this.state.result = type
      
      // Remove the first card from the queue
      const item = this.queue.shift()
      
      // Notify parent about queue update via .sync modifier
      this.$emit('update:queue', this.queue)
      
      // Emit the decisiails
      this.submitDecide(type, item)
    },
    
    /**
     * Emits the submit event with decision details
     * Called after a card has been shifted out
     * 
     * @param {String} type Decision type: 'like', 'nope', 'super', or 'down'
     * @param {Object} item The card object being removed
     */
    submitDecide(type, item) {
      this.$emit('submit', { 
        type,              // Decision type
        key: item[this.keyName], // Card's key
        item               // The full card object
      })
    }
  }
}
