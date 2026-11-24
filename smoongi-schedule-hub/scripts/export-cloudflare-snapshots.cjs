// Refresh public Sangmyung University schedule and notice snapshots.
// Runs on GitHub Actions, which can fetch upstream pages independently of Cloudflare Workers.
const fs = require('node:fs/promises');
const path = require('node:path');
const { getPolishedNotices } = require('../server/notice-polish-service');
const { getCurrentAcademicSchedules } = require('../server/schedule-current-service');

async function main() {
  const directory = path.resolve(__dirname, '../snapshots');
  await fs.mkdir(directory, { recursive: true });
  const pageSize = 50;
  const first = await getPolishedNotices({ campus: 'seoul', source: 'all', page: 1, pageSize, force: true });
  if (first.ok === false || !first.pagination?.total || !first.notices?.length) {
    throw new Error('Official notice collection returned no results; not overwriting the last verified snapshot');
  }
  const totalPages = first.pagination.totalPages || 1;
  const notices = [...first.notices];
  for (let page = 2; page <= totalPages; page++) {
    const result = await getPolishedNotices({ campus: 'seoul', source: 'all', page, pageSize });
    if (result.ok === false) throw new Error('Notice pagination failed on page '+page);
    notices.push(...(result.notices || []));
  }
  // Filtering non-department links can reduce the item count after server pagination.
  // Keep the real official records; never invent records to fill the gap.
  const seen = new Set();
  const verifiedNotices = notices.filter(item => {
    const key = [item.sourceType,item.sourceKey,item.articleNo || item.url || item.title].join(':');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (verifiedNotices.length < 5) throw new Error('Too few official notice records to publish');
  const snapshot = {
    ok: true, campus: 'seoul', fetchedAt: new Date().toISOString(), cache: 'github-snapshot',
    notices: verifiedNotices, departments: first.departments || [], categories: first.categories || [],
    sourceSummaries: first.sourceSummaries || [], warnings: first.warnings || [],
    sourceUrl: first.sourceUrl, directoryUrl: first.directoryUrl
  };
  await fs.writeFile(path.join(directory, 'notices.json'), JSON.stringify(snapshot));
  console.log('Saved notices:', verifiedNotices.length, 'departments:', snapshot.departments.length);

  for (const year of ['2025','2026','2027']) {
    const data = await getCurrentAcademicSchedules({ campus:'seoul', year, force: true });
    if (!Array.isArray(data.events) || !data.events.length) {
      console.warn('No academic events for year', year, '- keeping prior snapshot');
      continue;
    }
    if (data.cache === 'fallback' || data.cache === 'recovery') {
      console.warn('Academic schedule is fallback for',year,'- keeping prior snapshot');
      continue;
    }
    await fs.writeFile(path.join(directory, 'schedule-'+year+'.json'), JSON.stringify(data));
    console.log('Saved academic schedule', year, data.events.length);
  }
}
main().catch(err=>{console.error(err);process.exitCode=1});
