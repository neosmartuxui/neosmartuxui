import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const registry = JSON.parse(await readFile(resolve(root, 'packages/core/component-registry.json'), 'utf8'));
const componentClaims = registry.components
  .filter((entry) => entry.maturity === 'public-proof')
  .map((entry) => ({ id: entry.id, proofPath: entry.evidence.publicProof }));
const flavorClaims = [];
for (const name of (await readdir(resolve(root, 'evidence/public'))).filter((name) => /^flavor\.[a-z][a-z0-9-]*\.json$/.test(name)).sort()) {
  const proofPath = `evidence/public/${name}`;
  const proof = JSON.parse(await readFile(resolve(root, proofPath), 'utf8'));
  flavorClaims.push({ id: proof.flavor, proofPath });
}
const claims = [...componentClaims, ...flavorClaims];

const liveMarkers = new Map([
  ['core.button', ['NeoSmartUI Foundry', 'core.button', 'Pressure, not levitation']],
  ['core.checkbox', ['NeoSmartUI Foundry', 'core.checkbox', 'Toggle tactile selection', 'Indeterminate presentation']],
  ['core.input', ['NeoSmartUI Foundry', 'core.input', 'Single-line native input', 'interactive, not pressable']],
  ['core.radio', ['NeoSmartUI Foundry', 'core.radio', 'Choose one native radio option', 'Alpha choice', 'Beta choice']],
  ['core.switch', ['NeoSmartUI Foundry', 'core.switch', 'Toggle immediate binary setting']],
  ['core.tabs', ['NeoSmartUI Foundry', 'core.tabs', 'Automatic horizontal activation', 'Manual vertical activation', 'Selected tabs stay seated in their rail']],
  ['core.textarea', ['NeoSmartUI Foundry', 'core.textarea', 'Multiline native textarea', 'interactive, not pressable', 'resize behavior']],
  ['core.select', ['NeoSmartUI Foundry', 'core.select', 'Native single-select choice', 'browser/OS option popup']],
  ['core.card', ['NeoSmartUI Foundry', 'core.card', 'Stable informational surface', 'Grouped content, not a disguised button.', 'Resting depth is structure, not hover affordance.']],
  ['core.badge', ['NeoSmartUI Foundry', 'core.badge', 'Badge tone examples', 'Neutral metadata', 'Info · Reference', 'Success · Ready', 'Warning · Needs attention', 'Error · Failed']],
  ['core.alert', ['NeoSmartUI Foundry', 'core.alert', 'Alert tone examples', 'Neutral · Note', 'Static message surface; no implicit live region.', 'Info · Update', 'Success · Complete', 'Warning · Check this', 'Error · Needs correction']],
  ['core.field', ['NeoSmartUI Foundry', 'core.field', 'Email address', 'This invite code has expired. Request a new code.', 'The disabled state belongs to the real control, not the Field container.']],
  ['core.breadcrumb', ['NeoSmartUI Foundry', 'core.breadcrumb', 'Ancestor locations stay native links', 'aria-current="page"']],
  ['core.pagination', ['NeoSmartUI Foundry', 'core.pagination', 'Pagination keeps page destinations as native links with 44px tactile targets.', 'aria-current="page"', 'aria-label="Next page"']],
  ['core.segmented-control', ['NeoSmartUI Foundry', 'core.segmented-control', 'View mode', 'Overview', 'Activity', 'History', 'normal Tab, Space, and Enter button behavior']],
  ['core.tooltip', ['NeoSmartUI Foundry', 'core.tooltip', 'Tooltip keeps supplemental descriptions non-interactive', 'aria-describedby="tooltip-demo"', 'role="tooltip"', 'Read the permanent interaction rules', 'Continue without entering the tooltip']],
  ['core.combobox', ['NeoSmartUI Foundry', 'core.combobox', 'Editable single-selection Combobox', 'role="combobox"', 'aria-autocomplete="list"', 'aria-controls="combobox-listbox"', 'role="listbox"', 'Choose one framework', 'Show suggestions', 'Svelte · unavailable', 'No matching suggestions']],
  ['core.accordion', ['NeoSmartUI Foundry', 'core.accordion', 'Accordion discloses related content with real buttons', 'data-expansion="single"', 'data-expansion="multiple"', 'aria-controls="accordion-single-panel-a"']],
  ['core.label', ['NeoSmartUI Foundry', 'core.label', 'Workspace name', 'Archived workspace']],
  ['core.separator', ['NeoSmartUI Foundry', 'core.separator', 'Account settings', 'Security settings']],
  ['core.progress', ['NeoSmartUI Foundry', 'core.progress', 'Queued · 0%', 'Uploading · 42%', 'Preparing workspace', 'Complete · 100%']],
  ['core.spinner', ['NeoSmartUI Foundry', 'core.spinner', 'Loading account data…']],
  ['core.button-group', ['NeoSmartUI Foundry', 'core.button-group', 'ButtonGroup clusters related real Buttons', 'Document actions', 'Save', 'Duplicate', 'Archive']],
  ['core.input-group', ['NeoSmartUI Foundry', 'core.input-group', 'InputGroup composes a primary native editing control', 'Workspace handle', 'Invite code contains unsupported characters.', 'Managed handle']],
  ['core.toggle', ['NeoSmartUI Foundry', 'core.toggle', 'Toggle is a real pressed-state Button', 'aria-pressed="false"', 'Bold']],
  ['core.toggle-group', ['NeoSmartUI Foundry', 'core.toggle-group', 'ToggleGroup coordinates labelled Toggle buttons', 'data-selection-mode="multiple"', 'data-selection-mode="single"', 'Text styles', 'Text alignment']],
  ['core.number-field', ['NeoSmartUI Foundry', 'core.number-field', 'NumberField keeps a real numeric input as the value authority.', 'type="number"', 'Quantity', 'data-number-field-action="increment"']],
  ['core.slider', ['NeoSmartUI Foundry', 'core.slider', 'Slider uses native range inputs for scalar and two-thumb range modes.', 'data-slider-mode="range"', 'type="range"', 'Budget range']],
  ['core.multi-select', ['NeoSmartUI Foundry', 'core.multi-select', 'MultiSelect keeps zero-or-more committed values in one explicit multi-selection listbox.', 'aria-multiselectable="true"', 'Frameworks', 'Choose any number. Arrow keys move the highlight; Space or Enter toggles the highlighted option.']],
  ['core.file-upload', ['NeoSmartUI Foundry', 'core.file-upload', 'FileUpload keeps one real native file input as selected-file and form authority.', 'type="file"', 'Project files', 'Files remain local in this Core demo. Upload transport is outside this component.']],
  ['core.calendar', ['NeoSmartUI Foundry', 'core.calendar', 'Calendar exposes one roving calendar grid with ISO date authority.', 'role="grid"', 'September 2026', 'data-calendar-previous', 'data-calendar-next']],
  ['core.date-picker', ['NeoSmartUI Foundry', 'core.date-picker', 'DatePicker coordinates ISO date entry and a non-modal disclosure around the shipping Calendar primitive.', 'Date', 'End date', 'Enter ISO dates as YYYY-MM-DD, or use the calendar.', 'Calendar dates']],
  ['core.dialog', ['NeoSmartUI Foundry', 'core.dialog', "Dialog uses the browser's native modal top layer and focus containment.", 'Create a reusable workspace', 'This modal keeps focus contained until you close it.', 'data-dialog-trigger', 'dialog-surface']],
  ['core.alert-dialog', ['NeoSmartUI Foundry', 'core.alert-dialog', 'AlertDialog uses the native modal top layer for an important response-required message, requires a prompt description, and focuses the least-destructive response before an irreversible choice.', 'Discard unsaved changes?', 'This removes the unsaved local edits. Choose the safer response first if you are unsure.', 'role="alertdialog"', 'data-alert-dialog-least-destructive']],
  ['core.drawer', ['NeoSmartUI Foundry', 'core.drawer', 'Supplemental content stays modal while the Drawer is open. Placement is configuration, not navigation.', 'Open activity drawer', 'Workspace activity', 'Supplemental content stays modal while the Drawer is open. Placement is configuration, not navigation.', 'data-drawer-placement="inline-end"', 'data-drawer-swipe-handle']],
  ['core.popover', ['NeoSmartUI Foundry', 'core.popover', 'Popover uses the platform non-modal top layer with explicit invocation, native light dismiss, ordinary document focus traversal, and logical anchored placement without becoming Dialog, Tooltip, or a menu.', 'Open quick actions', 'Quick actions', 'Supplemental actions stay anchored and non-modal. The rest of the page remains interactive.', 'popovertarget="popover-surface"', 'popover="auto"']],
  ['core.hover-card', ['NeoSmartUI Foundry', 'core.hover-card', 'HoverCard reveals richer read-only preview content from pointer hover or keyboard focus after a controlled delay, without becoming Tooltip, Popover, a menu, or a focus destination.', 'Preview interaction principles', 'Pressure, not levitation', 'Pointer hover + keyboard focus', 'Native behavior remains untouched', 'aria-details="hover-card-surface"', 'data-hover-card-side="block-end"']],
  ['core.dropdown-menu', ['NeoSmartUI Foundry', 'core.dropdown-menu', 'DropdownMenu turns one real menu button into a temporary action menu with managed item focus, arrow/Home/End/typeahead navigation, checkable item state, Escape restoration, and ordinary Tab traversal without becoming ContextMenu, Menubar, NavigationMenu, or a value picker.', 'Actions', 'Open details', 'Pin item', 'Compact view', 'Comfortable view', 'Archive unavailable', 'aria-haspopup="menu"', 'role="menu"', 'data-dropdown-menu-side="block-end"']],
  ['core.context-menu', ['NeoSmartUI Foundry', 'core.context-menu', 'ContextMenu enhances one already keyboard-reachable context target with right-click, context-key, and cancellable long-press invocation while preserving ordinary primary activation, visible fallback discovery, managed menu focus, and native document traversal.', 'Project card', 'Project card actions', 'Open details', 'Pin item', 'Compact view', 'Comfortable view', 'Archive unavailable', 'Visible action: Open details', 'data-context-menu-target', 'role="menu"']],
  ['core.menubar', ['NeoSmartUI Foundry', 'core.menubar', 'Menubar keeps one persistent application-command menu row in ordinary Tab order, uses visual-direction root roving focus, and opens at most one first-level command menu without becoming site navigation, a toolbar, or a searchable command palette.', 'Document commands', 'File', 'Edit', 'Autosave', 'Refresh', 'Publish unavailable', 'New document', 'Pin sidebar', 'Compact view', 'Comfortable view', 'Export unavailable', 'role="menubar"']],
  ['core.navigation-menu', ['NeoSmartUI Foundry', 'core.navigation-menu', 'NavigationMenu preserves native site/application navigation: real destination links stay in ordinary document traversal, separate disclosure buttons reveal one first-level destination list, and <code>aria-current="page"</code> remains authored route state without becoming an application-command menu or router.', 'id="navigation-menu-demo"', 'aria-label="Primary navigation"', 'id="navigation-menu-guides-trigger"', 'id="navigation-menu-guides-panel"', 'aria-current="page"']],
  ['core.toast', ['NeoSmartUI Foundry', 'core.toast', 'Saved · Draft updated', 'Queued · Sync complete', 'id="toast-demo"', 'data-toast-region', 'data-toast-priority="polite"', 'data-toast-dismiss']],
  ['core.table', ['NeoSmartUI Foundry', 'core.table', 'Table preserves native semantic row/column relationships for static or read-only data', 'id="table-demo"', '<caption>Workspace access summary</caption>', 'scope="col"', 'scope="row"']],
  ['core.data-grid', ['NeoSmartUI Foundry', 'core.data-grid', 'DataGrid is an interactive tabular composite', 'id="data-grid-demo"', 'role="grid"', 'aria-label="Workspace access grid"', 'data-selection-enabled="true"', 'id="data-grid-r1c1"', 'data-grid-editor']],
  ['core.item', ['NeoSmartUI Foundry', 'core.item', 'Foundry workspace', 'Reusable component evidence, previews, and accessibility contracts for every public-proof surface.', 'id="item-demo"', 'data-state="rest"', 'Foundry workspace actions', 'id="item-demo-action"', 'After Item']],
  ['core.list', ['NeoSmartUI Foundry', 'core.list', 'Foundry workspace', 'Public component evidence and canonical previews remain one semantic list item.', 'id="list-demo"', 'aria-label="NeoSmartUI workspaces"', 'id="list-demo-action"', 'After List']],
  ['core.input-otp', ['NeoSmartUI Foundry', 'core.input-otp', 'InputOTP keeps one real text input as the logical code authority.', 'autocomplete="one-time-code"', 'Verification code', 'Paste and platform one-time-code autofill remain native.']],
  ['core.color-picker', ['NeoSmartUI Foundry', 'core.color-picker', 'ColorPicker keeps a real native color input as the value and platform-picker authority.', 'type="color"', 'Accent color', '#5A1832']],
  ['core.time-picker', ['NeoSmartUI Foundry', 'core.time-picker', 'TimePicker keeps a real native time input with min/max/step and segmented editing authority.', 'type="time"', 'Meeting time', 'min="09:00"', 'max="17:00"']],
  ['flavor.hardline', [
    'Hardline Light',
    'ns-theme-hardline-light',
    'Pressure, not levitation',
    'Shared <code>core.button</code>',
    'Shared <code>core.input</code>',
    'hardline-dark-theme.css',
    'ns-theme-hardline-dark',
    'Hardline Dark',
    'Concrete Dark Theme',
    'Shared <code>core.button</code> · Dark',
    'Shared <code>core.input</code> · Dark'
  ]],
  ['flavor.mono', [
    'Mono Light',
    'ns-theme-mono-light',
    'Editorial pressure, shared semantics',
    'Shared <code>core.button</code>',
    'Shared <code>core.input</code>',
    'mono-dark-theme.css',
    'ns-theme-mono-dark',
    'Mono Dark',
    'Concrete Dark Theme',
    'Shared <code>core.button</code> · Dark',
    'Shared <code>core.input</code> · Dark',
    'Shared <code>core.card</code> · Dark',
    'Shared <code>core.badge</code> · Dark',
    'Written status labels remain authoritative'
  ]],
  ['flavor.rivet', [
    'Rivet Light',
    'ns-theme-rivet-light',
    'Mechanical pressure, shared semantics',
    'Shared <code>core.button</code>',
    'Shared <code>core.input</code>',
    'rivet-dark-theme.css',
    'ns-theme-rivet-dark',
    'Rivet Dark',
    'Concrete Dark Theme',
    'Shared <code>core.button</code> · Dark',
    'Shared <code>core.input</code> · Dark',
    'Shared <code>core.card</code> · Dark',
    'Shared <code>core.badge</code> · Dark',
    'Written status labels remain authoritative'
  ]],
  ['flavor.soft', [
    'Soft Light',
    'ns-theme-soft-light',
    'Compress, never float',
    'Shared <code>core.button</code>',
    'Shared <code>core.input</code>',
    'soft-dark-theme.css',
    'ns-theme-soft-dark',
    'Soft Dark',
    'Concrete Dark Theme',
    'Shared <code>core.button</code> · Dark',
    'Shared <code>core.input</code> · Dark'
  ]],
  ['flavor.pulse', [
    'Pulse Light',
    'ns-theme-pulse-light',
    'SaaS-forward high-energy NeoSmartUI flavor',
    'Shared <code>core.button</code>',
    'Shared <code>core.input</code>',
    'pulse-dark-theme.css',
    'ns-theme-pulse-dark',
    'Pulse Dark',
    'Concrete Dark Theme',
    'Shared <code>core.button</code> · Dark',
    'Shared <code>core.input</code> · Dark',
    'Shared <code>core.card</code> · Dark',
    'Shared <code>core.badge</code> · Dark',
    'Written status labels remain authoritative'
  ]]
]);

const assetMarkers = new Map([
  ['flavor.hardline', ['.ns-theme-hardline-light {', '--ns-radius-control: 0px;', '--ns-depth-rest-x: 4px;', '--ns-depth-hover-x: 2px;', '--ns-depth-active-x: 0px;', '--ns-press-active-x: 4px;', '--ns-motion-press-duration: 70ms;', '--ns-size-control-minimum: 44px;', '--ns-focus-ring-width: 3px;', '--ns-color-state-success: #8ee8b0;', '--ns-color-state-warning: #ffd84d;', '--ns-color-state-error: #c1121f;', '--ns-color-state-info: #b8a1ff;']],
  ['flavor.mono', ['.ns-theme-mono-light {', '--ns-border-control-width: 2px;', '--ns-radius-control: 0px;', '--ns-radius-annotation: 0px;', '--ns-depth-rest-x: 3px;', '--ns-depth-hover-x: 1px;', '--ns-depth-active-x: 0px;', '--ns-press-active-x: 3px;', '--ns-motion-press-duration: 65ms;', '--ns-size-control-minimum: 44px;', '--ns-focus-ring-width: 3px;', '--ns-color-action-primary-surface: #111111;', '--ns-font-family-body: ui-serif, Georgia, serif;', '--ns-color-state-success: #d9d9d9;', '--ns-color-state-warning: #bdbdbd;', '--ns-color-state-error: #1f1f1f;', '--ns-color-state-info: #e5e5e5;']],
  ['flavor.rivet', ['.ns-theme-rivet-light {', '--ns-border-control-width: 3px;', '--ns-radius-control: 6px;', '--ns-depth-rest-x: 5px;', '--ns-depth-hover-x: 3px;', '--ns-depth-active-x: 0px;', '--ns-press-active-x: 5px;', '--ns-motion-press-duration: 80ms;', '--ns-size-control-minimum: 44px;', '--ns-focus-ring-width: 3px;', '--ns-color-action-primary-surface: #b9a1ed;', '--ns-color-state-success: #2fa371;', '--ns-color-state-warning: #c98017;', '--ns-color-state-error: #b83a31;', '--ns-color-state-info: #5397c7;']],
  ['flavor.soft', ['.ns-theme-soft-light {', '--ns-border-control-width: 2px;', '--ns-radius-control: 8px;', '--ns-radius-surface: 12px;', '--ns-depth-rest-x: 3px;', '--ns-depth-hover-x: 1.5px;', '--ns-depth-active-x: 0px;', '--ns-press-active-x: 3px;', '--ns-motion-press-duration: 70ms;', '--ns-size-control-minimum: 44px;', '--ns-focus-ring-width: 3px;', '--ns-color-state-success: #9fdab9;', '--ns-color-state-warning: #edd278;', '--ns-color-state-error: #cb3226;', '--ns-color-state-info: #c4b3ef;']],
  ['flavor.pulse', ['.ns-theme-pulse-light {', '--ns-border-control-width: 2px;', '--ns-radius-control: 4px;', '--ns-radius-surface: 6px;', '--ns-depth-rest-x: 4px;', '--ns-depth-hover-x: 2px;', '--ns-depth-active-x: 0px;', '--ns-press-active-x: 4px;', '--ns-motion-press-duration: 65ms;', '--ns-motion-release-duration: 105ms;', '--ns-motion-standard-duration: 145ms;', '--ns-size-control-minimum: 44px;', '--ns-color-action-primary-surface: #6c5ce7;', '--ns-color-focus-ring: #4e3ccf;', '--ns-focus-ring-width: 3px;', '--ns-focus-ring-offset: 3px;']]
]);

const hardlineDarkAssetMarkers = [
  '.ns-theme-hardline-dark {',
  '--ns-color-surface-interactive: #141414;',
  '--ns-color-surface-panel: #1d1d1d;',
  '--ns-color-content-primary: #f5f5f5;',
  '--ns-color-action-primary-surface: #ffd84d;',
  '--ns-color-action-primary-content: #111111;',
  '--ns-color-state-success: #19793d;',
  '--ns-color-state-warning: #826600;',
  '--ns-color-state-error: #ff737d;',
  '--ns-color-state-info: #6e3fff;',
  '--ns-radius-control: 0px;',
  '--ns-depth-rest-x: 4px;',
  '--ns-depth-hover-x: 2px;',
  '--ns-depth-active-x: 0px;',
  '--ns-press-active-x: 4px;',
  '--ns-motion-press-duration: 70ms;',
  '--ns-motion-release-duration: 110ms;',
  '--ns-motion-standard-duration: 170ms;',
  '--ns-size-control-minimum: 44px;',
  '--ns-color-focus-ring: #8fb3ff;',
  '--ns-focus-ring-width: 3px;',
  '--ns-focus-ring-offset: 3px;'
];

const monoDarkAssetMarkers = [
  '.ns-theme-mono-dark {',
  '--ns-color-surface-interactive: #151515;',
  '--ns-color-surface-panel: #202020;',
  '--ns-color-content-primary: #f2f2f2;',
  '--ns-color-content-secondary: #c4c4c4;',
  '--ns-color-content-inverse: #111111;',
  '--ns-color-border-default: #9a9a9a;',
  '--ns-color-border-strong: #f2f2f2;',
  '--ns-color-action-primary-surface: #f2f2f2;',
  '--ns-color-action-primary-content: #111111;',
  '--ns-color-state-success: #606060;',
  '--ns-color-state-warning: #585858;',
  '--ns-color-state-error: #d0d0d0;',
  '--ns-color-state-info: #686868;',
  '--ns-border-control-width: 2px;',
  '--ns-border-surface-width: 2px;',
  '--ns-border-annotation-width: 2px;',
  '--ns-radius-control: 0px;',
  '--ns-radius-surface: 0px;',
  '--ns-radius-annotation: 0px;',
  '--ns-size-control-minimum: 44px;',
  '--ns-depth-rest-x: 3px;',
  '--ns-depth-rest-y: 3px;',
  '--ns-depth-hover-x: 1px;',
  '--ns-depth-hover-y: 1px;',
  '--ns-depth-active-x: 0px;',
  '--ns-depth-active-y: 0px;',
  '--ns-press-hover-x: 2px;',
  '--ns-press-hover-y: 2px;',
  '--ns-press-active-x: 3px;',
  '--ns-press-active-y: 3px;',
  '--ns-motion-press-duration: 65ms;',
  '--ns-motion-release-duration: 100ms;',
  '--ns-motion-standard-duration: 140ms;',
  '--ns-color-focus-ring: #ffffff;',
  '--ns-focus-ring-width: 3px;',
  '--ns-focus-ring-offset: 3px;',
  '--ns-font-family-body: ui-serif, Georgia, serif;'
];

const rivetDarkAssetMarkers = [
  '.ns-theme-rivet-dark {',
  '--ns-color-surface-interactive: #18171c;',
  '--ns-color-surface-panel: #232129;',
  '--ns-color-content-primary: #f6f3fa;',
  '--ns-color-content-secondary: #c9c3d1;',
  '--ns-color-content-inverse: #211c2b;',
  '--ns-color-border-default: #aaa4b2;',
  '--ns-color-border-strong: #f5f1fa;',
  '--ns-color-action-primary-surface: #c7b5f2;',
  '--ns-color-action-primary-content: #211c2b;',
  '--ns-color-state-success: #2e7644;',
  '--ns-color-state-warning: #5e7008;',
  '--ns-color-state-error: #ef8a84;',
  '--ns-color-state-info: #764dd6;',
  '--ns-border-control-width: 3px;',
  '--ns-border-surface-width: 3px;',
  '--ns-border-annotation-width: 2px;',
  '--ns-radius-control: 6px;',
  '--ns-radius-surface: 6px;',
  '--ns-radius-annotation: 999px;',
  '--ns-size-control-minimum: 44px;',
  '--ns-depth-rest-x: 5px;',
  '--ns-depth-rest-y: 5px;',
  '--ns-depth-hover-x: 3px;',
  '--ns-depth-hover-y: 3px;',
  '--ns-depth-active-x: 0px;',
  '--ns-depth-active-y: 0px;',
  '--ns-press-hover-x: 2px;',
  '--ns-press-hover-y: 2px;',
  '--ns-press-active-x: 5px;',
  '--ns-press-active-y: 5px;',
  '--ns-motion-press-duration: 80ms;',
  '--ns-motion-release-duration: 140ms;',
  '--ns-motion-standard-duration: 160ms;',
  '--ns-color-focus-ring: #cdbdf7;',
  '--ns-focus-ring-width: 3px;',
  '--ns-focus-ring-offset: 3px;'
];

const softDarkAssetMarkers = [
  '.ns-theme-soft-dark {',
  '--ns-color-surface-interactive: #1e1b19;',
  '--ns-color-surface-panel: #292522;',
  '--ns-color-content-primary: #f7f1e8;',
  '--ns-color-action-primary-surface: #8fb8f4;',
  '--ns-color-action-primary-content: #171513;',
  '--ns-color-state-success: #30744d;',
  '--ns-color-state-warning: #806315;',
  '--ns-color-state-error: #e88983;',
  '--ns-color-state-info: #734ecd;',
  '--ns-border-control-width: 2px;',
  '--ns-radius-control: 8px;',
  '--ns-radius-surface: 12px;',
  '--ns-depth-rest-x: 3px;',
  '--ns-depth-hover-x: 1.5px;',
  '--ns-depth-active-x: 0px;',
  '--ns-press-active-x: 3px;',
  '--ns-motion-press-duration: 70ms;',
  '--ns-motion-release-duration: 105ms;',
  '--ns-motion-standard-duration: 165ms;',
  '--ns-size-control-minimum: 44px;',
  '--ns-color-focus-ring: #9ec4ff;',
  '--ns-focus-ring-width: 3px;',
  '--ns-focus-ring-offset: 3px;'
];

const pulseDarkAssetMarkers = [
  '.ns-theme-pulse-dark {',
  '--ns-color-surface-interactive: #171821;',
  '--ns-color-surface-panel: #20222d;',
  '--ns-color-content-primary: #f7f7fb;',
  '--ns-color-content-secondary: #b8bcc8;',
  '--ns-color-content-inverse: #15161a;',
  '--ns-color-border-default: #7d8392;',
  '--ns-color-border-strong: #f7f7fb;',
  '--ns-color-action-primary-surface: #9b8cff;',
  '--ns-color-action-primary-content: #15161a;',
  '--ns-color-state-success: #216b4a;',
  '--ns-color-state-warning: #6f5500;',
  '--ns-color-state-error: #ff8a80;',
  '--ns-color-state-info: #315c8a;',
  '--ns-border-control-width: 2px;',
  '--ns-radius-control: 4px;',
  '--ns-radius-surface: 6px;',
  '--ns-size-control-minimum: 44px;',
  '--ns-depth-rest-x: 4px;',
  '--ns-depth-hover-x: 2px;',
  '--ns-depth-active-x: 0px;',
  '--ns-press-hover-x: 2px;',
  '--ns-press-active-x: 4px;',
  '--ns-motion-press-duration: 65ms;',
  '--ns-motion-release-duration: 105ms;',
  '--ns-motion-standard-duration: 145ms;',
  '--ns-color-focus-ring: #b8a8ff;',
  '--ns-focus-ring-width: 3px;',
  '--ns-focus-ring-offset: 3px;'
];

const fetchWithRetry = async (url, attempts = 6) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'cache-control': 'no-cache', 'user-agent': 'NeoSmartUI-Public-Proof/1' },
        signal: AbortSignal.timeout(10_000)
      });
      if (response.ok) return response;
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000));
  }
  throw new Error(`${url} live verification failed after ${attempts} attempts: ${lastError?.message || 'unknown error'}`);
};

for (const claim of claims) {
  const proof = JSON.parse(await readFile(resolve(root, claim.proofPath), 'utf8'));
  const recordResponse = await fetchWithRetry(proof.live.deploymentRecordUrl);
  const record = await recordResponse.json();
  if (record.schema !== 'neosmartui/deployment-record@1') throw new Error(`[public-proof-live] ${claim.id} live deployment schema mismatch`);
  if (record.sourceRepository !== proof.deployedSource.repository || record.sourceSha !== proof.deployedSource.sha || record.artifact !== 'foundry') throw new Error(`[public-proof-live] ${claim.id} live deployment record does not match proven source`);

  const markers = liveMarkers.get(claim.id);
  if (!markers) throw new Error(`[public-proof-live] ${claim.id} has no explicit live marker contract`);
  const pageResponse = await fetchWithRetry(proof.live.pageUrl);
  const html = await pageResponse.text();
  for (const marker of markers) if (!html.includes(marker)) throw new Error(`[public-proof-live] ${claim.id} live page missing ${marker}`);

  for (const assetUrl of proof.live.assetUrls ?? []) {
    const assetResponse = await fetchWithRetry(assetUrl);
    const asset = await assetResponse.text();
    const markersForAsset =
      claim.id === 'flavor.hardline' && assetUrl === 'https://neosmartui.github.io/hardline-dark-theme.css'
        ? hardlineDarkAssetMarkers
        : claim.id === 'flavor.mono' && assetUrl === 'https://neosmartui.github.io/mono-dark-theme.css'
          ? monoDarkAssetMarkers
          : claim.id === 'flavor.rivet' && assetUrl === 'https://neosmartui.github.io/rivet-dark-theme.css'
            ? rivetDarkAssetMarkers
            : claim.id === 'flavor.soft' && assetUrl === 'https://neosmartui.github.io/soft-dark-theme.css'
            ? softDarkAssetMarkers
            : claim.id === 'flavor.pulse' && assetUrl === 'https://neosmartui.github.io/pulse-dark-theme.css'
              ? pulseDarkAssetMarkers
              : assetMarkers.get(claim.id) ?? [];
    for (const marker of markersForAsset) if (!asset.includes(marker)) throw new Error(`[public-proof-live] ${claim.id} live asset ${assetUrl} missing ${marker}`);
  }
  console.log(`[public-proof-live] ${claim.id} verified at ${pageResponse.url}; deployment record ${recordResponse.url} = ${record.sourceSha}`);
}
