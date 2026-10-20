// Authored Explorer recipes for real, existing Foundry controls only.
// This is presentation metadata; canonical Core contract / adapter remains authoritative.
// Never add a control here without an actual Foundry target and a verifying browser test.
export const recipes = Object.freeze({
 'core.button':{
  use:'Trigger an immediate user action. Prefer native button keyboard behavior.',
  avoid:'Do not simulate disabled semantics with color alone; the adapter gates aria-disabled requests.',
  semantics:'Native button; focus-visible remains distinct from a momentary tactile press.',
  specimen:'section[aria-labelledby="button-slice"] .ns-button',
  controls:[{id:'enabled',label:'Enabled',kind:'button',op:'aria-disabled',value:'false'},
            {id:'disabled',label:'Disabled',kind:'button',op:'aria-disabled',value:'true'}]
 },
 'core.checkbox':{
  use:'Model independent boolean selection; only show mixed when the application owns an indeterminate state.',
  avoid:'Do not conflate indeterminate presentation with a third submitted form value.',
  semantics:'Native checkbox with checkbox adapter synchronizing data-state.',
  specimen:'#checkbox-demo',
  controls:[{id:'unchecked',label:'Unchecked',kind:'button',op:'checkbox',value:'unchecked'},
            {id:'checked',label:'Checked',kind:'button',op:'checkbox',value:'checked'},
            {id:'mixed',label:'Indeterminate',kind:'button',op:'checkbox',value:'indeterminate'}]
 },
 'core.switch':{
  use:'Represent an immediate binary setting with native checkbox input and role switch.',
  avoid:'Never invent a third indeterminate state for Switch.',
  semantics:'Native checkbox; the real switch adapter owns data-state and role.',
  specimen:'#switch-demo',
  controls:[{id:'off',label:'Off',kind:'button',op:'switch',value:'off'},
            {id:'on',label:'On',kind:'button',op:'switch',value:'on'}]
 },
 'core.input':{
  use:'Collect a single line of user-authored text with the native input.',
  avoid:'Inputs are editable, not pressable; do not add button-style compression.',
  semantics:'Native input remains responsible for selection, caret and IME.',
  specimen:'#input-demo',
  controls:[{id:'value',label:'Text',kind:'text',op:'input',value:'Preview text'},
            {id:'clear',label:'Clear',kind:'button',op:'input',value:''}]
 },
 'core.textarea':{
  use:'Collect multiline authored text and preserve line breaks.',
  avoid:'Do not replace the native textarea with a non-editable card.',
  semantics:'Native textarea retains resize, scrolling and composition behavior.',
  specimen:'#textarea-demo',
  controls:[{id:'value',label:'Multiline content',kind:'textarea',op:'input',value:'First line\nSecond line'},
            {id:'clear',label:'Clear',kind:'button',op:'input',value:''}]
 },
 'core.select':{
  use:'Choose one value from a small, browser-owned native option list.',
  avoid:'Do not fake a custom popup or claim the browser option sheet is styled by Core.',
  semantics:'Native select; change events belong to the browser.',
  specimen:'#select-demo',
  controls:[{id:'alpha',label:'Alpha',kind:'button',op:'select',value:'alpha'},
            {id:'beta',label:'Beta',kind:'button',op:'select',value:'beta'},
            {id:'gamma',label:'Gamma',kind:'button',op:'select',value:'gamma'}]
 },
 'core.badge':{
  use:'Communicate compact, noninteractive metadata with a visible text label.',
  avoid:'Tone is not an action, and meaning cannot rely on color alone.',
  semantics:'Passive span with canonical data-tone styling; no added roles.',
  specimen:'#badge-neutral',
  controls:[{id:'neutral',label:'Neutral',kind:'button',op:'tone',value:'neutral'},
            {id:'info',label:'Info',kind:'button',op:'tone',value:'info'},
            {id:'success',label:'Success',kind:'button',op:'tone',value:'success'},
            {id:'warning',label:'Warning',kind:'button',op:'tone',value:'warning'},
            {id:'error',label:'Error',kind:'button',op:'tone',value:'error'}]
 },
 'core.slider':{
  use:'Adjust a numeric scalar via native range input and the existing Slider controller.',
  avoid:'Do not handwrite a new track or overwrite the output label without dispatching native input.',
  semantics:'Range input receives events; existing controller maintains the value output.',
  specimen:'#slider-input',
  controls:[{id:'low',label:'25',kind:'button',op:'range',value:'25'},
            {id:'mid',label:'50',kind:'button',op:'range',value:'50'},
            {id:'high',label:'75',kind:'button',op:'range',value:'75'}]
 },
 'core.tabs':{
  use:'Organize closely related panels within one keyboard-navigable composite.',
  avoid:'Do not toggle aria-selected without letting the Tabs controller change its panel.',
  semantics:'Real tab click; original roving focus and panel controller remain authoritative.',
  specimen:'#tab-auto-overview',
  controls:[{id:'overview',label:'Overview',kind:'button',op:'tab',value:'#tab-auto-overview'},
            {id:'details',label:'Details',kind:'button',op:'tab',value:'#tab-auto-details'}]
 }
});
