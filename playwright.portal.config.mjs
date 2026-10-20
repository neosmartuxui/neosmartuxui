import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/portal',outputDir:'./artifacts/portal-test-results',
 timeout:30000,expect:{timeout:12000},workers:1,fullyParallel:false,reporter:'list',
 use:{baseURL:'http://127.0.0.1:4405',browserName:'chromium',channel:process.env.NEOSMARTUXUI_BROWSER_CHANNEL||undefined,headless:true,trace:'retain-on-failure'},
 webServer:{command:'node tooling/portal/serve.mjs',url:'http://127.0.0.1:4405/',reuseExistingServer:false,timeout:20000}
});
