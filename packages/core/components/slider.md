# `core.slider`

`core.slider` selects a scalar value or bounded range along an axis.

## Count-integrity boundary

A one-thumb scalar Slider and a two-thumb range Slider are modes of the same Core capability. `RangeSlider` MUST NOT become a second public component ID merely to inflate breadth.

## Semantic boundary

Slider owns value selection through one or two slider thumbs. Labels, help text, form layout, numeric text entry, and task progress belong to other capabilities.

## Semantics and keyboard

Each thumb is focusable and exposes slider value semantics with min/max/current value. Arrow keys adjust by the configured step; PageUp/PageDown and Home/End behavior, when supported, must be documented and deterministic. In range mode, thumb ordering/crossing policy must be explicit and accessible.

Pointer/touch dragging must preserve the minimum effective target and cannot depend on hover. Orientation and RTL affect logical direction without changing value authority.

## State and pressure law

States are `rest`, `hover`, `focus-visible`, `pressed`, and `disabled`. A thumb may compress toward its track during direct manipulation; motion reduction removes non-essential travel without removing value feedback.

## Canonical Web implementation

The Web adapter uses real `<input type="range">` controls as the value and keyboard authority. Scalar mode binds one range input. Range mode binds two separately labelled range inputs under one `core.slider` root; the adapter enforces a no-cross policy by exposing dynamic lower/upper native bounds while retaining the shared outer min/max/step contract.

The adapter does not install synthetic Arrow/Home/End/Page key handlers. Native range behavior remains authoritative. Visual pressure is confined to the range thumb during direct manipulation; the track does not lift.

## Maturity

Maturity is `public-proof`. The proof record binds the exact deployed merged-main cohort, live Foundry surface, and current implementation blobs.
