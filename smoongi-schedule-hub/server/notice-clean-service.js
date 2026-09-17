const { getNotices } = require("./notice-service");

const HIDDEN_SOURCE_KEYS = new Set(["lifelog", "hss"]);

async function getCleanNotices(options = {}) {
  const payload = await getNotices(options);

  const departments = (payload.departments || [])
    .map((department) => ({
      ...department,
      name: cleanDepartmentName(department.name, department.key),
    }))
    .filter((department) => isUsableDepartment(department));

  const allowedKeys = new Set(departments.map((department) => department.key));
  const notices = (payload.notices || [])
    .filter((notice) => notice.sourceType !== "department" || allowedKeys.has(notice.sourceKey))
    .map((notice) => ({
      ...notice,
      sourceTitle: notice.sourceType === "department" ? cleanDepartmentName(notice.sourceTitle, notice.sourceKey) : notice.sourceTitle,
    }));

  return {
    ...payload,
    departments,
    notices,
  };
}

function cleanDepartmentName(value, fallbackKey = "") {
  const cleaned = String(value || "")
    .replace(/새창\s*열림/gi, "")
    .replace(/새창열림/gi, "")
    .replace(/바로가기/gi, "")
    .replace(/홈페이지/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || String(fallbackKey || "").trim();
}

function isUsableDepartment(department) {
  const key = String(department.key || "").trim().toLowerCase();
  const name = String(department.name || "").trim();
  if (!key || HIDDEN_SOURCE_KEYS.has(key)) return false;
  if (!name || name.toLowerCase() === key) return false;
  if (!/[가-힣]/.test(name)) return false;
  return true;
}

module.exports = { getCleanNotices, cleanDepartmentName };
