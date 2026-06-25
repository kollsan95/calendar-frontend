// ===== Кеширование данных =====
const Cache = {
    getKey(year, month) {
        return `records_${year}_${String(month).padStart(2, '0')}`;
    },
    set(year, month, data) {
        try { localStorage.setItem(this.getKey(year, month), JSON.stringify(data)); } catch(e) { console.warn(e); }
    },
    get(year, month) {
        try { const cached = localStorage.getItem(this.getKey(year, month)); if (cached) return JSON.parse(cached); } catch(e) { console.warn(e); }
        return null;
    },
    clear(year, month) { localStorage.removeItem(this.getKey(year, month)); },
    clearAll() {
        Object.keys(localStorage).forEach(key => { if (key.startsWith('records_')) localStorage.removeItem(key); });
    }
};

// Проверка версии
(function() {
    const stored = localStorage.getItem('app_version');
    if (stored && stored !== CONFIG.APP_VERSION) { localStorage.clear(); localStorage.setItem('app_version', CONFIG.APP_VERSION); window.location.reload(); }
    if (!stored) localStorage.setItem('app_version', CONFIG.APP_VERSION);
})();