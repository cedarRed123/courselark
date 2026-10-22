import test from 'node:test';
import assert from 'node:assert/strict';
import {collectClassroom} from '../src/classroom.js';

test('Classroom import pages courses, maps due dates, grades and turned-in state, and keeps links on Classroom', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push({url: new URL(url), auth: options.headers.Authorization});
    const u = new URL(url), page = u.searchParams.get('pageToken');
    const body = u.pathname === '/v1/courses' ? (page ? {courses: [{id: '2', name: 'Art'}]} : {courses: [{id: '1', name: 'Biology', section: 'P3', alternateLink: 'https://classroom.google.com/c/1'}], nextPageToken: 'p2'})
      : u.pathname === '/v1/courses/1/courseWork' ? {courseWork: [{id: '10', title: 'Cells', maxPoints: 20, dueDate: {year: 2026, month: 11, day: 3}, dueTime: {hours: 14, minutes: 30}, alternateLink: 'https://evil.example/x'}, {id: '11', title: 'Reading'}]}
      : u.pathname === '/v1/courses/1/courseWork/-/studentSubmissions' ? {studentSubmissions: [{courseWorkId: '10', state: 'RETURNED', assignedGrade: 18}]}
      : u.pathname === '/v1/courses/2/courseWork' ? null : {};
    return body === null ? {ok: false, status: 403} : {ok: true, json: async () => body};
  };
  const result = await collectClassroom('tok', request);
  assert.deepEqual(result.courses.map(c => c.name), ['Biology', 'Art']);
  const [cells, reading] = result.tasks;
  assert.equal(cells.due, '2026-11-03T14:30:00.000Z'); assert.equal(cells.score, 18); assert.equal(cells.done, true);
  assert.equal(cells.url, 'https://classroom.google.com'); assert.equal(reading.due, null); assert.equal(reading.done, false);
  assert.match(result.warnings[0], /Art: Google Classroom returned 403/);
  assert.ok(calls.every(c => c.url.origin === 'https://classroom.googleapis.com' && c.auth === 'Bearer tok'));
});
