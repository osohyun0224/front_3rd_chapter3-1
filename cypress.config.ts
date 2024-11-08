/* eslint-disable no-unused-vars */
import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    supportFile: 'cypress/support/component.ts',
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
  e2e: {
    setupNodeEvents(on, config) {
      // 노드 이벤트 설정
    },
    baseUrl: 'http://localhost:5173', // 예시 URL
    // 기타 설정 옵션
  },
});
