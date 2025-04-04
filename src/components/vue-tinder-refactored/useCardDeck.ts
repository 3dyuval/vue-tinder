import { ref, computed } from 'vue';
import { createEventHook } from '@vueuse/core';

/**
 * A generic card deck composable that manages a queue of items
 * with various operations and event hooks
 */
export function useCardDeck<T>(options: {
  keyFn?: (item: T) => string;
  initialItems?: T[];
} = {}) {
  // Default options
  const { 
    keyFn = (item: any) => item.id?.toString() || '',
    initialItems = []
  } = options;
  
  // State
  const items = ref<T[]>([...initialItems]);
  
  // Event hooks
  const addHook = createEventHook<{ items: T[], position: 'top' | 'bottom' | number }>();
  const removeHook = createEventHook<{ item: T, index: number }>();
  const moveHook = createEventHook<{ item: T, fromIndex: number, toIndex: number }>();
  const shuffleHook = createEventHook<T[]>();
  const clearHook = createEventHook<void>();
  const updateHook = createEventHook<T[]>();
  
  // Helper to emit update event after any state change
  const emitUpdate = () => {
    updateHook.trigger([...items.value]);
  };
  
  // Computed
  const isEmpty = computed(() => items.value.length === 0);
  const topItem = computed(() => items.value[0]);
  const bottomItem = computed(() => items.value[items.value.length - 1]);
  const size = computed(() => items.value.length);
  
  /**
   * Add items to the top of the deck
   */
  const addToTop = (...newItems: T[]): number => {
    if (newItems.length === 0) return items.value.length;
    
    // Add items to the beginning
    items.value.unshift(...newItems);
    
    // Trigger events
    addHook.trigger({ items: newItems, position: 'top' });
    emitUpdate();
    
    return items.value.length;
  };
  
  /**
   * Add items to the bottom of the deck
   */
  const addToBottom = (...newItems: T[]): number => {
    if (newItems.length === 0) return items.value.length;
    
    // Add items to the end
    items.value.push(...newItems);
    
    // Trigger events
    addHook.trigger({ items: newItems, position: 'bottom' });
    emitUpdate();
    
    return items.value.length;
  };
  
  /**
   * Insert items at a specific position
   */
  const insertAt = (index: number, ...newItems: T[]): number => {
    if (newItems.length === 0) return items.value.length;
    
    // Ensure index is valid
    const safeIndex = Math.max(0, Math.min(index, items.value.length));
    
    // Insert items
    items.value.splice(safeIndex, 0, ...newItems);
    
    // Trigger events
    addHook.trigger({ items: newItems, position: safeIndex });
    emitUpdate();
    
    return items.value.length;
  };
  
  /**
   * Remove the top item
   */
  const removeTop = (): T | undefined => {
    if (items.value.length === 0) return undefined;
    
    const [removedItem] = items.value.splice(0, 1);
    
    // Trigger events
    removeHook.trigger({ item: removedItem, index: 0 });
    emitUpdate();
    
    return removedItem;
  };
  
  /**
   * Remove the bottom item
   */
  const removeBottom = (): T | undefined => {
    if (items.value.length === 0) return undefined;
    
    const index = items.value.length - 1;
    const [removedItem] = items.value.splice(index, 1);
    
    // Trigger events
    removeHook.trigger({ item: removedItem, index });
    emitUpdate();
    
    return removedItem;
  };
  
  /**
   * Remove an item at a specific index
   */
  const removeAt = (index: number): T | undefined => {
    if (index < 0 || index >= items.value.length) return undefined;
    
    const [removedItem] = items.value.splice(index, 1);
    
    // Trigger events
    removeHook.trigger({ item: removedItem, index });
    emitUpdate();
    
    return removedItem;
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
    
    // Get the item to move
    const item = items.value[fromIndex];
    
    // Remove from original position and insert at new position
    items.value.splice(fromIndex, 1);
    items.value.splice(toIndex, 0, item);
    
    // Trigger events
    moveHook.trigger({ item, fromIndex, toIndex });
    emitUpdate();
    
    return true;
  };
  
  /**
   * Cycle the bottom item to the top
   */
  const cycleBottomToTop = (): boolean => {
    if (items.value.length <= 1) return false;
    
    const lastItem = removeBottom();
    if (lastItem) {
      addToTop(lastItem);
      return true;
    }
    
    return false;
  };
  
  /**
   * Cycle the top item to the bottom
   */
  const cycleTopToBottom = (): boolean => {
    if (items.value.length <= 1) return false;
    
    const firstItem = removeTop();
    if (firstItem) {
      addToBottom(firstItem);
      return true;
    }
    
    return false;
  };
  
  /**
   * Shuffle the deck
   */
  const shuffle = (): void => {
    // Fisher-Yates shuffle algorithm
    for (let i = items.value.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items.value[i], items.value[j]] = [items.value[j], items.value[i]];
    }
    
    // Trigger events
    shuffleHook.trigger([...items.value]);
    emitUpdate();
  };
  
  /**
   * Clear all items
   */
  const clear = (): void => {
    if (items.value.length === 0) return;
    
    items.value = [];
    
    // Trigger events
    clearHook.trigger();
    emitUpdate();
  };
  
  /**
   * Get an item at a specific index
   */
  const getAt = (index: number): T | undefined => {
    return items.value[index];
  };
  
  /**
   * Replace all items with new ones
   */
  const replace = (newItems: T[]): void => {
    // Clear and then add new items
    items.value = [...newItems];
    
    // Trigger events
    clearHook.trigger();
    addHook.trigger({ items: newItems, position: 'top' });
    emitUpdate();
  };

  return {
    // State
    items,
    
    // Computed
    isEmpty,
    topItem,
    bottomItem,
    size,
    
    // Methods
    addToTop,
    addToBottom,
    insertAt,
    removeTop,
    removeBottom,
    removeAt,
    move,
    cycleBottomToTop,
    cycleTopToBottom,
    shuffle,
    clear,
    getAt,
    replace,
    
    // Event hooks
    onAdd: addHook.on,
    onRemove: removeHook.on,
    onMove: moveHook.on,
    onShuffle: shuffleHook.on,
    onClear: clearHook.on,
    onUpdate: updateHook.on,
  };
}