// ===== Точка входа =====
(function() {
    'use strict';

    const elements = {
        authBlock: document.getElementById('authBlock'),
        calendarContainer: document.getElementById('calendarContainer'),
        detailContainer: document.getElementById('detailContainer'),
        appHeader: document.getElementById('appHeader'),
        loginForm: document.getElementById('loginForm'),
        usernameInput: document.getElementById('username'),
        passwordInput: document.getElementById('password'),
        loginBtn: document.getElementById('loginBtn'),
        messageEl: document.getElementById('message'),
        loaderEl: document.getElementById('loader')
    };

    let isProcessing = false;
    let isInitialized = false;

    function showMessage(text, type = 'error') {
        elements.messageEl.className = `message ${type}`;
        elements.messageEl.textContent = text;
        elements.messageEl.style.display = 'block';
    }

    function hideMessage() {
        elements.messageEl.style.display = 'none';
        elements.messageEl.className = 'message';
    }

    function setLoading(loading) {
        isProcessing = loading;
        elements.loginBtn.disabled = loading;
        elements.loginBtn.textContent = loading ? 'Вход...' : 'Войти';
    }

    function showLoader() {
        elements.authBlock.style.display = 'none';
        elements.calendarContainer.style.display = 'none';
        if (elements.detailContainer) elements.detailContainer.style.display = 'none';
        elements.appHeader.style.display = 'none';
        elements.loaderEl.style.display = 'flex';
    }

    function showAuth() {
        elements.authBlock.style.display = 'block';
        elements.calendarContainer.style.display = 'none';
        if (elements.detailContainer) elements.detailContainer.style.display = 'none';
        elements.appHeader.style.display = 'none';
        elements.loaderEl.style.display = 'none';
    }

    function showCalendar() {
        elements.authBlock.style.display = 'none';
        elements.calendarContainer.style.display = 'block';
        if (elements.detailContainer) elements.detailContainer.style.display = 'none';
        elements.appHeader.style.display = 'flex';
        elements.loaderEl.style.display = 'none';
        // Инициализируем фильтры после рендеринга
        if (typeof Filters !== 'undefined') Filters.init();
        if (typeof Windows !== 'undefined') Windows.init();
    }

    async function loadAndRender(forceRefresh = false) {
        const { year, month } = Calendar.getCurrentMonth();

        const cached = Cache.get(year, month);
        if (!cached && !forceRefresh) showLoader();

        try {
            const data = await API.getRecords(year, month, forceRefresh);
            Calendar.updateData(data);
            showCalendar();
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            showMessage('Не удалось загрузить записи: ' + err.message, 'error');
            showCalendar();
        }
    }

    function onMonthChange(delta) {
        Calendar.changeMonth(delta);
        loadAndRender(false);
    }

    function initCalendar() {
        if (isInitialized) return;

        if (typeof Detail !== 'undefined' && Detail.init) {
            Detail.init(elements.detailContainer);
        }

        Calendar.init(elements.calendarContainer, (day) => {
            const { year, month } = Calendar.getCurrentMonth();
            if (typeof Detail !== 'undefined' && Detail.show) {
                Detail.show(year, month, day, Calendar.recordsData);
            } else {
                alert(`Вы выбрали ${day}.${month}.${year}`);
            }
        });
        Calendar.onMonthChange = onMonthChange;
        isInitialized = true;
    }

    async function autoLogin() {
        showLoader();

        if (!Auth.hasToken()) {
            showAuth();
            return;
        }

        try {
            const user = await Auth.validate();
            if (user) {
                initCalendar();
                await loadAndRender(false);
            } else {
                Auth.clearToken();
                showAuth();
            }
        } catch (err) {
            console.error('Ошибка валидации:', err);
            Auth.clearToken();
            showAuth();
        }
    }

    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        if (isProcessing) return;

        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value.trim();

        if (!username || !password) {
            showMessage('Пожалуйста, заполните все поля.', 'error');
            return;
        }

        setLoading(true);
        showLoader();

        try {
            const user = await Auth.login(username, password);
            initCalendar();
            await loadAndRender(false);
        } catch (err) {
            showAuth();
            showMessage(err.message || 'Ошибка входа', 'error');
        } finally {
            setLoading(false);
        }
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите выйти?')) Auth.logout();
        });
    }

    function checkModules() {
        const modules = [
            { name: 'CONFIG', obj: typeof CONFIG !== 'undefined' },
            { name: 'Cache', obj: typeof Cache !== 'undefined' },
            { name: 'API', obj: typeof API !== 'undefined' },
            { name: 'CanvasRenderer', obj: typeof CanvasRenderer !== 'undefined' },
            { name: 'Calendar', obj: typeof Calendar !== 'undefined' },
            { name: 'Auth', obj: typeof Auth !== 'undefined' },
            { name: 'Modal', obj: typeof Modal !== 'undefined' },
            { name: 'Detail', obj: typeof Detail !== 'undefined' },
            { name: 'Notifications', obj: typeof Notifications !== 'undefined' },
            { name: 'Filters', obj: typeof Filters !== 'undefined' },
            { name: 'Windows', obj: typeof Windows !== 'undefined' }
        ];

        let allLoaded = true;
        for (const mod of modules) {
            if (!mod.obj) {
                console.error(`❌ Модуль ${mod.name} не загружен`);
                allLoaded = false;
            }
        }

        if (!allLoaded) {
            showMessage('Ошибка загрузки приложения. Проверьте консоль.', 'error');
            return false;
        }

        console.log('✅ Все модули загружены');
        return true;
    }

    if (checkModules()) {
        if (typeof Detail !== 'undefined' && Detail.init && elements.detailContainer) {
            Detail.init(elements.detailContainer);
        }
        if (typeof Notifications !== 'undefined') Notifications.init();
        autoLogin();
    }

    window.loadAndRender = loadAndRender;

})();