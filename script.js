(function() {
  'use strict';

  // ===== Версия =====
  const APP_VERSION = '{{VERSION}}';
  const STORAGE_VERSION_KEY = 'app_version';

  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion && storedVersion !== APP_VERSION) {
    localStorage.clear();
    localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION);
    window.location.reload();
    return;
  }
  if (!storedVersion) {
    localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION);
  }

  // ===== Конфигурация =====
  const GAS_URL = '{{GAS_URL}}';
  const COLORS = {
    'Кератин': '#D4AF37',
    'Ботокс': '#4A90E2',
    'Холодное': '#A8D8EA',
    'Полировка': '#7B8D8E'
  };
  const GRAY = '#E0E0E0';
  const WORKING_HOURS = 12; // 9:00 - 21:00

  // ===== Элементы =====
  const authBlock = document.getElementById('authBlock');
  const calendarContainer = document.getElementById('calendarContainer');
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const messageEl = document.getElementById('message');
  const loaderEl = document.getElementById('loader');

  // ===== Состояние =====
  let isProcessing = false;
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1;
  let recordsData = {};
  let currentUser = null;

  // ===== Вспомогательные функции =====
  function showMessage(text, type = 'error') {
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messageEl.style.display = 'block';
  }

  function hideMessage() {
    messageEl.style.display = 'none';
    messageEl.className = 'message';
  }

  function setLoading(loading) {
    isProcessing = loading;
    loginBtn.disabled = loading;
    loginBtn.textContent = loading ? 'Вход...' : 'Войти';
  }

  function showLoader() {
    authBlock.style.display = 'none';
    calendarContainer.style.display = 'none';
    loaderEl.style.display = 'flex';
  }

  function showAuth() {
    authBlock.style.display = 'block';
    calendarContainer.style.display = 'none';
    loaderEl.style.display = 'none';
  }

  function showCalendar() {
    authBlock.style.display = 'none';
    calendarContainer.style.display = 'block';
    loaderEl.style.display = 'none';
  }

  // ===== Получение данных с сервера =====
  async function fetchRecords(year, month) {
    try {
      const url = new URL(GAS_URL);
      url.searchParams.append('action', 'getData');
      url.searchParams.append('year', year);
      url.searchParams.append('month', month);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'ok') {
        return data.data || {};
      } else {
        throw new Error(data.message || 'Ошибка получения данных');
      }
    } catch (err) {
      console.error('Ошибка загрузки записей:', err);
      showMessage('Не удалось загрузить записи: ' + err.message, 'error');
      return {};
    }
  }

  // ===== Рисование плитки на Canvas =====
  function drawTile(canvas, day, records, isSmall = false) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 6;

    // Очистка
    ctx.clearRect(0, 0, size, size);

    // Фон
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFDF9';
    ctx.fill();
    ctx.strokeStyle = '#E0F2F1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Сектора
    const dayRecords = records[day] || [];
    const hourWidth = (Math.PI * 2) / WORKING_HOURS;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < WORKING_HOURS; i++) {
      const hour = 9 + i;
      const angleStart = startAngle + i * hourWidth;
      const angleEnd = angleStart + hourWidth;

      // Проверяем, есть ли запись на этот час
      let isBooked = false;
      let color = GRAY;
      let serviceType = '';

      for (const record of dayRecords) {
        if (hour >= record.startHour && hour < record.endHour) {
          isBooked = true;
          serviceType = record.serviceType;
          color = COLORS[serviceType] || GRAY;
          break;
        }
      }

      // Рисуем сектор
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
      ctx.closePath();

      if (isBooked) {
        ctx.fillStyle = color + '40'; // Полупрозрачный
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isSmall ? 1.5 : 2.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'transparent';
        ctx.fill();
        ctx.strokeStyle = '#E0F2F1';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Число месяца по центру
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#37474F';
    const fontSize = isSmall ? size * 0.3 : size * 0.35;
    ctx.font = `600 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillText(day, centerX, centerY + 2);
  }

  // ===== Отрисовка календаря =====
  function renderCalendar() {
    const container = calendarContainer;
    container.innerHTML = '';

    // Заголовок с навигацией
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      margin-bottom: 16px;
    `;
    header.innerHTML = `
      <button id="prevMonth" style="background: none; border: none; font-size: 24px; color: #008080; cursor: pointer;">‹</button>
      <span style="font-size: 20px; font-weight: 600; color: #008080;">
        ${new Date(currentYear, currentMonth - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
      </span>
      <button id="nextMonth" style="background: none; border: none; font-size: 24px; color: #008080; cursor: pointer;">›</button>
    `;
    container.appendChild(header);

    // Сетка календаря
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
      max-width: 100%;
      margin: 0 auto;
    `;

    // Дни недели (заголовки)
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    for (const day of daysOfWeek) {
      const dayHeader = document.createElement('div');
      dayHeader.style.cssText = `
        text-align: center;
        font-size: 12px;
        font-weight: 500;
        color: #7B8D8E;
        padding: 4px 0;
      `;
      dayHeader.textContent = day;
      grid.appendChild(dayHeader);
    }

    // Определяем первый день месяца
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const firstDayOfWeek = firstDay.getDay() || 7; // Пн = 1, Вс = 7

    // Пустые ячейки до первого дня
    for (let i = 1; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      grid.appendChild(empty);
    }

    // Дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        aspect-ratio: 1;
        width: 100%;
        position: relative;
      `;

      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      canvas.style.cssText = `
        width: 100%;
        height: 100%;
        cursor: pointer;
        border-radius: 50%;
        transition: transform 0.2s;
      `;
      canvas.addEventListener('click', () => {
        alert(`Вы выбрали ${day}.${currentMonth}.${currentYear}`);
      });

      drawTile(canvas, day, recordsData, false);

      cell.appendChild(canvas);
      grid.appendChild(cell);
    }

    container.appendChild(grid);

    // Обработчики навигации
    document.getElementById('prevMonth').addEventListener('click', () => {
      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
      } else {
        currentMonth--;
      }
      loadAndRender();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
      if (currentMonth === 12) {
        currentMonth = 1;
        currentYear++;
      } else {
        currentMonth++;
      }
      loadAndRender();
    });
  }

  // ===== Загрузка данных и рендеринг =====
  async function loadAndRender() {
    showLoader();
    recordsData = await fetchRecords(currentYear, currentMonth);
    showCalendar();
    renderCalendar();
  }

  // ===== Автоматический вход =====
  async function autoLogin() {
    showLoader();

    const token = localStorage.getItem('authToken');
    if (!token) {
      showAuth();
      return;
    }

    try {
      const url = new URL(GAS_URL);
      url.searchParams.append('action', 'validate');
      url.searchParams.append('token', token);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'ok') {
        currentUser = data.user;
        await loadAndRender();
      } else {
        localStorage.removeItem('authToken');
        showAuth();
      }
    } catch (err) {
      console.error('Ошибка валидации:', err);
      localStorage.removeItem('authToken');
      showAuth();
    }
  }

  // ===== Обработка формы входа =====
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();

    if (isProcessing) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showMessage('Пожалуйста, заполните все поля.', 'error');
      return;
    }

    setLoading(true);
    showLoader();

    try {
      const url = new URL(GAS_URL);
      url.searchParams.append('action', 'login');
      url.searchParams.append('username', username);
      url.searchParams.append('password', password);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok') {
        localStorage.setItem('authToken', username);
        localStorage.setItem('userRole', data.user.role);
        currentUser = data.user;
        await loadAndRender();
      } else {
        showAuth();
        showMessage(data.message || 'Неверное имя пользователя или пароль.', 'error');
      }
    } catch (err) {
      showAuth();
      showMessage(`Ошибка соединения: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  });

  // ===== Инициализация =====
  autoLogin();

})();