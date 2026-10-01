const assert = require('node:assert/strict');
const { test } = require('node:test');
const { build } = require('esbuild');
const vm = require('node:vm');
const path = require('node:path');

test('offensive language detection flags common phrases and loads its model from backend cwd', async () => {
  const result = await build({
    entryPoints: [path.join(__dirname, '../services/ai.service.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    plugins: [{
      name: 'mock-config',
      setup(builder) {
        builder.onResolve({ filter: /^\.\.\/config$/ }, () => ({ path: 'config', namespace: 'mock' }));
        builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const rulesConfig = {};' }));
      }
    }]
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, process, console
  });

  const service = new module.exports.AiService();
  assert.ok(service.offensiveModel);
  const detection = service.analyzeOffensive('That was a shameful, stupid lie!');
  assert.equal(detection.isOffensive, true);
  assert.deepEqual(Array.from(detection.flaggedWords), ['stupid', 'lie', 'shameful']);
});