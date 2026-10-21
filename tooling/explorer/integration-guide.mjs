// The guide intentionally imports real source exports, not simulated framework widgets.
import * as core from '../../packages/adapters/web/core-exports.mjs';
const known={accordion:'bindAccordion',radio:'bindRadio',toggle:'bindToggle','segmented-control':'bindSegmentedControl','number-field':'bindNumberField'};
for(const name of Object.values(known))if(typeof core[name]!=='function')throw new Error('Documented Core export missing: '+name);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const examples=[
 {name:'Vanilla JavaScript',symbol:'bindAccordion',code:[
  "import { bindAccordion } from '@neosmartuxui/library/core';",
  "const root = document.querySelector('#disclosures');",
  "const dispose = bindAccordion(root, { expansion: 'single' });",
  "// Root must contain semantic triggers and panels from the Core fixture.",
  "// Call dispose() when the host removes the component."
 ].join('\n')},
 {name:'React (uncontrolled DOM adapter)',symbol:'bindToggle',code:[
  "import { useEffect, useRef } from 'react';",
  "import { bindToggle } from '@neosmartuxui/library/core';",
  "",
  "export function TactileToggle() {",
  "  const button = useRef(null);",
  "  useEffect(() => {",
  "    if (!button.current) return;",
  "    return bindToggle(button.current);",
  "  }, []);",
  "  return <button ref={button} type=\"button\" className=\"ns-toggle\"",
  "                 aria-pressed=\"false\">Bold</button>;",
  "}",
  "// The adapter owns DOM aria-pressed while mounted. Do not also",
  "// control that attribute through React state without explicit sync."
 ].join('\n')},
 {name:'Vue 3 (mounted DOM adapter)',symbol:'bindNumberField',code:[
  "<script setup>",
  "import { ref, onMounted, onBeforeUnmount } from 'vue';",
  "import { bindNumberField } from '@neosmartuxui/library/core';",
  "",
  "const root = ref(null);",
  "let dispose = null;",
  "onMounted(() => { if (root.value) dispose = bindNumberField(root.value); });",
  "onBeforeUnmount(() => dispose?.());",
  "</script>",
  "",
  "<template>",
  "  <div ref=\"root\" class=\"ns-number-field\">",
  "    <label for=\"quantity\" class=\"ns-number-field__label\">Quantity</label>",
  "    <input id=\"quantity\" class=\"ns-number-field__input\"",
  "           type=\"number\" min=\"0\" max=\"12\" step=\"1\" />",
  "    <button type=\"button\" class=\"ns-number-field__step\"",
  "            data-number-field-action=\"decrement\">−</button>",
  "    <button type=\"button\" class=\"ns-number-field__step\"",
  "            data-number-field-action=\"increment\">+</button>",
  "  </div>",
  "</template>",
  "<!-- Input remains native value authority; avoid duplicate Vue state. -->"
 ].join('\n')}
];
export function integrationGuide(sha){
 const codeBlocks=examples.map(x=>'<section class="detail-section"><div class="detail-section-head"><div><span class="kicker">PRIVATE ESM / '+escape(x.symbol)+'</span><h2>'+escape(x.name)+'</h2></div></div><pre class="detail-code"><code>'+escape(x.code)+'</code></pre></section>').join('');
 const rows=Object.entries(known).map(([name,sym])=>'<tr><td><a href="/components/core/'+name+'/">core.'+name+'</a></td><td><code>'+sym+'</code></td><td>DOM binder and disposer</td></tr>').join('');
 return '<div class="wrap subpage detail-wrap"><nav class="detail-breadcrumb" aria-label="Breadcrumb"><a href="/docs/">Docs</a><span>/</span><span>Integrations</span></nav>'+
 '<header class="detail-head"><span class="pill">PRIVATE LOCAL PACKAGE / VERIFIED EXPORTS</span><h1>Framework integration</h1><p class="detail-intent">Use actual browser DOM adapters with Vanilla JS, React and Vue. These are lifecycle wiring examples, not React or Vue component exports.</p>'+
 '<div class="detail-head-actions"><a class="btn btn-primary" href="https://github.com/neosmartuxui/neosmartuxui/blob/'+escape(sha)+'/packages/adapters/web/core-exports.mjs">Inspect real exports ↗</a><a class="btn" href="/components/">Component Explorer ↗</a></div></header>'+
 '<section class="detail-section"><div class="detail-section-head"><div><span class="kicker">LOCAL ESM ONLY</span><h2>Installation boundary</h2></div></div>'+
 '<p class="detail-context">Run <code>npm run build:library:local</code> in the repository and link its private <code>artifacts/library-package</code> directory into your consuming workspace. The local package is <code>@neosmartuxui/library</code> version 0.0.0-local, marked private. It is NOT available from the npm registry. Import <code>@neosmartuxui/library/core</code>, the local <code>styles/core.css</code>, and one canonical Theme stylesheet.</p>'+
 '<table class="table"><thead><tr><th>Core</th><th>Actual exported binding</th><th>Ownership</th></tr></thead><tbody>'+rows+'</tbody></table>'+
 '<p class="detail-context">Always supply semantic native markup and manage disposer cleanup on unmount. Keep interactive state owned by the native DOM/adapter, or explicitly synchronize application-owned state with the documented setter. Hardline pressure derives from Theme tokens, never application CSS hacks.</p></section>'+
 codeBlocks+
 '<section class="detail-section"><h2>Validation boundaries</h2><p class="detail-context">These binders and the private distribution subpath are validated through actual ESM imports and local source packaging, and DOM actions are tested in Chromium. The React/Vue examples are source-backed integration patterns, not separate shipped or runtime-tested framework component packages. Production and public npm release gates remain closed.</p></section></div>';
}
export const documentedExports=Object.freeze(known);
