export const initStatus = revert => ({
  status: revert ? 3 : 0,
  touchId: null,
  start: {},
  move: {},
  startPoint: 1, // 手指落在卡片的上半部分（1），下半部分（-1）
  result: null
})

