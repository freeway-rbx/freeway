export const MATERIAL_MAP_DEFINITIONS = [
  {
    method: 'getBaseColorTexture',
    channels: [
      {name: 'b', extractChannel: null},
    ],
  },
  {
    method: 'getNormalTexture',
    channels: [
      {name: 'n', extractChannel: null},
    ],
  },
  {
    method: 'getMetallicRoughnessTexture',
    channels: [
      {name: 'r', extractChannel: 1},
      {name: 'm', extractChannel: 2},
    ],
  },
]
