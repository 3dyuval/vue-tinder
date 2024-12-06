import { ref, computed, toValue, toRef } from 'vue';
import { STATUS } from './status';
import { createEventHook, extendRef } from '@vueuse/core';

interface QueueItem {
  [key: string]: any;
}

interface ListItem {
  [key: string]: any;
  _key?: string;
}

type DiffResult = {
  add: any[];
  remove: any[];
};

function difference(array: any[], exclude: any[]): any[] {
  const result: any[] = [];
  for (let i = 0; i < array.length; i++) {
    if (exclude.includes(array[i])) {
      break;
    }
    result.push(array[i]);
  }
  return result;
}

type Options = {
  keyName: string,
  max: number
}

export function useQueueHandler(queue: QueueItem[], options: Options) {

  const _queue = toRef(queue)
  const { keyName, max } = options

  const leavingKeys = ref<string[]>([]);
  const onceRewindCount = ref(0);
  const list = ref<ListItem[]>([..._queue.value]);
  const rewindKeys = ref<string[]>([]);
  const hidingKeys = ref<string[]>([]);
  const state = ref({
    status: STATUS.IDLE,
  });

  const decide = createEventHook<{ type: string; key: string; item: QueueItem }>();

  function diff(listNew: any[], listOld: any[]): DiffResult {
    const add = difference(listNew, listOld);
    const remove = difference(listOld, listNew);
    return { add, remove };
  }

  function rewind(items: QueueItem[]): void {
    items.forEach(item => {
      rewindKeys.value.push(item[keyName].toString());
      _queue.value.unshift(item);
    });
    list.value = [..._queue.value];
  }

  function shiftCard(type: string): void {
    state.value.status = STATUS.LEAVING;
    const item = _queue.value.shift();
    if (item) {
      list.value = [..._queue.value];
      decide.trigger({ type, key: item[keyName], item });
    }
  }

  function handleDiff(listNew: any[], listOld: any[]): void {
    console.debug('_queue.value-handle.diff', listNew, listOld);

    const { add, remove } = diff(listNew, listOld);
    let rewindCount = 0;

    if (add.length) {
      add.forEach((key, i) => {
        const item = _queue.value[i];
        if (item?.[keyName] && key === item[keyName]) {
          rewindCount++;
          const id = item[keyName];
          const newVueTinderKey = `${id}${Math.random()}`;

          if (
              leavingKeys.value.includes(item._key!) ||
              leavingKeys.value.includes(id) ||
              rewindKeys.value.includes(item._key!) ||
              rewindKeys.value.includes(id)
          ) {
            item._key = newVueTinderKey;
            const rewindIndex = Math.max(
                rewindKeys.value.indexOf(item._key!),
                rewindKeys.value.indexOf(id)
            );
            if (rewindIndex > -1) {
              rewindKeys.value[rewindIndex] = newVueTinderKey;
              state.value.status = STATUS.REWINDING;
            }
          }
        } else {
          return;
        }
      });
    }
    onceRewindCount.value = rewindCount;

    if (remove.length) {
      leavingKeys.value.push(list.value[0]?._key || list.value[0]?.[keyName]);
      for (let i = max + 1; i < max + 1 + remove.length; i++) {
        const item = list.value[i];
        if (item) {
          if (
              leavingKeys.value.includes(item[keyName]) ||
              hidingKeys.value.includes(item[keyName])
          ) {
            item._key = `${item[keyName]}${Math.random()}`;
          }
        }
      }
    }

    list.value = [...queue];
  }

  return {
    onRewind: rewind,
    onShiftCard: shiftCard,
    handleDiff,
    onDecide: decide.on,
  };
}
