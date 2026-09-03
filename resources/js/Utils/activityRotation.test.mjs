import assert from 'node:assert/strict';
import { activityDelay, buildActivities, pickNextActivityIndex } from './activityRotation.js';

assert.deepEqual(buildActivities([], []), []);
assert.deepEqual(buildActivities([{ customer: 'Customer A' }], []), []);
assert.deepEqual(
    buildActivities([{ customer: '  Customer A  ' }], [{ name: '  Kelas Bisnis  ' }, { name: '' }]),
    [{ customer: 'Customer A', product: 'Kelas Bisnis' }],
);
assert.deepEqual(
    buildActivities([{ customer: 'Customer A' }], [{ name: 'Kelas A' }, { name: 'Kelas B' }]),
    [
        { customer: 'Customer A', product: 'Kelas A' },
        { customer: 'Customer A', product: 'Kelas B' },
    ],
);

assert.equal(pickNextActivityIndex(0, 0), -1);
assert.equal(pickNextActivityIndex(1, 0), 0);
assert.notEqual(pickNextActivityIndex(5, 2, () => 0), 2);
assert.notEqual(pickNextActivityIndex(5, 2, () => .99), 2);
assert.equal(activityDelay(() => 0), 3000);
assert.equal(activityDelay(() => 1), 5000);

console.log('activity rotation checks passed');
