# `core.file-upload`

`core.file-upload` is the generic local-file acquisition primitive.

## Semantic boundary

A real file input or accessibility-equivalent native file-selection authority owns chosen files, accept/multiple constraints and form semantics. Drag/drop is an input mode of the same capability, not a separate `Dropzone` Core ID. Core owns acquisition/selection/validation presentation only; it MUST NOT own network transport, cloud provider APIs, retry policy, server progress or business-specific file processing.

## State and interaction law

Canonical states are `rest`, `hover`, `focus-visible`, `pressed`, `drag-active`, `empty`, `selected`, `invalid`, `disabled`.

The browse/select action may use pressure feedback, while a passive drop surface does not levitate. `drag-active` is transient acquisition feedback and MUST NOT imply that files were accepted before validation/selection actually resolves.

## Accessibility and input law

Users must be able to activate the native picker by keyboard/touch, understand selected file state without color alone, and recover from invalid selection. Drag/drop can enhance but never replace the keyboard-operable file picker. Disabled state makes both picker and drop acquisition unavailable.

## Token boundary

This implementation introduces no component-specific semantic token contract. It reuses the existing NeoSmartUI semantic roles; the implementation cohort expands official local Theme scope from 32 to 33 while preserving the exact 55-token semantic union.

## Canonical Web implementation

The canonical Web adapter binds an `.ns-file-upload` root containing exactly one real `<input type="file">`. That native input remains the selected-file, `accept`, `multiple`, form, keyboard, touch, and platform-picker authority. The adapter mirrors its `FileList` into explicit selection/count/name metadata and written summary text; it does not replace file semantics with divs, hidden business state, or a second value store.

The same owned drop surface accepts drag events as an alternate acquisition mode. Dropped `File` objects are copied into the native input's `files` authority through browser `DataTransfer`; `drag-active` remains transient and returns to the actual empty/selected/invalid state after drop or drag exit. The drop surface itself does not gain pressure travel. The real native file input is the browse/select action surface and may use the family pressure law.

Invalid and disabled state stay explicit through native input attributes plus written messaging. Disabled state blocks both native picker and drop acquisition. The adapter installs no submit, fetch, XMLHttpRequest, WebSocket, retry, upload-progress, cloud-provider, or file-processing behavior.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs. Proof-only promotion does not redeploy Pages.
