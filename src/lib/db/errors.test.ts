import assert from 'node:assert/strict';
import test from 'node:test';
import { getCareerJobSaveErrorContext } from './errors';

test('PostgreSQL diagnostics include safe save failure fields without query or row data', () => {
  const context = getCareerJobSaveErrorContext(Object.assign(new Error('column "updatedByAdminId" does not exist'), {
    code: '42703',
    position: '118',
    table: 'CareerJob',
    column: 'updatedByAdminId',
    constraint: 'CareerJob_updatedByAdminId_fkey',
    detail: 'sensitive row details',
    query: 'INSERT with bound user data',
  }));

  assert.deepEqual(context, {
    errorName: 'Error',
    databaseCode: '42703',
    databaseTable: 'CareerJob',
    databaseColumn: 'updatedByAdminId',
    databaseConstraint: 'CareerJob_updatedByAdminId_fkey',
    databaseMessage: 'column "updatedByAdminId" does not exist',
    databasePosition: '118',
  });
  assert.equal('detail' in context, false);
  assert.equal('query' in context, false);
});

test('PostgreSQL diagnostic messages are bounded and non-PostgreSQL errors stay minimal', () => {
  const longMessage = 'x'.repeat(700);
  assert.equal(getCareerJobSaveErrorContext(Object.assign(new Error(longMessage), { code: 'XX000' })).databaseMessage.length, 500);
  assert.deepEqual(getCareerJobSaveErrorContext(new Error('unexpected')), { errorName: 'Error' });
});
