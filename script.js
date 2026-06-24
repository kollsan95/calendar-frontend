(function() {
  'use strict';

  // Маркер {{GAS_URL}} будет заменён GitHub Actions
  const GAS_URL = '{{GAS_URL}}';
  
  // Проверка, что URL был подставлен
  if (GAS_URL === '{{GAS_URL}}' || !GAS_URL || GAS_URL.trim() === '') {
    const messageEl = document.getElementById('message');
    messageEl.className = 'message error';
    messageEl.textContent = 'Ошибка конфигурации: не найден URL бэкенда.';
    messageEl.style.display = 'block';
    document.getElementById('loginBtn').disabled = true;
    throw new Error('GAS_URL is not defined. Проверьте настройки деплоя.');
  }
  
  console.log('✅ GAS_URL загружен:', GAS_URL);

  // ===== Элементы =====
  const authBlock = document.getElementById('authBlock');
  const calendarContainer = document.getElementById('calendarContainer');
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const messageEl = document.getElementById('message');

  // ===== Состояние =====
  let isProcessing = false;

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

  // ===== Проверка токена =====
  function checkToken() {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // ===== Автоматический вход =====
  function autoLogin() {
    if (checkToken()) {
      showMessage('Вы уже авторизованы. Загрузка календаря...', 'success');
      setTimeout(() => {
        authBlock.style.display = 'none';
        calendarContainer.style.display = 'block';
        calendarContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 0;">
            <p style="font-size: 18px; color: #008080;">📅 Календарь загружается...</p>
            <p style="font-size: 14px; color: #7B8D8E; margin-top: 8px;">Функционал будет доступен в следующем этапе</p>
          </div>
        `;
        hideMessage();
      }, 1000);
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

    try {
      const url = new URL(GAS_URL);
      url.searchParams.append('action', 'login');
      url.searchParams.append('username', username);
      url.searchParams.append('password', password);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok') {
        localStorage.setItem('authToken', username);
        showMessage('Вход выполнен успешно!', 'success');

        setTimeout(() => {
          authBlock.style.display = 'none';
          calendarContainer.style.display = 'block';
          calendarContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 0;">
              <p style="font-size: 18px; color: #008080;">Добро пожаловать, ${username}! 👋</p>
              <p style="font-size: 14px; color: #7B8D8E; margin-top: 8px;">Календарь появится в следующем этапе</p>
            </div>
          `;
          hideMessage();
        }, 800);
      } else {
        showMessage(data.message || 'Неверное имя пользователя или пароль.', 'error');
      }
    } catch (err) {
      console.error('Ошибка входа:', err);
      showMessage(`Ошибка соединения: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  });

  // ===== Инициализация =====
  autoLogin();
  console.log('🔐 Ожидание входа...');

})();