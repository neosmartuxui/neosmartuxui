export const FLAVORS = Object.freeze(['hardline','soft','rivet','mono','pulse']);
export const GROUPED_CORE_COVERAGE = Object.freeze({
  'core.label': ['foundry-core-expansion-batch.spec.mjs','Label preserves native association'],
  'core.separator': ['foundry-core-expansion-batch.spec.mjs','Separator exposes semantic'],
  'core.progress': ['foundry-core-expansion-batch.spec.mjs','Progress uses native reporting'],
  'core.spinner': ['foundry-core-expansion-batch.spec.mjs','Spinner is visual-only'],
  'core.button-group': ['foundry-core-grouped-controls.spec.mjs','ButtonGroup preserves real buttons'],
  'core.input-group': ['foundry-core-grouped-controls.spec.mjs','InputGroup leaves value'],
  'core.number-field': ['foundry-core-value-controls.spec.mjs','NumberField preserves native numeric'],
  'core.slider': ['foundry-core-value-controls.spec.mjs','Slider scalar mode'],
  'core.toggle': ['foundry-core-toggle-controls.spec.mjs','Toggle is a native'],
  'core.toggle-group': ['foundry-core-toggle-controls.spec.mjs','ToggleGroup keeps ordinary'],
  'core.color-picker': ['foundry-core-native-value-inputs.spec.mjs','ColorPicker preserves a real'],
  'core.time-picker': ['foundry-core-native-value-inputs.spec.mjs','TimePicker preserves native time']
});
const idSuffix = (id) => id.slice('core.'.length);
export function coveragePlanFor(id) {
  if (id.startsWith('core.')) {
    const grouped = GROUPED_CORE_COVERAGE[id];
    const file = grouped?.[0] || `foundry-core-${idSuffix(id)}.spec.mjs`;
    return { id, previewFile: 'component-preview-substrate.spec.mjs',
      previewTitle: `${id} shared preview realizes every canonical state`,
      behaviorFile: file, behaviorTitlePrefix: grouped?.[1] || null };
  }
  const flavor = id.replace(/^flavor\./,'');
  if (id !== 'flavor.' + flavor || !FLAVORS.includes(flavor)) {
    throw new Error(`Unexpected proof subject: ${id}`);
  }
  return { id, flavorFiles: [`foundry-${flavor}-light.spec.mjs`,
    `foundry-${flavor}-dark.spec.mjs`] };
}
export function coverageFor(report, id) {
  const plan = coveragePlanFor(id);
  const matches = [];
  function visit(suites) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) matches.push({ file: spec.file || suite.file, ...spec });
      visit(suite.suites);
    }
  }
  visit(report?.suites);
  const good = (spec) => spec.ok === true && Array.isArray(spec.tests) &&
    spec.tests.length > 0 && spec.tests.every(test => test.status === 'expected' &&
      test.results?.length === 1 && test.results[0].status === 'passed');
  if (plan.flavorFiles) {
    const files = plan.flavorFiles.map(file => ({
      file, count: matches.filter(x => x.file === file && good(x)).length
    }));
    const pass = files.every(item => item.count >= 4);
    return { ...plan, files, passed: pass };
  }
  const preview = matches.find(x => x.file === plan.previewFile &&
    x.title === plan.previewTitle && good(x));
  const behaviors = matches.filter(x => x.file === plan.behaviorFile &&
    (plan.behaviorTitlePrefix === null || x.title.startsWith(plan.behaviorTitlePrefix)) &&
    good(x));
  return { ...plan, previewPassed: !!preview, behaviorCount: behaviors.length,
    passed: !!preview && behaviors.length >= 1 };
}
export function verifyEntireCohortCoverage(report, subjects) {
  const coverage = subjects.map(subject => coverageFor(report, subject.id));
  const failures = coverage.filter(x => !x.passed).map(x => x.id);
  return { passed: failures.length === 0 && subjects.length === 54 &&
    new Set(subjects.map(x => x.id)).size === 54, coverage, failures };
}
