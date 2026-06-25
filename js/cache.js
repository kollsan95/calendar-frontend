// ===== Кеширование данных =====
const Cache = {
  getKey(year, month) {
    return `records_${year}_${String(month).padStart(2, '0')}`;
  },

  set(year, month, data) {
    try {
      localStorage.setItem(this.getKey(year, month), JSON.stringify(data));
    } catch (e) {
      console.warn('Не удалось сохранить в кеш:', e);
    }
  },

  get(year, month) {
    try {
      const cached = localStorage.getItem(this.getKey(year, month));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Ошибка чтения кеша:', e);
    }
    return null;
  },

  clear(year, month) {
    localStorage.removeItem(this.getKey(year, month));
  },

  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('records_')) localStorage.removeItem(key);
    });
  },

  has(year, month) {
    return this.get(year, month) !== null;
  }
};

// ===== Проверка версии =====
(function checkVersion() {
  const STORAGE_VERSION_KEY = 'app_version';
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

  if (storedVersion && storedVersion !== CONFIG.APP_VERSION) {
    localStorage.clear();
    localStorage.setItem(STORAGE_VERSION_KEY, CONFIG.APP_VERSION);
    window.location.reload();
    return;
  }

  if (!storedVersion) {
    localStorage.setItem(STORAGE_VERSION_KEY, CONFIG.APP_VERSION);
  }
})();