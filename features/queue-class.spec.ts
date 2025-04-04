import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Queue } from '../src/components/vue-tinder-refactored/Queue';
import { STATUS } from '../src/components/vue-tinder/status';

// Define a Card type for our tests
interface Card {
  id: string | number;
  content?: string;
}

describe('Queue Class', () => {
  let queue: Queue<Card>;
  
  beforeEach(() => {
    // Create a fresh Queue instance for each test with three cards
    queue = new Queue<Card>('id', [
      { id: 'card1', content: 'First card' },
      { id: 'card2', content: 'Second card' },
      { id: 'card3', content: 'Third card' }
    ]);
  });
  
  describe('Basic Queue Operations', () => {
    test('should get all items', () => {
      const items = queue.getItems();
      expect(items.length).toBe(3);
      expect(items[0].id).toBe('card1');
      expect(items[1].id).toBe('card2');
      expect(items[2].id).toBe('card3');
    });
    
    test('should get size', () => {
      expect(queue.size()).toBe(3);
      
      queue.shift();
      expect(queue.size()).toBe(2);
      
      queue.push({ id: 'card4' });
      expect(queue.size()).toBe(3);
    });
    
    test('should get item at specific index', () => {
      const item = queue.getAt(1);
      expect(item?.id).toBe('card2');
      
      const nonExistent = queue.getAt(5);
      expect(nonExistent).toBeUndefined();
    });
    
    test('should get first and last items', () => {
      expect(queue.first()?.id).toBe('card1');
      expect(queue.last()?.id).toBe('card3');
      
      // After shifting, the first item changes
      queue.shift();
      expect(queue.first()?.id).toBe('card2');
    });
  });
  
  describe('Push and Shift Operations', () => {
    test('should add items to end of queue with push', () => {
      const newCard = { id: 'card4', content: 'Fourth card' };
      const newSize = queue.push(newCard);
      
      expect(newSize).toBe(4);
      expect(queue.last()).toBe(newCard);
    });
    
    test('should remove and return first item with shift', () => {
      const shiftedCard = queue.shift();
      
      expect(shiftedCard?.id).toBe('card1');
      expect(queue.size()).toBe(2);
      expect(queue.first()?.id).toBe('card2');
      
      // Should be marked as leaving
      expect(queue.isLeaving(shiftedCard!)).toBe(true);
    });
    
    test('should add items to beginning of queue with unshift', () => {
      const newCard = { id: 'card0', content: 'New first card' };
      const newSize = queue.unshift(newCard);
      
      expect(newSize).toBe(4);
      expect(queue.first()).toBe(newCard);
      
      // Should be marked as rewinding
      expect(queue.isRewinding(newCard)).toBe(true);
    });
    
    test('should be able to add multiple items with push and unshift', () => {
      const newSize = queue.push(
        { id: 'card4' },
        { id: 'card5' }
      );
      
      expect(newSize).toBe(5);
      expect(queue.last()?.id).toBe('card5');
      
      const newSize2 = queue.unshift(
        { id: 'card-1' },
        { id: 'card0' }
      );
      
      expect(newSize2).toBe(7);
      expect(queue.first()?.id).toBe('card-1');
    });
  });
  
  describe('Move and Cycle Operations', () => {
    test('should move an item from one position to another', () => {
      // Move the first item to the second position
      const result = queue.move(0, 1);
      
      expect(result).toBe(true);
      expect(queue.getAt(0)?.id).toBe('card2');
      expect(queue.getAt(1)?.id).toBe('card1');
      expect(queue.getAt(2)?.id).toBe('card3');
    });
    
    test('should not move when indices are invalid', () => {
      const result1 = queue.move(-1, 1);
      const result2 = queue.move(0, 10);
      const result3 = queue.move(0, 0);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      
      // Queue should remain unchanged
      expect(queue.getAt(0)?.id).toBe('card1');
      expect(queue.getAt(1)?.id).toBe('card2');
      expect(queue.getAt(2)?.id).toBe('card3');
    });
    
    test('should cycle the last item to the beginning', () => {
      const result = queue.cycle();
      
      expect(result).toBe(true);
      expect(queue.getAt(0)?.id).toBe('card3');
      expect(queue.getAt(1)?.id).toBe('card1');
      expect(queue.getAt(2)?.id).toBe('card2');
      
      // The moved item should be marked as rewinding
      expect(queue.isRewinding(queue.getAt(0)!)).toBe(true);
    });
  });
  
  describe('Remove and Clear Operations', () => {
    test('should remove item at specific index', () => {
      const removedItem = queue.removeAt(1);
      
      expect(removedItem?.id).toBe('card2');
      expect(queue.size()).toBe(2);
      expect(queue.getAt(0)?.id).toBe('card1');
      expect(queue.getAt(1)?.id).toBe('card3');
      
      // The removed item should be marked as leaving
      expect(queue.isLeaving(removedItem!)).toBe(true);
    });
    
    test('should clear all items', () => {
      queue.clear();
      
      expect(queue.size()).toBe(0);
      expect(queue.first()).toBeUndefined();
      expect(queue.last()).toBeUndefined();
    });
  });
  
  describe('Status Tracking', () => {
    test('should track rewinding status', () => {
      const newCard = { id: 'rewind' };
      queue.unshift(newCard);
      
      expect(queue.isRewinding(newCard)).toBe(true);
      
      // Reset status
      queue.resetRewindStatus(newCard);
      expect(queue.isRewinding(newCard)).toBe(false);
    });
    
    test('should track leaving status', () => {
      const shiftedCard = queue.shift()!;
      
      expect(queue.isLeaving(shiftedCard)).toBe(true);
      
      // Reset status
      queue.resetLeavingStatus(shiftedCard);
      expect(queue.isLeaving(shiftedCard)).toBe(false);
    });
  });
  
  describe('Event Handling', () => {
    test('should trigger change event when queue changes', () => {
      const changeHandler = vi.fn();
      queue.on('change', changeHandler);
      
      // Various operations that should trigger change
      queue.push({ id: 'new' });
      queue.shift();
      queue.unshift({ id: 'newer' });
      queue.move(0, 1);
      queue.removeAt(0);
      queue.clear();
      
      // Change should be fired for each operation
      expect(changeHandler).toHaveBeenCalledTimes(6);
    });
    
    test('should trigger specific events for operations', () => {
      const shiftHandler = vi.fn();
      const rewindHandler = vi.fn();
      const addHandler = vi.fn();
      
      queue.on('shift', shiftHandler);
      queue.on('rewind', rewindHandler);
      queue.on('add', addHandler);
      
      // Perform various operations
      queue.shift();
      expect(shiftHandler).toHaveBeenCalledTimes(1);
      
      queue.unshift({ id: 'rewind1' });
      expect(rewindHandler).toHaveBeenCalledTimes(1);
      
      // addHandler gets called once for unshift as well (unshift adds an item),
      // so it's already been called once
      expect(addHandler).toHaveBeenCalledTimes(1);
      
      // Reset the mock to check just the push operations
      addHandler.mockClear();
      
      queue.push({ id: 'new1' });
      queue.push({ id: 'new2' });
      expect(addHandler).toHaveBeenCalledTimes(2);
      
      // Remove event listener and verify it's not called
      queue.off('shift', shiftHandler);
      queue.shift();
      expect(shiftHandler).toHaveBeenCalledTimes(1); // Still just 1
    });
    
    test('should include correct data in events', () => {
      let eventData;
      
      queue.on('shift', (data) => {
        eventData = data;
      });
      
      const shiftedCard = queue.shift({ type: 'like' });
      
      // Verify event data
      expect(eventData.item).toBe(shiftedCard);
      expect(eventData.metadata.type).toBe('like');
    });
  });
  
  // Test compatibility with original vue-tinder implementation
  describe('vue-tinder compatibility', () => {
    test('should support decide operation (like original)', () => {
      // Create a function that uses Queue to simulate vue-tinder's decide method
      function decide(queue: Queue<Card>, type: string) {
        // Only proceed if the queue is not empty
        if (queue.size() === 0) return;
        
        // Remove the top card with the decision type as metadata
        return queue.shift({ type });
      }
      
      // Test deciding 'like'
      const firstCard = queue.first();
      const removedCard = decide(queue, 'like');
      
      expect(removedCard).toBe(firstCard);
      expect(queue.size()).toBe(2);
    });
    
    test('should support rewind operation (like original)', () => {
      // Create a function that uses Queue to simulate vue-tinder's rewind method
      function rewind(queue: Queue<Card>, items: Card[]) {
        return queue.unshift(...items);
      }
      
      // Test rewinding cards
      const historyCards = [
        { id: 'history1' },
        { id: 'history2' }
      ];
      
      const newSize = rewind(queue, historyCards);
      
      expect(newSize).toBe(5);
      expect(queue.first()?.id).toBe('history1');
      expect(queue.getAt(1)?.id).toBe('history2');
      
      // Should be marked as rewinding
      expect(queue.isRewinding(queue.first()!)).toBe(true);
    });
  });
});