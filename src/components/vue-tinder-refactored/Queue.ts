/**
 * Queue class to manage a stack of cards with various operations.
 * Provides a more agnostic and reusable approach to queue management.
 */
export class Queue<T> {
  private items: T[] = [];
  private keyName: string;
  private rewindItems: string[] = [];
  private leavingItems: string[] = [];
  private listeners: Record<string, Function[]> = {
    'change': [],
    'shift': [],
    'rewind': [],
    'add': []
  };

  /**
   * Creates a new Queue instance
   * @param keyName The property name used as a unique identifier for items
   * @param initialItems Optional array of initial items to populate the queue
   */
  constructor(keyName: string = 'id', initialItems: T[] = []) {
    this.keyName = keyName;
    this.items = [...initialItems];
  }

  /**
   * Get all items in the queue
   * @returns Array of all items
   */
  getItems(): T[] {
    return [...this.items];
  }

  /**
   * Get the total number of items in the queue
   * @returns Number of items
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Get an item at a specific index
   * @param index The index of the item to retrieve
   * @returns The item at the specified index or undefined if out of bounds
   */
  getAt(index: number): T | undefined {
    return this.items[index];
  }

  /**
   * Get the first item in the queue
   * @returns The first item or undefined if queue is empty
   */
  first(): T | undefined {
    return this.items[0];
  }

  /**
   * Get the last item in the queue
   * @returns The last item or undefined if queue is empty
   */
  last(): T | undefined {
    return this.items.length > 0 ? this.items[this.items.length - 1] : undefined;
  }

  /**
   * Add one or more items to the end of the queue
   * @param items One or more items to add to the queue
   * @returns The new size of the queue
   */
  push(...items: T[]): number {
    if (items.length === 0) return this.items.length;
    
    const newLength = this.items.push(...items);
    this.triggerEvent('change', { items: this.items });
    this.triggerEvent('add', { 
      items: items,
      position: 'end'
    });
    
    return newLength;
  }

  /**
   * Remove and return the first item from the queue
   * @param metadata Optional metadata to include with the event
   * @returns The removed item or undefined if queue is empty
   */
  shift(metadata: Record<string, any> = {}): T | undefined {
    if (this.items.length === 0) return undefined;
    
    const item = this.items.shift();
    
    if (item) {
      const itemKey = this.getItemKey(item);
      this.leavingItems.push(itemKey);
      
      this.triggerEvent('change', { items: this.items });
      this.triggerEvent('shift', { 
        item,
        metadata
      });
    }
    
    return item;
  }

  /**
   * Add one or more items to the beginning of the queue
   * @param items One or more items to add to the queue
   * @returns The new size of the queue
   */
  unshift(...items: T[]): number {
    if (items.length === 0) return this.items.length;
    
    // Track items for rewind animation
    items.forEach(item => {
      const itemKey = this.getItemKey(item);
      this.rewindItems.push(itemKey);
    });
    
    const newLength = this.items.unshift(...items);
    
    this.triggerEvent('change', { items: this.items });
    this.triggerEvent('rewind', { items });
    this.triggerEvent('add', { 
      items,
      position: 'beginning'
    });
    
    return newLength;
  }

  /**
   * Move an item from one position to another
   * @param fromIndex The index of the item to move
   * @param toIndex The destination index
   * @returns Boolean indicating if the operation was successful
   */
  move(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 || 
      fromIndex >= this.items.length || 
      toIndex < 0 || 
      toIndex >= this.items.length ||
      fromIndex === toIndex
    ) {
      return false;
    }
    
    const item = this.items[fromIndex];
    this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, item);
    
    this.triggerEvent('change', { items: this.items });
    
    return true;
  }

  /**
   * Remove an item at a specific index
   * @param index The index of the item to remove
   * @param metadata Optional metadata to include with the event
   * @returns The removed item or undefined if index is out of bounds
   */
  removeAt(index: number, metadata: Record<string, any> = {}): T | undefined {
    if (index < 0 || index >= this.items.length) return undefined;
    
    const [item] = this.items.splice(index, 1);
    
    if (item) {
      const itemKey = this.getItemKey(item);
      this.leavingItems.push(itemKey);
      
      this.triggerEvent('change', { items: this.items });
      this.triggerEvent('shift', { 
        item,
        index,
        metadata
      });
    }
    
    return item;
  }

  /**
   * Move the last item to the beginning of the queue
   * @returns Boolean indicating if the operation was successful
   */
  cycle(): boolean {
    if (this.items.length <= 1) return false;
    
    const lastItem = this.items.pop();
    if (lastItem) {
      this.unshift(lastItem);
      return true;
    }
    
    return false;
  }

  /**
   * Clear all items from the queue
   */
  clear(): void {
    if (this.items.length === 0) return;
    
    this.items = [];
    this.triggerEvent('change', { items: this.items });
  }

  /**
   * Check if an item is currently being rewound
   * @param item The item to check
   * @returns Boolean indicating if the item is being rewound
   */
  isRewinding(item: T): boolean {
    const itemKey = this.getItemKey(item);
    return this.rewindItems.includes(itemKey);
  }

  /**
   * Check if an item is currently leaving
   * @param item The item to check
   * @returns Boolean indicating if the item is leaving
   */
  isLeaving(item: T): boolean {
    const itemKey = this.getItemKey(item);
    return this.leavingItems.includes(itemKey);
  }

  /**
   * Reset the rewind status for an item
   * @param item The item to reset
   */
  resetRewindStatus(item: T): void {
    const itemKey = this.getItemKey(item);
    const index = this.rewindItems.indexOf(itemKey);
    
    if (index !== -1) {
      this.rewindItems.splice(index, 1);
    }
  }

  /**
   * Reset the leaving status for an item
   * @param item The item to reset
   */
  resetLeavingStatus(item: T): void {
    const itemKey = this.getItemKey(item);
    const index = this.leavingItems.indexOf(itemKey);
    
    if (index !== -1) {
      this.leavingItems.splice(index, 1);
    }
  }

  /**
   * Register an event listener
   * @param event Event name to listen for ('change', 'shift', 'rewind', 'add')
   * @param callback Function to call when the event occurs
   */
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param callback The function to remove
   */
  off(event: string, callback: Function): void {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(callback);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Retrieve the key for an item
   * @param item The item to get the key for
   * @returns The key value as a string
   */
  private getItemKey(item: T): string {
    // @ts-ignore - We're using string indexing but TypeScript doesn't know the shape of T
    const key = item[this.keyName];
    return key?.toString() || '';
  }

  /**
   * Trigger an event for all registered listeners
   * @param event Event name
   * @param data Data to pass to the event handlers
   */
  private triggerEvent(event: string, data: any): void {
    if (!this.listeners[event]) return;
    
    for (const callback of this.listeners[event]) {
      callback(data);
    }
  }
}