// ===== Уведомления (локальные) =====
const Notifications = {
    STORAGE_KEY: 'notifications',

    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
        this.updateBadge();
        // Очистка старых уведомлений (раз в день)
        this.cleanOld();
    },

    get() {
        try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'); } catch { return []; }
    },

    save(notifications) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        this.updateBadge();
    },

    add(message, type = 'info') {
        const notifications = this.get();
        notifications.push({
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        });
        this.save(notifications);
        this.updateBadge();
        if (navigator.setAppBadge) navigator.setAppBadge(this.getUnreadCount());
    },

    getUnreadCount() {
        return this.get().filter(n => !n.read).length;
    },

    markAsRead(id) {
        const notifications = this.get();
        const found = notifications.find(n => n.id === id);
        if (found) found.read = true;
        this.save(notifications);
        this.updateBadge();
    },

    markAllAsRead() {
        const notifications = this.get();
        notifications.forEach(n => n.read = true);
        this.save(notifications);
        this.updateBadge();
    },

    updateBadge() {
        const badge = document.getElementById('notifBadge');
        const count = this.getUnreadCount();
        if (badge) {
            if (count > 0) { badge.style.display = 'inline'; badge.textContent = count; }
            else { badge.style.display = 'none'; }
        }
        this.updateFavicon(count);
    },

    updateFavicon(count) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            const svg = count > 0
                ? `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='80'>🔔</text><circle cx='80' cy='20' r='18' fill='#C62828'/><text x='72' y='30' font-size='20' fill='#FFF' font-weight='bold'>${count}</text></svg>`
                : `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📅</text></svg>`;
            favicon.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
        }
    },

    cleanOld() {
        const lastClean = localStorage.getItem('notif_clean_timestamp');
        const now = Date.now();
        if (!lastClean || now - parseInt(lastClean) > 86400000) {
            const notifications = this.get();
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 90);
            const filtered = notifications.filter(n => new Date(n.timestamp) > cutoff);
            if (filtered.length !== notifications.length) this.save(filtered);
            localStorage.setItem('notif_clean_timestamp', String(now));
        }
    },

    showList() {
        // Показываем приветственное сообщение при первом открытии списка
        if (!localStorage.getItem('notif_intro_shown')) {
            alert('🔔 Уведомления хранятся локально и автоматически удаляются через 90 дней.');
            localStorage.setItem('notif_intro_shown', 'true');
        }

        const notifications = this.get();
        const unread = notifications.filter(n => !n.read);
        const read = notifications.filter(n => n.read);

        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:3000;padding:20px;`;
        const content = document.createElement('div');
        content.style.cssText = `background:#FFFDF9;border-radius:24px;padding:24px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;`;

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="color:#008080;">🔔 Уведомления</h3>
                <div>
                    <button id="notifMarkAllRead" style="background:none;border:none;color:#008080;cursor:pointer;font-size:13px;margin-right:12px;">Все прочитаны</button>
                    <button id="notifCloseBtn" style="background:none;border:none;font-size:24px;cursor:pointer;color:#7B8D8E;">✕</button>
                </div>
            </div>
            <div id="notifList">
                ${notifications.length === 0 ? '<p style="color:#7B8D8E;text-align:center;padding:20px 0;">Нет уведомлений</p>' :
                notifications.map(n => `
                    <div style="padding:10px 14px;margin-bottom:8px;background:${n.read ? '#F5F5F5' : '#E0F2F1'};border-radius:10px;border-left:4px solid ${n.read ? '#B0BEC5' : '#008080'};">
                        <div style="font-size:14px;color:#37474F;">${n.message}</div>
                        <div style="font-size:11px;color:#7B8D8E;margin-top:4px;">${new Date(n.timestamp).toLocaleString('ru')}</div>
                        ${!n.read ? `<button class="notif-read-btn" data-id="${n.id}" style="background:none;border:none;color:#008080;cursor:pointer;font-size:12px;margin-top:4px;">✅ Прочитано</button>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.getElementById('notifCloseBtn').addEventListener('click', () => modal.remove());

        const markAllBtn = document.getElementById('notifMarkAllRead');
        if (markAllBtn) markAllBtn.addEventListener('click', () => { this.markAllAsRead(); modal.remove(); this.showList(); });

        document.querySelectorAll('.notif-read-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.markAsRead(btn.dataset.id);
                modal.remove();
                this.showList();
            });
        });
    }
};

// Инициализация
Notifications.init();

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('notificationsBtn');
    if (btn) btn.addEventListener('click', () => Notifications.showList());
});