// ===== Запросы к GAS =====

const API = {
  /**
   * Базовый запрос к GAS
   */
  async request(params) {
    const url = new URL(CONFIG.GAS_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Логин
   */
  async login(username, password) {
    return this.request({
      action: 'login',
      username: username,
      password: password
    });
  },

  /**
   * Валидация токена
   */
  async validate(token) {
    return this.request({
      action: 'validate',
      token: token
    });
  },

  /**
   * Получение записей за месяц (с кешем)
   */
  async getRecords(year, month, forceRefresh = false) {
    // Проверяем кеш
    if (!forceRefresh) {
      const cached = Cache.get(year, month);
      if (cached) {
        console.log(`📦 Загружено из кеша: ${year}-${month}`);
        return cached;
      }
    }

    // Загружаем с сервера
    console.log(`🌐 Загрузка с сервера: ${year}-${month}`);
    const data = await this.request({
      action: 'getData',
      year: year,
      month: month
    });

    if (data.status === 'ok') {
      Cache.set(year, month, data.data || {});
      return data.data || {};
    } else {
      throw new Error(data.message || 'Ошибка получения данных');
    }
  },

  /**
   * Сохранение записи (будет в следующем этапе)
   */
  async saveRecord(record) {
    // TODO: реализовать в следующем этапе
    throw new Error('Метод saveRecord пока не реализован');
  },

  /**
   * Удаление записи (будет в следующем этапе)
   */
  async deleteRecord(recordId) {
    // TODO: реализовать в следующем этапе
    throw new Error('Метод deleteRecord пока не реализован');
  }
};