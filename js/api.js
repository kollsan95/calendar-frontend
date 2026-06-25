// ===== Запросы к GAS через google.script.run (без CORS) =====

const API = {
    /**
     * Универсальный вызов google.script.run
     */
    call(functionName, params = {}) {
        return new Promise((resolve, reject) => {
            // Проверяем, что google.script.run доступен
            if (typeof google === 'undefined' || !google.script) {
                reject(new Error('Google API не загружен. Проверьте подключение к интернету.'));
                return;
            }
            
            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(reject)
                [functionName](params);
        });
    },

    /**
     * Логин
     */
    async login(username, password) {
        return this.call('login', { username, password });
    },

    /**
     * Валидация токена
     */
    async validate(token) {
        return this.call('validate', { token });
    },

    /**
     * Получение записей за месяц (с кешем)
     */
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

    /**
     * Сохранение записи
     */
    async saveRecord(record) {
        const data = await this.call('saveRecord', record);
        if (data.status !== 'ok') {
            throw new Error(data.message || 'Ошибка сохранения');
        }
        return data;
    },

    /**
     * Удаление записи
     */
    async deleteRecord(recordId) {
        const data = await this.call('deleteRecord', { recordId });
        if (data.status !== 'ok') {
            throw new Error(data.message || 'Ошибка удаления');
        }
        return data;
    },

    /**
     * Получение списка пользователей
     */
    async getUsers() {
        const data = await this.call('getUsers', {});
        if (data.status === 'ok') {
            return data.users || [];
        }
        throw new Error(data.message || 'Ошибка получения пользователей');
    }
};