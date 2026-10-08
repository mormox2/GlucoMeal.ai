import { defineConfig } from 'vitest/config';

// Tests des règles Firestore et Storage : à lancer avec « npm run test:rules » (émulateurs Firebase, Java requis)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
