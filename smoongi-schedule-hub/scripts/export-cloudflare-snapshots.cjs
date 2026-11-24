// Refresh public Sangmyung University schedule and notice snapshots.
// Runs on GitHub Actions, which can fetch upstream pages independently of Cloudflare Workers.
const fs = require('node:fs/promises');
const path = require('node:path');
const { getPolishedNotices } = require('../server/notice-polish-service');

const calendarBase = 'https://www.smu.ac.kr/kor/life/academicCalendar_imsi.do';
function htmlText(s) {
  return String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&(?:amp;)+/gi,'&').replace(/&nbsp;|&#160;/gi,' ').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
}
function officialUrl(s) {
  try {
    const u=new URL(String(s).replace(/&(?:amp;)+/gi,'&'));
    if(u.protocol!=='https:'||!u.hostname.endsWith('.smu.ac.kr'))return null;
    return u.toString();
  } catch {return null}
}
function calendarRows(html,url) {
  const result=[];
  for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=Array.from(row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi),m=>htmlText(m[1]));
    if(cells.length!==4||!/^20\d{2}$/.test(cells[0])||!/^20\d{2}-\d{2}-\d{2}$/.test(cells[2])||!/^20\d{2}-\d{2}-\d{2}$/.test(cells[3])||!cells[1]||cells[3]<cells[2])continue;
    const [year,title,date,endDate]=cells;
    result.push({id:'smu-'+date+'-'+title,title,date,endDate,importance:/시험|고사|수강|성적|평가|등록|휴학|복학|장학|신청|졸업/.test(title)?'critical':'normal',note:'상명대학교 공식 학사일정 게시판',url,year});
  }
  return result;
}
async function collectCalendar() {
  const all=new Map(),seenPages=new Set();
  // The board lists the newest dates first. Use the verified pagination parameters.
  const pageSize=50;
  for(let offset=0;offset<1500;offset+=pageSize){
    const u=new URL(calendarBase);
    u.searchParams.set('mode','list');u.searchParams.set('article.offset',String(offset));u.searchParams.set('articleLimit',String(pageSize));
    const r=await fetch(u,{headers:{Accept:'text/html','Accept-Language':'ko-KR,ko;q=0.9','User-Agent':'SmoongiScheduleHub/1.0 (+https://www.smu.ac.kr/)'},signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw Error('Calendar HTTP '+r.status+' offset '+offset);
    const html=await r.text();
    const rows=calendarRows(html,u.toString());
    if(!rows.length){if(offset===0)throw Error('Calendar table has no parsable rows: '+html.length+' bytes');break;}
    const fingerprint=JSON.stringify(rows.map(e=>[e.date,e.title]));
    if(seenPages.has(fingerprint))throw Error('Calendar pagination repeated a page');
    seenPages.add(fingerprint);
    console.log('Calendar offset',offset,'rows',rows.length,'first',rows[0].date,'last',rows.at(-1).date);
    for(const e of rows)all.set([e.date,e.endDate,e.title].join('|'),e);
    if(rows.some(e=>e.year<'2025'))break;
    // Some board implementations clamp the requested page size.
    if(rows.length<pageSize&&rows.length>=10)offset-=pageSize-rows.length;
    else if(rows.length<10)break;
    await new Promise(r=>setTimeout(r,250));
  }
  return [...all.values()];
}


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
  const verifiedNotices = notices.map(item=>({...item,url:officialUrl(item.url)})).filter(item => {
    if (!item.url) return false;
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

  try {
    const all = await collectCalendar();
    for (const year of ['2025','2026','2027']) {
      const events=all.filter(e=>e.year===year).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'ko')).map(({year,...e})=>e);
      if(!events.length){console.warn('No official calendar records for',year);continue;}
      if(year==='2026'&&events.length<30)throw Error('Incomplete 2026 calendar: '+events.length);
      const data={ok:true,campus:'seoul',year,source:'상명대학교 공식 학사일정 게시판',fetchedAt:new Date().toISOString(),cache:'github-snapshot',events,warnings:[]};
      await fs.writeFile(path.join(directory,'schedule-'+year+'.json'),JSON.stringify(data));
      console.log('Saved official academic schedule',year,events.length,events[0].date,events.at(-1).date);
    }
  } catch(error) {
    console.error('Official calendar collection failed:',error.message);
    // Do not discard a successful notice update or overwrite valid prior calendars.
  }
}
main().catch(err=>{console.error(err);process.exitCode=1});
