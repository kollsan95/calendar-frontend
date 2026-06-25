// ===== Модальное окно "Окошки" =====
const Windows = {
  async show() {
    const modal = document.getElementById('windowsModal');
    const content = document.getElementById('windowsContent');
    if (!modal || !content) return;

    const { year, month } = Calendar.getCurrentMonth();
    const data = await API.getRecords(year, month, true);

    const lastDay = new Date(year, month, 0).getDate();
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    let html = '';

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = daysOfWeek[date.getDay()];
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const records = data[dateKey] || [];

      const times = [9, 12, 15, 18];
      const timeStr = times.map(t => {
        let isBooked = false;
        for (const record of records) {
          if (t >= record.startHour && t < record.endHour) {
            isBooked = true;
            break;
          }
          if (record.startHour >= t - 1 && record.startHour <= t + 1) {
            isBooked = true;
            break;
          }
        }
        const timeLabel = String(t).padStart(2, '0') + ':00';
        return isBooked ? `<span style="text-decoration:line-through;color:#C62828;">${timeLabel}</span>` : timeLabel;
      }).join(', ');

      html += `<div>${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}(${dayOfWeek}) - ${timeStr}</div>`;
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
  },

  close() {
    const modal = document.getElementById('windowsModal');
    if (modal) modal.style.display = 'none';
  },

  init() {
    const btn = document.getElementById('windowsBtn');
    if (btn) {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => this.show());
    }

    const closeBtn = document.getElementById('windowsCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const modal = document.getElementById('windowsModal');
    if (modal) modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });
  }
};