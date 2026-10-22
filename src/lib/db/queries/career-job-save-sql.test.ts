import test from 'node:test';
import assert from 'node:assert/strict';
import type { CareerJobInput } from '@/lib/career-types';
import { careerJobSaveValues, createCareerJobSql, updateCareerJobSql } from './career-job-save-sql';

const draft: CareerJobInput = {
  slug: 'digital-marketing-executive',
  title: 'Digital Marketing Executive',
  department: 'Marketing',
  openings: 1,
  experienceMinYears: 1,
  experienceMaxYears: 3,
  employmentType: 'FULL_TIME',
  location: null,
  workArrangement: null,
  salaryRange: null,
  deadline: null,
  summary: '',
  description: '',
  responsibilities: [],
  qualifications: [],
  status: 'DRAFT',
};

test('new vacancy SQL keeps optional fields typed and status consistently varchar(16)', () => {
  const values = careerJobSaveValues(draft);

  assert.equal(values.length, 16);
  assert.deepEqual(values.slice(7, 11), [null, null, null, null]);
  assert.deepEqual(values.slice(13, 15), [[], []]);
  assert.equal(values[15], 'DRAFT');
  assert.match(createCareerJobSql, /\$11::date/);
  assert.match(createCareerJobSql, /\$14::text\[\],\s*\$15::text\[\]/);
  assert.match(createCareerJobSql, /\$16::varchar\(16\),\s*CASE WHEN \$16::varchar\(16\) = 'PUBLISHED'/);
  assert.deepEqual([...values, 'admin-id'].slice(-2), ['DRAFT', 'admin-id']);
});

test('updating an existing vacancy uses the same typed values and uuid row/admin IDs', () => {
  const values = careerJobSaveValues({
    ...draft,
    location: 'Bengaluru',
    deadline: '2026-12-31',
    responsibilities: ['Plan campaigns'],
    qualifications: ['Marketing experience'],
    status: 'PUBLISHED',
  });

  assert.equal(values.length, 16);
  assert.equal(values[7], 'Bengaluru');
  assert.equal(values[10], '2026-12-31');
  assert.deepEqual(values[13], ['Plan campaigns']);
  assert.deepEqual(values[14], ['Marketing experience']);
  assert.equal(values[15], 'PUBLISHED');
  assert.equal((updateCareerJobSql.match(/\$16::varchar\(16\)/g) ?? []).length, 3);
  assert.match(updateCareerJobSql, /\$17::uuid/);
  assert.match(updateCareerJobSql, /WHERE "id"=\$18::uuid/);
  assert.deepEqual([...values, 'admin-id', 'job-id'].slice(-3), ['PUBLISHED', 'admin-id', 'job-id']);
});
