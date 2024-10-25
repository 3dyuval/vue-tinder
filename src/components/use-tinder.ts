import { reactive, ref } from 'vue';
import { nanoid } from 'nanoid';


export type DecisionType = 'like' | 'nope' | 'super' | 'down' | 'rewind' | 'help';
export type QueueItem = Record<string, any>

export function initState(revert: boolean) {
  return {
    status: revert ? 3 : 0,
    touchId: null,
    start: {},
    move: {},
    startPoint: 1, // 手指落在卡片的上半部分（1），下半部分（-1）
    result: null
  }
}


export enum STATUS {
  NORMAL,
  MOVING,
  LEAVING,
  REVERT,
  REWINDING
}


export function useTinder(initialQueue: Array<QueueItem>, keyName: string) {
  const queue = ref([...initialQueue]);
  const state = reactive({
    keyName: keyName,
    touchId: null,
    status: STATUS.NORMAL,
    start: {},
    move: {},
    startPoint: 1,
    result: null as null | DecisionType
  });


  function decide(type: DecisionType) {
    if (state.touchId || state.status !== 0 /* STATUS.NORMAL */) {
      return;
    }
    state.start = { x: 0, y: 0 };
    state.move = {
      x: type === 'super' || type === 'down' ? 0 : type === 'like' ? 1 : -1,
      y: type === 'super' ? -1 : type === 'down' ? 1 : 0
    };
    shiftCard(type);
  }

  function shiftCard(decision: DecisionType) {
    state.status = STATUS.LEAVING
    state.result = decision;
    const item = queue.value.shift();
    // Here you would emit an event or handle state changes
  }

  const rewindKeys = ref([] as string[]);
  const onceRewindCount = ref(0);


  function rewind(list: Array<QueueItem>) {
    list.forEach(item => {
      item._vtKey = nanoid();  // Assign unique key
      rewindKeys.value.push(item._vtKey);
    });
    queue.value.unshift(...list);
  }


  function diff(newQueue: QueueItem[]) {
    const oldQueue = queue.value;
    const oldKeys = new Map(oldQueue.map(item => [item[keyName], item]));
    const newKeys = new Set(newQueue.map(item => item[keyName]));

    // Track items to remove
    const itemsToRemove = oldQueue.filter(item => !newKeys.has(item[keyName]));

    // Remove items not in the new list
    for (let i = 0; i < oldQueue.length; i++) {
      if (!newKeys.has(oldQueue[i][keyName])) {
        oldQueue.splice(i, 1);
        i--; // Adjust index after removal
      }
    }

    // Prepare for additions
    const additions = newQueue.filter(item => !oldKeys.has(item[keyName]));
    onceRewindCount.value = additions.length; // Track number of additions for rewind processing

    // Add new items
    additions.forEach(item => {
      item._vtKey = nanoid();
      queue.value.push(item);
    });

    // Handle rewinding state
    if (onceRewindCount.value > 0) {
      state.status = STATUS.REWINDING; // Update state if rewinds are necessary
    }

    // Reset count after updates
    onceRewindCount.value = 0;
  }


  return {
    queue,
    state,
    decide,
    rewind,
    diff
  };
}