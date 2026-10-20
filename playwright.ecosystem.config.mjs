import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/ecosystem',
 outputDir:'./artifacts/ecosystem-test-results',
 timeout:30000,expect:{timeout:12000},fullyParallel:false,workers:1,reporter:'list',
 use:{browserName:'chromium',channel:process.env.NEOSMARTUXUI_BROWSER_CHANNEL||undefined,headless:true,trace:'retain-on-failure'},
 webServer:[
  {command:'node tooling/foundry/serve.mjs',url:'http://127.0.0.1:4173/',reuseExistingServer:false,timeout:20000},
  {command:'node tooling/studio/serve.mjs',url:'http://127.0.0.1:4174/',reuseExistingServer:false,timeout:20000}
 ]
});
