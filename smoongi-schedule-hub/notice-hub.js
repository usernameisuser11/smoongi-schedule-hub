(() => {
  const state = {
    source: 'all',
    department: '',
    query: '',
    page: 1,
    pageSize: 15,
    loading: false,
  };

  const elements = {};

  document.addEventListener('DOMContentLoaded', () => {
    elements.sourceTabs = document.querySelector('#noticeSourceTabs');
    elements.departmentSelect = document.querySelector('#noticeDepartmentSelect');
    elements.searchForm = document.querySelector('#noticeSearchForm');
    elements.searchInput = document.querySelector('#noticeSearchInput');
    elements.refresh = document.querySelector('#noticeRefresh');
    elements.status = document.querySelector('#noticeStatus');
    elements.count = document.querySelector('#noticeCount');
    elements.list = document.querySelector('#noticeList');
    elements.pagination = document.querySelector('#noticePagination');
    elements.warnings = document.querySelector('#noticeWarnings');

    if (!elements.list) return;
    injectPolishStyles();
    bindEvents();
    loadNotices();
  });

  function bindEvents() {
    elements.sourceTabs?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-notice-source]');
      if (!button) return;
      state.source = button.dataset.noticeSource || 'all';
      if (state.source === 'integrated') state.department = '';
      state.page = 1;
      updateActiveSourceTab();
      syncDepartmentSelect();
      loadNotices();
    });

    elements.departmentSelect?.addEventListener('change', () => {
      state.department = elements.departmentSelect.value;
      if (state.department) state.source = 'department';
      else if (state.source === 'department') state.source = 'all';
      state.page = 1;
      updateActiveSourceTab();
      loadNotices();
    });

    elements.searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      state.query = elements.searchInput.value.trim();
      state.page = 1;
      loadNotices();
    });

    elements.refresh?.addEventListener('click', () => {
      state.page = 1;
      loadNotices(true);
    });

    elements.list?.addEventListener('click', (event) => {
      const department = event.target.closest('[data-notice-department]');
      if (!department) return;
      event.preventDefault();
      state.source = 'department';
      state.department = department.dataset.noticeDepartment || '';
      state.query = '';
      state.page = 1;
      if (elements.searchInput) elements.searchInput.value = '';
      updateActiveSourceTab();
      syncDepartmentSelect();
      loadNotices().then(() => {
        document.querySelector('#notice-hub')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    elements.pagination?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-notice-page]');
      if (!button || button.disabled) return;
      const nextPage = Number(button.dataset.noticePage);
      if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage === state.page) return;
      state.page = nextPage;
      loadNotices().then(() => {
        document.querySelector('#notice-hub')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  async function loadNotices(force = false) {
    if (state.loading) return;
    state.loading = true;
    setLoading(true, force ? '상명대 공식 공지를 새로 수집하고 있어요.' : '상명대 공식 공지를 불러오는 중이에요.');

    const params = new URLSearchParams({
      campus: 'seoul',
      source: state.source,
      page: String(state.page),
      pageSize: String(state.pageSize),
      sort: 'latest',
    });
    if (state.department) params.set('department', state.department);
    if (state.query) params.set('query', state.query);
    if (force) params.set('refresh', 'true');

    try {
      const response = await fetch(`/api/notices?${params.toString()}`, { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      renderPayload(payload);
    } catch (error) {
      renderFailure(error);
    } finally {
      state.loading = false;
      setLoading(false);
    }
  }

  function renderPayload(payload) {
    renderDepartments(payload.departments || []);
    renderWarnings(payload.warnings || []);

    const pagination = payload.pagination || { page: 1, total: 0, totalPages: 0, pageSize: state.pageSize };
    state.page = pagination.page || 1;

    if (!payload.ok && !(payload.notices || []).length) {
      elements.status.textContent = payload.error || '공지를 불러오지 못했어요.';
      elements.count.textContent = '';
      renderEmpty(payload.sourceUrl, true);
      renderPagination(pagination);
      return;
    }

    const cacheLabel = payload.cache === 'hit' ? '캐시' : payload.cache === 'stale' ? '마지막 저장본' : '공식 사이트';
    const fetched = payload.fetchedAt ? formatDateTime(payload.fetchedAt) : '방금';
    elements.status.textContent = `${cacheLabel} 기준 · ${fetched}`;
    elements.count.textContent = `총 ${Number(pagination.total || 0).toLocaleString('ko-KR')}건 · ${pagination.page || 1}/${pagination.totalPages || 1} 페이지`;

    const notices = payload.notices || [];
    if (!notices.length) renderEmpty(payload.sourceUrl, false);
    else renderNotices(notices);
    renderPagination(pagination);
  }

  function renderNotices(notices) {
    elements.list.innerHTML = notices
      .map((notice) => {
        const badges = [
          notice.pinned ? '<span class="notice-badge important">중요</span>' : '',
          notice.sourceType === 'integrated'
            ? '<span class="notice-badge campus">통합공지</span>'
            : '<span class="notice-badge department">학과공지</span>',
          notice.category ? `<span class="notice-badge category">${escapeHtml(notice.category)}</span>` : '',
          notice.noticeCampus && notice.sourceType === 'integrated'
            ? `<span class="notice-badge subtle">${escapeHtml(notice.noticeCampus)}</span>`
            : '',
          notice.isNew ? '<span class="notice-badge new">NEW</span>' : '',
        ]
          .filter(Boolean)
          .join('');

        const source = notice.sourceType === 'department'
          ? `<a href="#notice-hub" class="notice-department-link" data-notice-department="${escapeAttribute(notice.sourceKey)}" title="${escapeAttribute(notice.sourceTitle)} 공지만 보기">${escapeHtml(notice.sourceTitle)}</a>`
          : `<span>${escapeHtml(notice.sourceTitle || '상명대학교 통합공지')}</span>`;
        const author = notice.author ? `<span> · ${escapeHtml(notice.author)}</span>` : '';
        const date = notice.date ? `<span> · ${escapeHtml(formatDate(notice.date))}</span>` : '';

        return `
          <article class="notice-item">
            <div class="notice-item-badges">${badges}</div>
            <a class="notice-item-title" href="${escapeAttribute(notice.url)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(notice.title)} <span aria-hidden="true">↗</span>
            </a>
            <div class="notice-item-meta">${source}${author}${date}</div>
          </article>
        `;
      })
      .join('');
  }

  function renderEmpty(sourceUrl, failed) {
    const href = sourceUrl || 'https://www.smu.ac.kr/kor/life/notice.do';
    elements.list.innerHTML = `
      <div class="notice-empty">
        <img src="./assets/smoongi/autumn_reading.png" alt="책을 읽는 수뭉이" />
        <strong>${failed ? '공식 공지를 가져오지 못했어요.' : '조건에 맞는 공지가 아직 없어요.'}</strong>
        <span>${failed ? '샘플 공지로 대신하지 않고 공식 페이지를 바로 확인할 수 있게 했어요.' : '검색어나 학과 선택을 바꿔보세요.'}</span>
        <a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">상명대 공식 통합공지 열기</a>
      </div>
    `;
  }

  function renderDepartments(departments) {
    if (!elements.departmentSelect) return;
    const previous = state.department;
    elements.departmentSelect.innerHTML = ['<option value="">전체 학과</option>']
      .concat(departments.map((department) => `<option value="${escapeAttribute(department.key)}">${escapeHtml(department.name)}</option>`))
      .join('');
    if (departments.some((department) => department.key === previous)) elements.departmentSelect.value = previous;
    else if (previous) state.department = '';
    syncDepartmentSelect();
  }

  function renderWarnings(warnings) {
    if (!elements.warnings) return;
    if (!warnings.length) {
      elements.warnings.hidden = true;
      elements.warnings.innerHTML = '';
      return;
    }
    elements.warnings.hidden = false;
    const visible = warnings.slice(0, 3);
    const extra = warnings.length - visible.length;
    elements.warnings.innerHTML = `
      <details>
        <summary>일부 공지 소스 상태 확인${extra > 0 ? ` · ${warnings.length}건` : ''}</summary>
        <ul>${visible.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}${extra > 0 ? `<li>외 ${extra}건</li>` : ''}</ul>
      </details>
    `;
  }

  function renderPagination(pagination) {
    if (!elements.pagination) return;
    const totalPages = Number(pagination.totalPages || 0);
    const current = Number(pagination.page || 1);
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }

    const pages = paginationWindow(current, totalPages, 7);
    elements.pagination.innerHTML = [
      `<button type="button" class="notice-page-button" data-notice-page="${Math.max(1, current - 1)}" ${current <= 1 ? 'disabled' : ''}>이전</button>`,
      ...pages.map((page) => page === '…'
        ? '<span class="notice-page-ellipsis">…</span>'
        : `<button type="button" class="notice-page-button ${page === current ? 'active' : ''}" data-notice-page="${page}" ${page === current ? 'aria-current="page"' : ''}>${page}</button>`),
      `<button type="button" class="notice-page-button" data-notice-page="${Math.min(totalPages, current + 1)}" ${current >= totalPages ? 'disabled' : ''}>다음</button>`,
    ].join('');
  }

  function paginationWindow(current, total, maxButtons) {
    if (total <= maxButtons) return Array.from({ length: total }, (_, index) => index + 1);
    const pages = new Set([1, total, current, current - 1, current + 1]);
    if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
    if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));
    const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
    const result = [];
    sorted.forEach((page, index) => {
      if (index && page - sorted[index - 1] > 1) result.push('…');
      result.push(page);
    });
    return result;
  }

  function updateActiveSourceTab() {
    elements.sourceTabs?.querySelectorAll('[data-notice-source]').forEach((button) => {
      button.classList.toggle('active', button.dataset.noticeSource === state.source);
    });
  }

  function syncDepartmentSelect() {
    if (!elements.departmentSelect) return;
    elements.departmentSelect.disabled = state.source === 'integrated';
    elements.departmentSelect.value = state.department || '';
  }

  function setLoading(active, message = '') {
    elements.refresh?.toggleAttribute('disabled', active);
    elements.searchForm?.querySelector('button')?.toggleAttribute('disabled', active);
    elements.list?.classList.toggle('loading', active);
    if (active && elements.status) elements.status.textContent = message;
  }

  function renderFailure(error) {
    elements.status.textContent = '공지 API 연결에 실패했어요.';
    elements.count.textContent = '';
    elements.warnings.hidden = true;
    renderEmpty('https://www.smu.ac.kr/kor/life/notice.do', true);
    elements.pagination.innerHTML = '';
    console.error('notice hub error', error);
  }

  function injectPolishStyles() {
    if (document.querySelector('#noticePolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'noticePolishStyles';
    style.textContent = `
      .notice-controls { grid-template-columns: minmax(180px,.75fr) minmax(360px,1.8fr) auto; }
      .notice-department-link { color: var(--blue); font-weight: 900; text-decoration: underline; text-underline-offset: 3px; }
      .notice-department-link:hover { color: var(--blue-2); }
      @media (max-width: 980px) { .notice-controls { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function formatDate(value) {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${year}.${month}.${day}`;
  }

  function formatDateTime(value) {
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
      }).format(new Date(value));
    } catch {
      return '최근';
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#96;');
  }
})();
