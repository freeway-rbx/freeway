export const MATERIAL_MAP_DEFINITIONS = [
  {
    method: 'getBaseColorTexture',
    channels: [
      {name: 'basecolor', extractChannel: null},
    ],
  },
  {
    method: 'getNormalTexture',
    channels: [
      {name: 'normal', extractChannel: null},
    ],
  },
  {
    method: 'getMetallicRoughnessTexture',
    channels: [
      {name: 'roughness', extractChannel: 1},
      {name: 'metalness', extractChannel: 2},
    ],
  },
]

