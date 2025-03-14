import type {Config} from 'jest'

const esModules = ['p-queue', 'p-retry', 'p-limit', 'p-timeout'].join('|');

export default async (): Promise<Config> => {
  return {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*(\\.e2e-spec|\\.spec)\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': '@swc/jest',
    },
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],

    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
  }
}
