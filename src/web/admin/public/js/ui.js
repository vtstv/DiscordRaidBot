// UI module
function updatePagination(type, total) {
  let currentPage, setPage, paginationId, perPage;

  if (type === 'events') {
    currentPage = currentEventsPage;
    setPage = (p) => { currentEventsPage = p; searchEvents(); };
    paginationId = 'eventsPagination';
    perPage = EVENTS_PER_PAGE;
  } else {
    currentPage = currentTemplatesPage;
    setPage = (p) => { currentTemplatesPage = p; searchTemplates(); };
    paginationId = 'templatesPagination';
    perPage = TEMPLATES_PER_PAGE;
  }

  const totalPages = Math.ceil(total / perPage);
  const container = document.getElementById(paginationId);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button ${currentPage === 0 ? 'disabled' : ''} onclick="changePage('${type}', 0)">First</button>
    <button ${currentPage === 0 ? 'disabled' : ''} onclick="changePage('${type}', ${currentPage - 1})">Previous</button>
    <span>Page ${currentPage + 1} of ${totalPages}</span>
    <button ${currentPage >= totalPages - 1 ? 'disabled' : ''} onclick="changePage('${type}', ${currentPage + 1})">Next</button>
    <button ${currentPage >= totalPages - 1 ? 'disabled' : ''} onclick="changePage('${type}', ${totalPages - 1})">Last</button>
  `;
}

function changePage(type, page) {
  if (type === 'events') {
    currentEventsPage = page;
    searchEvents();
  } else {
    currentTemplatesPage = page;
    searchTemplates();
  }
}

function toggleSelectAll(type) {
  const checkboxes = document.querySelectorAll(`.${type}-checkbox`);
  const selectAll = document.getElementById(`selectAll${type.charAt(0).toUpperCase() + type.slice(1)}`);
  
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
  updateSelectedCount(type);
}

function updateSelectedCount(type) {
  const checkboxes = document.querySelectorAll(`.${type}-checkbox:checked`);
  const countId = type === 'events' ? 'selectedEventsCount' : 'selectedTemplatesCount';
  document.getElementById(countId).textContent = `${checkboxes.length} selected`;
}

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update tabs
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });

  // Event listeners for checkboxes
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('event-checkbox')) {
      updateSelectedCount('events');
    } else if (e.target.classList.contains('template-checkbox')) {
      updateSelectedCount('templates');
    }
  });
});
