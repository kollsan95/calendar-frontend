// ===== Кеширование данных =====

const Cache = {
  /**
   * Получить ключ для localStorage
   */
  getKey(year, month) {
    return `records_${year}_${String(month).padStart(2, '0')}`;
  },

  /**
   * Сохранить данные в кеш
   */
  set(year, month, data) {
    const key = this.getKey(year, month);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Не удалось сохранить в кеш:', e);
    }
  },

  /**
   * Получить данные из кеша
   */
  get(year, month) {
    const key = this.getKey(year, month);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Ошибка чтения кеша:', e);
    }
    return null;
  },

  /**
   * Очистить кеш для конкретного месяца
   */
  clear(year, month) {
    const key = this.getKey(year, month);
    localStorage.removeItem(key);
  },

  /**
   * Очистить весь кеш
   */
  clearAll() {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('records_')) {
        localStorage.removeItem(key);
      }
    }
  },

  /**
   * Проверить, есть ли данные в кеше
   */
  has(year, month) {
    return this.get(year, month) !== null;
  }
};

// ===== Проверка версии (без return) =====
(function checkVersion() {
  const STORAGE_VERSION_KEY = 'app_version';
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  
  // Если версия изменилась — очищаем всё
  if (storedVersion && storedVersion !== CONFIG.APP_VERSION) {
    localStorage.clear();
    localStorage.setItem(STORAGE_VERSION_KEY, CONFIG.APP_VERSION);
    window.location.reload();
    return;
  }
  
  // Если версии нет — устанавливаем
  if (!storedVersion) {
    localStorage.setItem(STORAGE_VERSION_KEY, CONFIG.APP_VERSION);
  }
})();