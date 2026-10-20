import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/blocks',outputDir:'./artifacts/blocks-test-results',
 timeout:30000,expect:{timeout:12000},fullyParallel:false,workers:1,reporter:'list',
 use:{baseURL:'http://127.0.0.1:4402',browserName:'chromium',channel:process.env.NEOSMARTUXUI_BROWSER_CHANNEL||undefined,headless:true,trace:'retain-on-failure'},
 webServer:{command:'node tooling/blocks/serve.mjs',url:'http://127.0.0.1:4402/',reuseExistingServer:false,timeout:20000}
});
