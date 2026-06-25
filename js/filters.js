// ===== Фильтры =====
const Filters = {
    init() {
        const chips = document.querySelectorAll('.filter-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.dataset.type;
                this.setFilter(type);
            });
        });

        // Показываем фильтр пользователя только для админа
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
        // Обновляем активный чип
        document.querySelectorAll('.filter-chip').forEach(chip => {
            if (chip.dataset.type === type) {
                chip.style.background = '#008080';
                chip.style.color = '#FFF';
                chip.style.borderColor = '#008080';
            } else {
                chip.style.background = '#FFF';
                chip.style.color = '#37474F';
                chip.style.borderColor = '#E0F2F1';
            }
        });

        // Применяем фильтр к календарю
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
            select.addEventListener('change', () => {
                const user = select.value === 'all' ? null : select.value;
                this.setFilter('all', user);
            });
        } catch (err) {
            console.warn('Ошибка загрузки пользователей:', err);
        }
    },

    updateUI() {
        // Показываем/скрываем фильтры в зависимости от роли
        const container = document.getElementById('filtersContainer');
        if (container) container.style.display = 'block';
        const windowsBtn = document.getElementById('windowsBtn');
        if (windowsBtn) windowsBtn.style.display = 'block';
    }
};