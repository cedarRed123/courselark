/* Google Classroom import, read-only, directly from this browser to Google with the user's own OAuth token. */
export const classroomScope = 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly';
export const classroomOrigins = ['https://classroom.googleapis.com/*'];
const api = 'https://classroom.googleapis.com/v1/';

export async function collectClassroom(token, request = fetch) {
  const get = async (path, key) => {
    const items = []; let pageToken = '', pages = 0;
    do {
      const url = new URL(path, api); url.searchParams.set('pageSize', '100'); if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await request(url.href, {headers: {Authorization: 'Bearer ' + token}});
      if (!response.ok) throw Error(`Google Classroom returned ${response.status}.`);
      const data = await response.json(); items.push(...(data[key] || [])); pageToken = data.nextPageToken || '';
    } while (pageToken && ++pages < 20);
    return items;
  };
  const origin = 'https://classroom.google.com', prefix = origin + '|user:me|', courses = [], tasks = [], warnings = [];
  for (const c of await get('courses?studentId=me&courseStates=ACTIVE', 'courses')) {
    if (!/^\d+$/.test(String(c.id))) continue;
    const courseId = prefix + 'course:' + c.id;
    courses.push({id: courseId, userId: 'me', sourceOrigin: origin, name: String(c.name || 'Class'), code: String(c.section || ''), url: /^https:\/\/classroom\.google\.com\//.test(c.alternateLink || '') ? c.alternateLink : origin, grade: null, enrollmentType: 'student', importedAt: Date.now(), source: 'classroom'});
    try {
      const work = await get(`courses/${c.id}/courseWork?courseWorkStates=PUBLISHED`, 'courseWork');
      const submissions = new Map((await get(`courses/${c.id}/courseWork/-/studentSubmissions?userId=me`, 'studentSubmissions')).map(s => [s.courseWorkId, s]));
      for (const w of work) {
        if (!/^\d+$/.test(String(w.id))) continue;
        const s = submissions.get(w.id), d = w.dueDate, t = w.dueTime || {};
        const due = d?.year ? new Date(Date.UTC(d.year, d.month - 1, d.day, t.hours ?? 23, t.minutes ?? 59)).toISOString() : null;
        const done = ['TURNED_IN', 'RETURNED'].includes(s?.state);
        tasks.push({id: prefix + 'work:' + w.id, userId: 'me', sourceOrigin: origin, title: String(w.title || 'Assignment'), courseId, due, url: /^https:\/\/classroom\.google\.com\//.test(w.alternateLink || '') ? w.alternateLink : origin, description: String(w.description || '').slice(0, 5000), points: Number(w.maxPoints) || null, score: Number.isFinite(s?.assignedGrade) ? s.assignedGrade : null, done, submitted: done, source: 'classroom'});
      }
    } catch (e) { warnings.push(`${c.name || c.id}: ${e.message}`); }
  }
  return {origin, userId: 'me', courses, tasks, warnings};
}
