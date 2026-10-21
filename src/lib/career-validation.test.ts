import test from 'node:test';
import assert from 'node:assert/strict';
import { careerJobInputSchema } from './career-validation';

const draft = {
  slug: '', title: 'Telecaller', department: 'Customer Engagement', openings: 1,
  experienceMinYears: 1, experienceMaxYears: 3, employmentType: 'FULL_TIME',
  location: null, workArrangement: null, salaryRange: null, deadline: null,
  summary: '', description: '', responsibilities: [], qualifications: [], status: 'DRAFT',
};

test('a vacancy draft keeps unconfirmed employment details empty', () => {
  const parsed = careerJobInputSchema.parse(draft);
  assert.equal(parsed.status, 'DRAFT');
  assert.equal(parsed.location, null);
  assert.equal(parsed.workArrangement, null);
  assert.equal(parsed.salaryRange, null);
  assert.equal(parsed.deadline, null);
});

test('a vacancy cannot publish before it has complete candidate-facing details', () => {
  const result = careerJobInputSchema.safeParse({ ...draft, status: 'PUBLISHED' });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(result.error.issues.map((issue) => issue.path.join('.')).sort(), [
      'description', 'qualifications', 'responsibilities', 'summary',
    ]);
  }
});

test('a vacancy rejects inconsistent experience ranges and non-ISO dates', () => {
  assert.equal(careerJobInputSchema.safeParse({ ...draft, experienceMinYears: 4, experienceMaxYears: 3 }).success, false);
  assert.equal(careerJobInputSchema.safeParse({ ...draft, deadline: '21-10-2026' }).success, false);
});
