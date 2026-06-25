// ===== Запросы к GAS через google.script.run (БЕЗ CORS) =====

const API = {
  /**
   * Проверка, что google.script.run доступен
   */
  isAvailable() {
    return typeof google !== 'undefined' && google.script && google.script.run;
  },

  /**
   * Универсальный вызов google.script.run
   */
  call(functionName, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Google API не загружен. Проверьте подключение к интернету и перезагрузите страницу.'));
        return;
      }

      console.log(`📤 Вызов ${functionName} с параметрами:`, params);

      google.script.run
        .withSuccessHandler((result) => {
          console.log(`✅ ${functionName} успешно:`, result);
          resolve(result);
        })
        .withFailureHandler((error) => {
          console.error(`❌ ${functionName} ошибка:`, error);
          reject(error);
        })
        [functionName](params);
    });
  },

  async login(username, password) {
    return this.call('login', { username, password });
  },

  async validate(token) {
    return this.call('validate', { token });
  },

  async getRecords(year, month, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = Cache.get(year, month);
      if (cached) {
        console.log(`📦 Кеш: ${year}-${month}`);
        return cached;
      }
    }

    console.log(`🌐 Сервер (google.script.run): ${year}-${month}`);
    const data = await this.call('getData', { year, month });
    if (data.status === 'ok') {
      Cache.set(year, month, data.data || {});
      return data.data || {};
    }
    throw new Error(data.message || 'Ошибка получения данных');
  },

  async saveRecord(record) {
    const data = await this.call('saveRecord', record);
    if (data.status !== 'ok') {
      throw new Error(data.message || 'Ошибка сохранения');
    }
    return data;
  },

  async deleteRecord(recordId) {
    const data = await this.call('deleteRecord', { recordId });
    if (data.status !== 'ok') {
      throw new Error(data.message || 'Ошибка удаления');
    }
    return data;
  },

  async getUsers() {
    const data = await this.call('getUsers', {});
    if (data.status === 'ok') {
      return data.users || [];
    }
    throw new Error(data.message || 'Ошибка получения пользователей');
  }
};