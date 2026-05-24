import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextCharge, summarize } from './dist/model.mjs';

test('clamps monthly billing to February and restores the original day in March', () => {
  assert.equal(nextCharge('2026-01-31', 'month', '2026-02-01'), '2026-02-28');
  assert.equal(nextCharge('2026-01-31', 'month', '2026-03-01'), '2026-03-31');
  assert.equal(nextCharge('2026-01-31', 'month', '2026-03-31'), '2026-03-31');
});

test('handles leap-day annual billing and keeps a future first charge', () => {
  assert.equal(nextCharge('2024-02-29', 'year', '2026-01-01'), '2026-02-28');
  assert.equal(nextCharge('2024-02-29', 'year', '2028-02-28'), '2028-02-29');
  assert.equal(nextCharge('2026-09-12', 'year', '2026-08-31'), '2026-09-12');
});

test('sorts by next billing date and includes today through the sixth following day', () => {
  const entries = [
    { name: 'Год', date: '2026-05-17', cycle: 'year', cents: 12000 },
    { name: 'Позже', date: '2026-05-18', cycle: 'month', cents: 400 },
    { name: 'Месяц', date: '2026-05-11', cycle: 'month', cents: 200 },
  ];
  const result = summarize(entries, '2026-05-11');
  assert.deepEqual(result.rows.map(row => row.name), ['Месяц', 'Год', 'Позже']);
  assert.equal(result.monthly, 1600);
  assert.equal(result.yearly, 19200);
  assert.equal(result.upcoming, 12200);
});
