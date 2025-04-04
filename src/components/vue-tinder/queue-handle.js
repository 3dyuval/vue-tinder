import { STATUS } from './status'

/**
 * Helper function that finds elements in the first array that aren't in the second array
 * This function stops when it finds the first element that exists in both arrays
 * @param {Array} array - The array to check for unique elements
 * @param {Array} exclude - The array of elements to exclude
 * @returns {Array} Array of elements from 'array' that don't exist in 'exclude'
 */
const difference = (array, exclude) => {
  const result = []
  for (let i = 0; i < array.length; i++) {
    if (exclude.indexOf(array[i]) > -1) {
      // Stop when we find a match in both arrays
      break
    }
    result.push(array[i])
  }
  return result
}

export default {
  data: () => ({
    /**
     * Tracks keys of cards that are in the process of being removed
     * Used to prevent DOM reuse during animations
     */
    leavingKeys: [],
    
    /**
     * Counts the number of cards being rewound in the current operation
     * Used to manage card animations and transitions
     */
    onceRewindCount: 0
  }),
  methods: {
    /**
     * Core queue management method that handles differences between old and new queues
     * Called whenever the queue prop changes via the watcher in Tinder.vue
     * Handles both adding new cards and removing cards from the queue
     * 
     * @param {Array} list - New list of card keys
     * @param {Array} old - Old list of card keys
     */
    diff(list, old) {
      // SECTION 1: Handle new cards or rewound cards being added to the queue
      const keyName = this.keyName
      // Get items that are in the new list but not in the old list
      const add = difference(list, old)
      let onceRewindCount = 0
      
      if (add.length) {
        // Process new cards being added
        for (let i = 0; i < add.length; i++) {
          const item = this.queue[i]
          // Check if this is actually a card that's being added
          if (item[keyName] && add[i] === item[keyName]) {
            onceRewindCount++
            const id = item[keyName]
            const newVueTinderkey = id + Math.random()
            
            // If this card was previously removed/leaving or was being rewound,
            // we need to give it a new key to prevent DOM reuse issues
            if (
              this.leavingKeys.indexOf(item.$vtKey) > -1 ||
              this.leavingKeys.indexOf(id) > -1 ||
              this.rewindKeys.indexOf(item.$vtKey) > -1 ||
              this.rewindKeys.indexOf(id) > -1
            ) {
              // Assign a new unique Vue key to prevent animation conflicts
              item.$vtKey = newVueTinderkey
              
              // Find if this card is being rewound (brought back from history)
              const rewindIndex = Math.max(
                this.rewindKeys.indexOf(item.$vtKey),
                this.rewindKeys.indexOf(id)
              )
              
              // If it's being rewound, update the key in rewindKeys array
              // and set component status to REWINDING
              if (rewindIndex > -1) {
                this.rewindKeys[rewindIndex] = newVueTinderkey
                this.state.status = STATUS.REWINDING
              }
            }
          } else {
            // Stop processing if we find a mismatch
            break
          }
        }
      }
      this.onceRewindCount = onceRewindCount

      // SECTION 2: Handle cards being removed from the queue
      // Get items that were in the old list but aren't in the new list
      const remove = difference(old, list)
      
      if (remove.length) {
        // Track the key of the card being removed to handle animation
        this.leavingKeys.push(this.list[0].$vtKey || this.list[0][keyName])
        
        // Process cards that will become visible due to removal
        // We check cards that are just beyond the visible set (max+1)
        for (let i = this.max + 1; i < this.max + 1 + remove.length; i++) {
          const item = this.list[i]
          if (item) {
            // If this card was previously leaving or hiding,
            // assign it a new key to avoid animation conflicts
            if (
              this.leavingKeys.indexOf(item[keyName]) > -1 ||
              // If card was hidden but will now appear, give it a new key
              // to avoid conflicts with cards that might be disappearing
              this.hidingKeys?.indexOf(item[keyName]) > -1
            ) {
              item.$vtKey = item[keyName] + Math.random()
            }
          }
        }
      }

      // SECTION 3: Update the component's internal list to match the queue
      // This triggers rendering with the new card set
      this.list = this.queue.slice(0)
    }
  }
}
