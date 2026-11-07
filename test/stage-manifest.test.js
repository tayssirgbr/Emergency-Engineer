import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('Stage Progression & Pedagogical Order (P5-#22)', () => {
  const indexData = JSON.parse(fs.readFileSync('data/stages/index.json', 'utf8'));
  const stages = indexData.stages;

  test('Index contains exactly 20 stages with unique sequential indices 1..20', () => {
    assert.equal(stages.length, 20);
    const seenIndices = new Set();
    const seenIds = new Set();

    stages.forEach((s, idx) => {
      assert.equal(s.stageIndexInLevel, idx + 1);
      assert.ok(!seenIndices.has(s.stageIndexInLevel), `Duplicate index ${s.stageIndexInLevel}`);
      assert.ok(!seenIds.has(s.stageId), `Duplicate stageId ${s.stageId}`);
      seenIndices.add(s.stageIndexInLevel);
      seenIds.add(s.stageId);
    });
  });

  test('Pedagogical ordering: starts with flow velocity fundamentals and ends with final capstone', () => {
    // Stage 1 must be Flow Velocity (foundational V = Q/A)
    assert.equal(stages[0].stageId, 'L3_S6_FlowVelocity');
    assert.equal(stages[0].stageIndexInLevel, 1);

    // Stage 2 must be Diameter Performance
    assert.equal(stages[1].stageId, 'L3_S7_DiameterPerformance');

    // Stage 3 must be Hydraulic Head Loss
    assert.equal(stages[2].stageId, 'L3_S4_HydraulicHeadLoss');

    // Stage 4 must be Darcy Pressure Loss
    assert.equal(stages[3].stageId, 'L3_S8_DarcyPressureLoss');

    // Final Stage (20) must be Final Capstone
    assert.equal(stages[19].stageId, 'L3_S20_FinalCapstone');
    assert.equal(stages[19].stageIndexInLevel, 20);
  });

  test('Every stage in index.json points to an existing stage file with matching stageId and stageIndex', () => {
    for (const entry of stages) {
      const file = `data/stages/${entry.url}`;
      assert.ok(fs.existsSync(file), `Stage file ${file} does not exist`);

      const fileData = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert.equal(fileData.stageId, entry.stageId, `stageId mismatch in ${file}`);
      assert.equal(fileData.stageIndexInLevel, entry.stageIndexInLevel, `stageIndexInLevel mismatch in ${file}`);
    }
  });
});
