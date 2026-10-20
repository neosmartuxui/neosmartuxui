import {test,expect} from '@playwright/test';

const ids=['coupon','checkout-field','invoice-details','checkout-steps','payment-method','payment-failure','payment-recovery','processing-state','order-confirmation','receipt'];
test.beforeEach(async({page})=>{
  page.__commerceErrors=[];
  page.on('pageerror',e=>page.__commerceErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')page.__commerceErrors.push(m.text());});
  page.on('response',res=>{if(res.status()>=400)page.__commerceErrors.push(res.status()+' '+res.url());});
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-commerce-ready','true');
});

test('All ten new checkout/payment surfaces render without payment credentials',async({page})=>{
  for(const id of ids) await expect(page.locator('[data-component="'+id+'"] > [data-commerce-component="'+id+'"]')).toHaveCount(1);
  await expect(page.locator('.demo-box > [data-commerce-component]')).toHaveCount(24);
  await expect(page.locator('[data-component="checkout-steps"] [aria-current=step]')).toHaveText('Payment');
  await expect(page.locator('[data-component="processing-state"] > [data-commerce-component="processing-state"]')).toHaveAttribute('data-state','processing');
  await expect(page.locator('[data-component="order-confirmation"]')).toContainText('Delivery pending');
  await expect(page.locator('[data-component="receipt"]')).toContainText('This transaction receipt is not a tax invoice');
  expect(await page.locator('input[type=password],input[name*=card],input[name*=cvv]').count()).toBe(0);
  expect(page.__commerceErrors).toEqual([]);
});

test('Coupon starts as provider-unverified and reflects only provider-returned status',async({page})=>{
  const coupon=page.locator('[data-component="coupon"] form');
  await coupon.getByRole('button',{name:'Apply'}).click();
  await expect(coupon).toHaveAttribute('data-state','accepted');
  await expect(coupon.getByRole('status')).toContainText('Provider quote accepted');
  expect(await page.evaluate(()=>window.__couponRequests)).toEqual(['WELCOME']);
  const rejected=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const e=m.renderCoupon({},{onApply:async()=>({status:'rejected',message:'Not eligible'})});
    document.body.append(e);e.querySelector('input').value='BAD';
    e.querySelector('button').click();
    await new Promise(ok=>setTimeout(ok,80));
    return {state:e.dataset.state,text:e.querySelector('[role=alert]')?.textContent};
  });
  expect(rejected).toEqual({state:'rejected',text:'Not eligible'});
  expect(page.__commerceErrors).toEqual([]);
});

test('Checkout field has explicit labels and provider-facing update only',async({page})=>{
  const field=page.locator('[data-component="checkout-field"]');
  const input=field.getByRole('textbox',{name:'Contact email'});
  await expect(input).toHaveAttribute('autocomplete','email');
  await input.fill('changed@example.com');
  expect(await page.evaluate(()=>window.__checkoutField)).toEqual({key:'contactEmail',value:'changed@example.com'});
  const invalid=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const field=m.renderCheckoutField({id:'email',label:'Email',error:'Provider rejected the email',required:true,type:'email'});
    document.body.append(field);
    return {invalid:field.querySelector('input').getAttribute('aria-invalid'),text:field.querySelector('[role=alert]').textContent};
  });
  expect(invalid).toEqual({invalid:'true',text:'Provider rejected the email'});
  expect(page.__commerceErrors).toEqual([]);
});

test('Invoice details require complete billing draft and provider acknowledgement',async({page})=>{
  const form=page.locator('[data-component="invoice-details"] form');
  await form.getByRole('button',{name:'Request billing details update'}).click();
  await expect(form).toHaveAttribute('data-state','saved');
  await expect(form.getByRole('status')).toContainText('saved by demo provider');
  expect((await page.evaluate(()=>window.__billingDraft)).legalName).toBe('Demo Business');
  const e=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const form=m.renderInvoiceDetails({legalName:'',billingEmail:'x',billingAddress:''},{onSave:async()=>{window.__badInvoiceCalls=(window.__badInvoiceCalls||0)+1;return {status:'saved',message:'OK'};}});
    document.body.append(form);form.querySelector('button').click();await new Promise(ok=>setTimeout(ok,60));
    return {state:form.dataset.state,callCount:window.__badInvoiceCalls||0,alert:form.querySelector(':scope > .ns-commerce-message[role=alert]')?.textContent};
  });
  expect(e).toEqual({state:'invalid',callCount:0,alert:'Legal name, address, and valid email are required'});
  expect(page.__commerceErrors).toEqual([]);
});

test('Payment method choices use safe labels and preserve explicit selection',async({page})=>{
  const group=page.locator('[data-component="payment-method"] fieldset');
  const option=group.getByRole('radio',{name:/Card with provider/});
  await option.check();
  await expect(option).toBeChecked();
  await expect.poll(()=>page.evaluate(()=>window.__paymentMethod)).toBe('card-on-provider');
  expect(page.__commerceErrors).toEqual([]);
});

test('Payment failure retries do not pretend the original payment completed',async({page})=>{
  const e=page.locator('[data-component="payment-failure"] section');
  await expect(e).toHaveAttribute('data-state','failed');
  await e.getByRole('button',{name:'Retry through provider'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__paymentRetry)).toBe('PROVIDER_DECLINED');
  await expect(e).toHaveAttribute('data-state','awaiting-provider');
  await expect(e).not.toContainText('Payment successful');
  expect(page.__commerceErrors).toEqual([]);
});

test('Recovery is confirmed only from provider result; failure stays recoverable',async({page})=>{
  const e=page.locator('[data-component="payment-recovery"] section');
  await e.getByRole('button',{name:'Request recovery'}).click();
  await expect(e).toHaveAttribute('data-state','recovered');
  await expect(e.getByRole('status')).toContainText('Provider confirmed');
  await expect(e.getByRole('button')).toBeDisabled();
  expect(await page.evaluate(()=>window.__recoveryRequest)).toBe('sample-quote');
  const failed=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const e=m.renderPaymentRecovery({quoteId:'quote',message:'Still trying'},{onRecover:async()=>({status:'failed',message:'Still not recoverable'})});
    document.body.append(e);e.querySelector('button').click();await new Promise(ok=>setTimeout(ok,50));
    return {state:e.dataset.state,disabled:e.querySelector('button').disabled,alert:e.querySelector('[role=alert]')?.textContent};
  });
  expect(failed).toEqual({state:'failed',disabled:false,alert:'Still not recoverable'});
  expect(page.__commerceErrors).toEqual([]);
});

test('Rejects deceptive order/receipt states and dangerous checkout fields',async({page})=>{
  const verdict=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const rejects=fn=>{try{fn();return false}catch{return true}};
    return [
      rejects(()=>m.renderOrderConfirmation({id:'x',status:'pending'})),
      rejects(()=>m.renderReceipt({id:'r',orderId:'o',status:'pending',amount:{amount:1,currency:'USD'}})),
      rejects(()=>m.renderOrderConfirmation({id:'x',status:'confirmed',entitlements:[{productId:'P',delivered:'yes'}]})),
      rejects(()=>m.renderCheckoutField({id:'cardNumber',label:'Card number',type:'text'})),
      rejects(()=>m.renderCheckoutField({id:'cvv',label:'CVV',type:'number'})),
      rejects(()=>m.renderPaymentMethod({methods:[{id:'card',label:'Card',cardNumber:'4111...'}]})),
      rejects(()=>m.renderPaymentMethod({methods:[{id:'card',label:'Card',clientSecret:'must-not-leak'}]})),
      rejects(()=>m.renderCheckoutSteps({steps:[{id:'x',label:'One'},{id:'x',label:'Again'}],currentId:'x'})),
      rejects(()=>m.renderCheckoutSteps({steps:[{id:'x',label:'One'}],currentId:'missing'}))
    ];
  });
  expect(verdict).toEqual([true,true,true,true,true,true,true,true,true]);
  expect(page.__commerceErrors).toEqual([]);
});

test('Static user and provider text is rendered as text, never markup',async({page})=>{
  const result=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const e=m.renderPaymentFailure({code:'CODE',message:'<img src=x onerror=alert(1)>'});
    document.body.append(e);
    return {injected:e.querySelector('img,script')!==null,text:e.textContent.includes('<img src=x')};
  });
  expect(result).toEqual({injected:false,text:true});
  expect(page.__commerceErrors).toEqual([]);
});

test('Buttons without provider adapters are disabled, checkout context is preserved',async({page})=>{
  const result=await page.evaluate(async()=>{
    const m=await import('/wave3.mjs');
    const a=m.renderCoupon();
    const b=m.renderInvoiceDetails({legalName:'A'});
    const c=m.renderPaymentRecovery({quoteId:'q',message:'No provider'});
    const d=m.renderPaymentFailure({code:'DECLINED',message:'Retry',retryable:false});
    return {coupon:a.querySelector('button').disabled,invoice:b.querySelector('button').disabled,recovery:c.querySelector('button').disabled,noRetry:d.querySelector('button')===null};
  });
  expect(result).toEqual({coupon:true,invoice:true,recovery:true,noRetry:true});
  expect(page.__commerceErrors).toEqual([]);
});

for(const theme of ['hardline-light','hardline-dark','soft-light','soft-dark','rivet-light','rivet-dark','mono-light','mono-dark','pulse-light','pulse-dark']){
  test('Wave 3 checkout components use saved Theme '+theme,async({page})=>{
    await page.locator('#theme').selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-commerce-theme',theme);
    for(const id of ids){
      const item=page.locator('[data-component="'+id+'"] > [data-commerce-component="'+id+'"]');
      await expect(item).toBeVisible();
      const border=await item.evaluate(e=>parseFloat(getComputedStyle(e).borderTopWidth));
      expect(border).toBeGreaterThan(0);
    }
    expect(page.__commerceErrors).toEqual([]);
  });
}

test('Mobile, RTL, high contrast and reduced motion maintain controls without overflow',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await page.evaluate(()=>document.documentElement.dir='rtl');
  await expect(page.locator('[data-component="coupon"] input')).toBeVisible();
  await expect(page.locator('[data-component="payment-method"] input').first()).toBeVisible();
  await page.locator('[data-component="payment-method"] input').first().check();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  expect(overflow).toBe(false);
  expect(page.__commerceErrors).toEqual([]);
});
