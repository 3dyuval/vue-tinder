import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useQueue } from '../src/components/vue-tinder-refactored/useQueue';
import { STATUS } from '../src/components/vue-tinder/status';

// Define a Card type for our tests
interface Card {
  id: string | number;
  content?: string;
}

describe('useQueue Composable', () => {
  // Setup for each test
  let queue: ReturnType<typeof useQueue<Card>>;
  let onSubmitMock: ReturnType<typeof vi.fn>;
  let onQueueChangeMock: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    // Reset mocks
    onSubmitMock = vi.fn();
    onQueueChangeMock = vi.fn();
    
    // Create a fresh queue instance for each test with three cards
    queue = useQueue<Card>({
      keyName: 'id',
      initialItems: [
        { id: 'card1', content: 'First card' },
        { id: 'card2', content: 'Second card' },
        { id: 'card3', content: 'Third card' }
      ],
      onSubmit: onSubmitMock,
      onQueueChange: onQueueChangeMock
    });
  });
  
  describe('Basic Queue Operations', () => {
    test('should get all items', () => {
      expect(queue.items.value.length).toBe(3);
      expect(queue.items.value[0].id).toBe('card1');
      expect(queue.items.value[1].id).toBe('card2');
      expect(queue.items.value[2].id).toBe('card3');
    });
    
    test('should get size', () => {
      expect(queue.size.value).toBe(3);
      
      queue.shift();
      expect(queue.size.value).toBe(2);
      
      queue.push({ id: 'card4' });
      expect(queue.size.value).toBe(3);
    });
    
    test('should get item at specific index', () => {
      const item = queue.getAt(1);
      expect(item?.id).toBe('card2');
      
      const nonExistent = queue.getAt(5);
      expect(nonExistent).toBeUndefined();
    });
    
    test('should get first item', () => {
      expect(queue.firstItem.value?.id).toBe('card1');
      
      // After shifting, the first item changes
      queue.shift();
      expect(queue.firstItem.value?.id).toBe('card2');
    });
    
    test('should check if queue is empty', () => {
      expect(queue.isEmpty.value).toBe(false);
      
      queue.clear();
      expect(queue.isEmpty.value).toBe(true);
    });
  });
  
  describe('Push and Shift Operations', () => {
    test('should add items to end of queue with push', () => {
      const newCard = { id: 'card4', content: 'Fourth card' };
      const newSize = queue.push(newCard);
      
      expect(newSize).toBe(4);
      expect(queue.items.value[3]).toEqual(newCard);
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
    });
    
    test('should remove and return first item with shift', () => {
      const shiftedCard = queue.shift();
      
      expect(shiftedCard?.id).toBe('card1');
      expect(queue.size.value).toBe(2);
      expect(queue.firstItem.value?.id).toBe('card2');
      
      // Should be marked as leaving
      expect(queue.isLeaving(shiftedCard!)).toBe(true);
      
      // Should trigger event handlers
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
      expect(onSubmitMock).toHaveBeenCalledWith({
        type: 'unknown',
        key: 'card1',
        item: shiftedCard
      });
    });
    
    test('should add items to beginning of queue with unshift', () => {
      const newCard = { id: 'card0', content: 'New first card' };
      const newSize = queue.unshift(newCard);
      
      expect(newSize).toBe(4);
      expect(queue.firstItem.value).toEqual(newCard);
      
      // Should be marked as rewinding
      expect(queue.isRewinding(newCard)).toBe(true);
      
      // Should trigger queue change event
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
    });
    
    test('should be able to add multiple items with push and unshift', () => {
      const newSize = queue.push(
        { id: 'card4' },
        { id: 'card5' }
      );
      
      expect(newSize).toBe(5);
      expect(queue.items.value[3].id).toBe('card4');
      expect(queue.items.value[4].id).toBe('card5');
      
      const newSize2 = queue.unshift(
        { id: 'card-1' },
        { id: 'card0' }
      );
      
      expect(newSize2).toBe(7);
      expect(queue.items.value[0].id).toBe('card-1');
      expect(queue.items.value[1].id).toBe('card0');
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
      
      // Should trigger queue change event
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
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
      
      // Should not trigger events since nothing changed
      expect(onQueueChangeMock).not.toHaveBeenCalled();
    });
    
    test('should cycle the last item to the beginning', () => {
      const result = queue.cycle();
      
      expect(result).toBe(true);
      expect(queue.getAt(0)?.id).toBe('card3');
      expect(queue.getAt(1)?.id).toBe('card1');
      expect(queue.getAt(2)?.id).toBe('card2');
      
      // The moved item should be marked as rewinding
      expect(queue.isRewinding(queue.getAt(0)!)).toBe(true);
      
      // Should trigger queue change event
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Remove and Clear Operations', () => {
    test('should remove item at specific index', () => {
      const removedItem = queue.removeAt(1);
      
      expect(removedItem?.id).toBe('card2');
      expect(queue.size.value).toBe(2);
      expect(queue.getAt(0)?.id).toBe('card1');
      expect(queue.getAt(1)?.id).toBe('card3');
      
      // The removed item should be marked as leaving
      expect(queue.isLeaving(removedItem!)).toBe(true);
      
      // Should trigger queue change event
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
      
      // Should not trigger submit event since it wasn't the first item
      expect(onSubmitMock).not.toHaveBeenCalled();
    });
    
    test('should trigger submit when removing first item', () => {
      const removedItem = queue.removeAt(0);
      
      // Should trigger submit event since it was the first item
      expect(onSubmitMock).toHaveBeenCalledWith({
        type: 'unknown',
        key: 'card1',
        item: removedItem
      });
    });
    
    test('should clear all items', () => {
      queue.clear();
      
      expect(queue.size.value).toBe(0);
      expect(queue.firstItem.value).toBeUndefined();
      expect(queue.isEmpty.value).toBe(true);
      
      // Should trigger queue change event
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
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
    
    test('should reset queue state', () => {
      // Set some non-normal state
      queue.state.status = STATUS.LEAVING;
      queue.state.touchId = 'test-touch';
      queue.state.result = 'like';
      
      // Reset the state
      queue.resetStatus();
      
      // Verify state is reset
      expect(queue.state.status).toBe(STATUS.NORMAL);
      expect(queue.state.touchId).toBeNull();
      expect(queue.state.result).toBeNull();
    });
  });
  
  describe('vue-tinder compatibility', () => {
    test('should support decide operation (like original)', () => {
      // Store the top card for reference
      const firstCard = queue.firstItem.value;
      
      // Call decide with 'like'
      queue.decide('like');
      
      // Verify state was updated
      expect(queue.state.status).toBe(STATUS.LEAVING);
      expect(queue.state.result).toBe('like');
      
      // Verify move coordinates were set for a right swipe
      expect(queue.state.move.x).toBe(1);
      expect(queue.state.move.y).toBe(0);
      
      // Verify the card was removed
      expect(queue.size.value).toBe(2);
      expect(queue.firstItem.value?.id).toBe('card2');
      
      // Verify the submit event was called with the right data
      expect(onSubmitMock).toHaveBeenCalledWith({
        type: 'like',
        key: 'card1',
        item: firstCard
      });
    });
    
    test('should not call decide if touch is in progress', () => {
      // Set touchId to simulate touch in progress
      queue.state.touchId = 'touch-id';
      
      // Call decide
      queue.decide('like');
      
      // Verify nothing happened
      expect(queue.size.value).toBe(3);
      expect(onQueueChangeMock).not.toHaveBeenCalled();
    });
    
    test('should not call decide if state is not NORMAL', () => {
      // Set non-normal state
      queue.state.status = STATUS.LEAVING;
      
      // Call decide
      queue.decide('like');
      
      // Verify nothing happened
      expect(queue.size.value).toBe(3);
      expect(onQueueChangeMock).not.toHaveBeenCalled();
    });
    
    test('should support rewind operation (like original)', () => {
      // First shift a card to have something to rewind
      const shiftedCard = queue.shift()!;
      onQueueChangeMock.mockClear(); // Reset mock
      
      // Rewind the card
      const newSize = queue.rewind([shiftedCard]);
      
      // Verify the card was added back to the beginning
      expect(newSize).toBe(3);
      expect(queue.firstItem.value).toBe(shiftedCard);
      
      // Verify the card is marked as rewinding
      expect(queue.isRewinding(shiftedCard)).toBe(true);
      
      // Verify queue change event was fired
      expect(onQueueChangeMock).toHaveBeenCalledTimes(1);
    });
  });
});