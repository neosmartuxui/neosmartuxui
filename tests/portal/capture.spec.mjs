import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('Capture desktop and mobile landing page visuals',async({page})=>{
 await mkdir('artifacts/portal-visuals',{recursive:true});
 await page.setViewportSize({width:1440,height:960});
 await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-portal-ready','true');
 await page.screenshot({path:'artifacts/portal-visuals/landing-desktop.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await page.screenshot({path:'artifacts/portal-visuals/landing-mobile.png',fullPage:true,animations:'disabled'});
});
