// ===== Запросы к GAS =====
const API = {
    async request(params) {
        const url = new URL(CONFIG.GAS_URL);
        Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        return await response.json();
    },

    async postRequest(data) {
        const response = await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        return await response.json();
    },

    async login(username, password) { return this.request({ action: 'login', username, password }); },
    async validate(token) { return this.request({ action: 'validate', token }); },

    async getRecords(year, month, forceRefresh = false) {
        if (!forceRefresh) {
            const cached = Cache.get(year, month);
            if (cached) { console.log(`📦 Кеш: ${year}-${month}`); return cached; }
        }
        console.log(`🌐 Сервер: ${year}-${month}`);
        const data = await this.request({ action: 'getData', year, month });
        if (data.status === 'ok') { Cache.set(year, month, data.data || {}); return data.data || {}; }
        throw new Error(data.message || 'Ошибка получения данных');
    },

    async saveRecord(record) {
        const data = await this.postRequest({ action: 'saveRecord', ...record });
        if (data.status !== 'ok') throw new Error(data.message || 'Ошибка сохранения');
        return data;
    },

    async deleteRecord(recordId) {
        const data = await this.postRequest({ action: 'deleteRecord', recordId });
        if (data.status !== 'ok') throw new Error(data.message || 'Ошибка удаления');
        return data;
    },

    async getUsers() {
        const data = await this.request({ action: 'getUsers' });
        if (data.status === 'ok') return data.users || [];
        throw new Error(data.message || 'Ошибка получения пользователей');
    }
};
