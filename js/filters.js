// ===== Фильтры =====
const Filters = {
  init() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.style.cursor = 'pointer';
      chip.style.userSelect = 'none';
      chip.addEventListener('click', () => {
        const type = chip.dataset.type;
        this.setFilter(type);
      });
    });

    const userFilterContainer = document.getElementById('userFilterContainer');
    if (userFilterContainer) {
      if (Auth.isAdmin()) {
        userFilterContainer.style.display = 'block';
        this.loadUsers();
      } else {
        userFilterContainer.style.display = 'none';
      }
    }

    this.updateUI();
  },

  setFilter(type, user = null) {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      if (chip.dataset.type === type) {
        chip.style.background = '#008080';
        chip.style.color = '#FFF';
        chip.style.borderColor = '#008080';
        chip.style.boxShadow = '0 4px 12px rgba(0,128,128,0.3)';
      } else {
        chip.style.background = '#FFF';
        chip.style.color = '#37474F';
        chip.style.borderColor = '#E0F2F1';
        chip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      }
    });

    if (typeof Calendar !== 'undefined') {
      Calendar.setFilter(type, user || null);
    }
  },

  async loadUsers() {
    try {
      const users = await API.getUsers();
      const select = document.getElementById('userFilterSelect');
      if (!select) return;
      select.innerHTML = '<option value="all">Все пользователи</option>';
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        select.appendChild(option);
      });
      select.style.cursor = 'pointer';
      select.addEventListener('change', () => {
        const user = select.value === 'all' ? null : select.value;
        this.setFilter('all', user);
      });
    } catch (err) {
      console.warn('Ошибка загрузки пользователей:', err);
    }
  },

  updateUI() {
    const container = document.getElementById('filtersContainer');
    if (container) container.style.display = 'block';
    const bottomPanel = document.getElementById('bottomPanel');
    if (bottomPanel) bottomPanel.style.display = 'flex';
  }
};