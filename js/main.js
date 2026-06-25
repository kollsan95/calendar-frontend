// ===== Точка входа =====

(function() {
  'use strict';

  // === Элементы DOM ===
  const elements = {
    authBlock: document.getElementById('authBlock'),
    calendarContainer: document.getElementById('calendarContainer'),
    detailContainer: document.getElementById('detailContainer'),
    appHeader: document.getElementById('appHeader'),
    bottomPanel: document.getElementById('bottomPanel'),
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('loginBtn'),
    messageEl: document.getElementById('message'),
    loaderEl: document.getElementById('loader')
  };

  // === Состояние ===
  let isProcessing = false;
  let isInitialized = false;

  // === Вспомогательные функции ===
  function showMessage(text, type = 'error') {
    if (!elements.messageEl) return;
    elements.messageEl.className = `message ${type}`;
    elements.messageEl.textContent = text;
    elements.messageEl.style.display = 'block';
  }

  function hideMessage() {
    if (!elements.messageEl) return;
    elements.messageEl.style.display = 'none';
    elements.messageEl.className = 'message';
  }

  function setLoading(loading) {
    isProcessing = loading;
    if (!elements.loginBtn) return;
    elements.loginBtn.disabled = loading;
    elements.loginBtn.textContent = loading ? 'Вход...' : 'Войти';
  }

  function showLoader() {
    if (elements.authBlock) elements.authBlock.style.display = 'none';
    if (elements.calendarContainer) {
      elements.calendarContainer.style.display = 'block';
      elements.calendarContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
          <div class="spinner"></div>
          <p style="margin-top:12px;color:#008080;font-size:14px;font-weight:500;">Загрузка...</p>
        </div>
      `;
    }
    if (elements.detailContainer) elements.detailContainer.style.display = 'none';
    if (elements.appHeader) elements.appHeader.style.display = 'none';
    if (elements.bottomPanel) elements.bottomPanel.style.display = 'none';
    if (elements.loaderEl) elements.loaderEl.style.display = 'none';
  }

  function showAuth() {
    if (elements.authBlock) elements.authBlock.style.display = 'block';
    if (elements.calendarContainer) elements.calendarContainer.style.display = 'none';
    if (elements.detailContainer) elements.detailContainer.style.display = 'none';
    if (elements.appHeader) elements.appHeader.style.display = 'none';
    if (elements.bottomPanel) elements.bottomPanel.style.display = 'none';
    if (elements.loaderEl) elements.loaderEl.style.display = 'none';
  }

  function showCalendar() {
    if (elements.authBlock) elements.authBlock.style.display = 'none';
    if (elements.calendarContainer) elements.calendarContainer.style.display = 'block';
    if (elements.detailContainer) elements.detailContainer.style.display = 'none';
    if (elements.appHeader) elements.appHeader.style.display = 'flex';
    if (elements.bottomPanel) elements.bottomPanel.style.display = 'flex';
    if (elements.loaderEl) elements.loaderEl.style.display = 'none';
  }

  // === Загрузка данных и рендеринг ===
  async function loadAndRender(forceRefresh = false) {
    try {
      // Проверяем, что Calendar доступен
      if (typeof Calendar === 'undefined') {
        console.warn('⚠️ Calendar не загружен, повторная попытка через 500ms');
        setTimeout(() => loadAndRender(forceRefresh), 500);
        return;
      }

      const { year, month } = Calendar.getCurrentMonth();

      const cached = Cache.get(year, month);
      if (!cached && !forceRefresh) {
        showLoader();
      }

      const data = await API.getRecords(year, month, forceRefresh);
      Calendar.updateData(data);
      showCalendar();

      // Инициализируем фильтры и окошки после рендеринга
      if (typeof Filters !== 'undefined') Filters.init();
      if (typeof Windows !== 'undefined') Windows.init();

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      showMessage('Не удалось загрузить записи: ' + err.message, 'error');
      showCalendar();
    }
  }

  // === Обработчик смены месяца ===
  function onMonthChange(delta) {
    showLoader();
    Calendar.changeMonth(delta);
    loadAndRender(false);
  }

  // === Инициализация календаря ===
  function initCalendar() {
    if (isInitialized) return;

    // Проверяем, что Detail загружен
    if (typeof Detail !== 'undefined' && Detail.init) {
      Detail.init(elements.detailContainer);
    } else {
      console.warn('⚠️ Detail не загружен, повторная попытка через 500ms');
      setTimeout(initCalendar, 500);
      return;
    }

    // Проверяем, что Calendar загружен
    if (typeof Calendar === 'undefined') {
      console.warn('⚠️ Calendar не загружен, повторная попытка через 500ms');
      setTimeout(initCalendar, 500);
      return;
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

    console.log('✅ Календарь инициализирован');
  }

  // === Автоматический вход ===
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

  // === Обработка формы входа ===
  if (elements.loginForm) {
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
  }

  // === Выход ===
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите выйти?')) {
        Auth.logout();
      }
    });
  }

  // === Проверка загрузки модулей ===
  function checkModules() {
    const modules = [
      { name: 'CONFIG', obj: typeof CONFIG !== 'undefined' },
      { name: 'Cache', obj: typeof Cache !== 'undefined' },
      { name: 'API', obj: typeof API !== 'undefined' },
      { name: 'Auth', obj: typeof Auth !== 'undefined' },
      { name: 'CanvasRenderer', obj: typeof CanvasRenderer !== 'undefined' },
      { name: 'Calendar', obj: typeof Calendar !== 'undefined' },
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

  // ============================================
  //  ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
  //  Вызывается из AppLoader.html после загрузки всех скриптов
  // ============================================
  window.initApp = function() {
    console.log('🚀 Инициализация приложения...');

    // Проверяем, что все модули загружены
    if (!checkModules()) {
      // Если модули не загружены, пробуем ещё раз через 1 секунду
      setTimeout(() => {
        if (checkModules()) {
          startApp();
        } else {
          showMessage('Ошибка загрузки модулей. Обновите страницу.', 'error');
        }
      }, 1000);
      return;
    }

    startApp();
  };

  function startApp() {
    // Инициализация Detail
    if (typeof Detail !== 'undefined' && Detail.init) {
      Detail.init(elements.detailContainer);
    }

    // Инициализация уведомлений
    if (typeof Notifications !== 'undefined') Notifications.init();

    // Запуск календаря
    autoLogin();

    console.log('✅ Приложение инициализировано');
  }

  // === Делаем loadAndRender глобальной для Modal ===
  window.loadAndRender = loadAndRender;

  // === Если приложение уже загружено (например, при повторном входе) ===
  if (document.readyState === 'complete') {
    // Проверяем, есть ли уже токен
    if (typeof Auth !== 'undefined' && Auth.hasToken()) {
      console.log('🔑 Токен найден, запуск приложения...');
      if (typeof window.initApp === 'function') {
        window.initApp();
      }
    }
  }

  console.log('📦 main.js загружен');

})();
