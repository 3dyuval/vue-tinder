import { ref, reactive, computed } from 'vue';
import { STATUS } from '../vue-tinder/status';

/**
 * Composable function that provides queue functionality with reactive state
 * @param options Configuration options for the queue
 * @returns Object containing queue state and methods
 */
export function useQueue<T>(options: {
  keyName?: string;
  initialItems?: T[];
  onSubmit?: (data: { type: string; key: any; item: T }) => void;
  onQueueChange?: (items: T[]) => void;
} = {}) {
  // Default options
  const {
    keyName = 'id',
    initialItems = [],
    onSubmit,
    onQueueChange
  } = options;
  
  // Reactive state
  const items = ref<T[]>([...initialItems]);
  const rewindKeys = ref<string[]>([]);
  const leavingKeys = ref<string[]>([]);
  
  // Queue state - similar to original vue-tinder state
  const state = reactive({
    status: STATUS.NORMAL,
    touchId: null as string | null,
    start: { x: 0, y: 0 },
    move: { x: 0, y: 0 },
    startPoint: 1,
    result: null as string | null
  });
  
  // Computed properties
  const isEmpty = computed(() => items.value.length === 0);
  const firstItem = computed(() => items.value[0]);
  const size = computed(() => items.value.length);
  
  /**
   * Helper to get unique key for an item
   */
  const getItemKey = (item: T): string => {
    // @ts-ignore - Using string indexing but TypeScript doesn't know shape of T
    const key = item[keyName];
    return key?.toString() || '';
  };
  
  /**
   * Helper to notify about queue changes
   */
  const notifyQueueChange = () => {
    if (onQueueChange) {
      onQueueChange([...items.value]);
    }
  };

  /**
   * Add an item to the end of the queue
   */
  const push = (...newItems: T[]): number => {
    if (newItems.length === 0) return items.value.length;
    
    items.value.push(...newItems);
    notifyQueueChange();
    
    return items.value.length;
  };

  /**
   * Remove the first item from the queue
   */
  const shift = (metadata: Record<string, any> = {}): T | undefined => {
    if (items.value.length === 0) return undefined;
    
    const item = items.value.shift();
    if (!item) return undefined;
    
    // Track this item as leaving
    leavingKeys.value.push(getItemKey(item));
    
    // Notify about queue change
    notifyQueueChange();
    
    // Emit submit event (like original vue-tinder)
    if (onSubmit) {
      onSubmit({
        type: metadata.type || 'unknown',
        key: getItemKey(item),
        item
      });
    }
    
    return item;
  };

  /**
   * Add items to the beginning of the queue
   */
  const unshift = (...newItems: T[]): number => {
    if (newItems.length === 0) return items.value.length;
    
    // Track these items as being rewound
    for (const item of newItems) {
      rewindKeys.value.push(getItemKey(item));
    }
    
    items.value.unshift(...newItems);
    notifyQueueChange();
    
    return items.value.length;
  };

  /**
   * Remove an item at a specific index
   */
  const removeAt = (index: number, metadata: Record<string, any> = {}): T | undefined => {
    if (index < 0 || index >= items.value.length) return undefined;
    
    const [item] = items.value.splice(index, 1);
    if (!item) return undefined;
    
    // Track this item as leaving
    leavingKeys.value.push(getItemKey(item));
    
    // Notify about queue change
    notifyQueueChange();
    
    // Emit submit event if it's the first item
    if (index === 0 && onSubmit) {
      onSubmit({
        type: metadata.type || 'unknown',
        key: getItemKey(item),
        item
      });
    }
    
    return item;
  };

  /**
   * Move an item from one position to another
   */
  const move = (fromIndex: number, toIndex: number): boolean => {
    if (
      fromIndex < 0 || 
      fromIndex >= items.value.length || 
      toIndex < 0 || 
      toIndex >= items.value.length ||
      fromIndex === toIndex
    ) {
      return false;
    }
    
    const item = items.value[fromIndex];
    items.value.splice(fromIndex, 1);
    items.value.splice(toIndex, 0, item);
    
    notifyQueueChange();
    
    return true;
  };

  /**
   * Move the last item to the beginning of the queue
   */
  const cycle = (): boolean => {
    if (items.value.length <= 1) return false;
    
    const lastItem = items.value.pop();
    if (lastItem) {
      return unshift(lastItem) > 0;
    }
    
    return false;
  };

  /**
   * Clear all items from the queue
   */
  const clear = (): void => {
    if (items.value.length === 0) return;
    
    items.value = [];
    notifyQueueChange();
  };

  /**
   * Check if an item is currently being rewound
   */
  const isRewinding = (item: T): boolean => {
    return rewindKeys.value.includes(getItemKey(item));
  };

  /**
   * Check if an item is currently leaving
   */
  const isLeaving = (item: T): boolean => {
    return leavingKeys.value.includes(getItemKey(item));
  };

  /**
   * Reset the rewind status for an item
   */
  const resetRewindStatus = (item: T): void => {
    const itemKey = getItemKey(item);
    const index = rewindKeys.value.indexOf(itemKey);
    
    if (index !== -1) {
      rewindKeys.value.splice(index, 1);
    }
  };

  /**
   * Reset the leaving status for an item
   */
  const resetLeavingStatus = (item: T): void => {
    const itemKey = getItemKey(item);
    const index = leavingKeys.value.indexOf(itemKey);
    
    if (index !== -1) {
      leavingKeys.value.splice(index, 1);
    }
  };

  /**
   * Reset the queue state to normal
   */
  const resetStatus = (): void => {
    state.status = STATUS.NORMAL;
    state.touchId = null;
    state.result = null;
  };
  
  /**
   * Make a decision on the current card (swipe it)
   */
  const decide = (type: string): void => {
    // Check if we can perform an action (same checks as original)
    if (state.touchId !== null || state.status !== STATUS.NORMAL) {
      return;
    }

    // Set up the state for the appropriate animation
    state.start = { x: 0, y: 0 };
    state.move = {
      x: type === 'super' || type === 'down' ? 0 : type === 'like' ? 1 : -1,
      y: type === 'super' ? -1 : type === 'down' ? 1 : 0
    };
    state.startPoint = 1;
    
    // Update state to indicate card is leaving
    state.status = STATUS.LEAVING;
    state.result = type;
    
    // Remove the card with the decision metadata
    shift({ type });
  };
  
  /**
   * Get an item at a specific index
   */
  const getAt = (index: number): T | undefined => {
    return items.value[index];
  };

  /**
   * Rewind items (add them back to the beginning)
   */
  const rewind = (itemsToRewind: T[]): number => {
    return unshift(...itemsToRewind);
  };

  // Return the public API
  return {
    // State
    items,
    state,
    rewindKeys,
    leavingKeys,
    
    // Computed
    isEmpty,
    firstItem,
    size,
    
    // Methods
    push,
    shift,
    unshift,
    removeAt,
    move,
    cycle,
    clear,
    getAt,
    isRewinding,
    isLeaving,
    resetRewindStatus,
    resetLeavingStatus,
    resetStatus,
    decide,
    rewind
  };
}