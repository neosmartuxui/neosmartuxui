import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/experimental',outputDir:'./artifacts/experimental-test-results',
 timeout:30000,expect:{timeout:12000},fullyParallel:false,workers:1,reporter:'list',
 use:{baseURL:'http://127.0.0.1:4404',browserName:'chromium',channel:process.env.NEOSMARTUXUI_BROWSER_CHANNEL||undefined,headless:true,trace:'retain-on-failure'},
 webServer:{command:'node tooling/experimental/serve.mjs',url:'http://127.0.0.1:4404/',reuseExistingServer:false,timeout:20000}
});
