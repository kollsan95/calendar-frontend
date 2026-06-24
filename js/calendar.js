// ===== Рендеринг календаря =====

const Calendar = {
  container: null,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  recordsData: {},
  onDayClick: null,
  selectedDate: null,

  /**
   * Инициализация
   */
  init(container, onDayClick = null) {
    this.container = container;
    this.onDayClick = onDayClick;
  },

  /**
   * Обновить данные и перерисовать
   */
  updateData(data) {
    this.recordsData = data;
    this.render();
  },

  /**
   * Переключить месяц
   */
  changeMonth(delta) {
    if (delta === -1) {
      if (this.month === 1) {
        this.month = 12;
        this.year--;
      } else {
        this.month--;
      }
    } else if (delta === 1) {
      if (this.month === 12) {
        this.month = 1;
        this.year++;
      } else {
        this.month++;
      }
    }
    return { year: this.year, month: this.month };
  },

  /**
   * Получить текущие год и месяц
   */
  getCurrentMonth() {
    return { year: this.year, month: this.month };
  },

  /**
   * Проверить, есть ли записи на дату
   */
  hasRecords(day) {
    const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.recordsData[dateKey] && this.recordsData[dateKey].length > 0;
  },

  /**
   * Получить записи на дату
   */
  getRecords(day) {
    const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.recordsData[dateKey] || [];
  },

  /**
   * Отрисовать календарь
   */
  render() {
    const container = this.container;
    container.innerHTML = '';

    // Заголовок с навигацией
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0 16px 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #E0F2F1;
    `;
    header.innerHTML = `
      <button id="prevMonth" style="background: none; border: none; font-size: 28px; color: #008080; cursor: pointer; padding: 0 12px; line-height: 1;">
        ‹
      </button>
      <span style="font-size: 20px; font-weight: 600; color: #008080; text-transform: capitalize;">
        ${new Date(this.year, this.month - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
      </span>
      <button id="nextMonth" style="background: none; border: none; font-size: 28px; color: #008080; cursor: pointer; padding: 0 12px; line-height: 1;">
        ›
      </button>
    `;
    container.appendChild(header);

    // Сетка
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
      max-width: 100%;
      margin: 0 auto;
    `;

    // Дни недели
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    for (const day of daysOfWeek) {
      const dayHeader = document.createElement('div');
      dayHeader.style.cssText = `
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: #7B8D8E;
        padding: 4px 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      dayHeader.textContent = day;
      grid.appendChild(dayHeader);
    }

    // Определяем первый день месяца
    const firstDay = new Date(this.year, this.month - 1, 1);
    const lastDay = new Date(this.year, this.month, 0);
    const firstDayOfWeek = firstDay.getDay() || 7;

    // Пустые ячейки
    for (let i = 1; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      empty.style.cssText = 'aspect-ratio: 1;';
      grid.appendChild(empty);
    }

    // Дни месяца
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === this.year && today.getMonth() === this.month - 1;
    const todayDay = today.getDate();

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        aspect-ratio: 1;
        width: 100%;
        position: relative;
      `;

      // Подсветка текущего дня
      const isToday = isCurrentMonth && day === todayDay;
      if (isToday) {
        cell.style.outline = '2px solid #008080';
        cell.style.outlineOffset = '2px';
        cell.style.borderRadius = '50%';
      }

      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      canvas.style.cssText = `
        width: 100%;
        height: 100%;
        cursor: pointer;
        border-radius: 50%;
        transition: transform 0.2s, box-shadow 0.2s;
      `;

      // Рисуем плитку
      const records = this.getRecords(day);
      CanvasRenderer.drawTile(canvas, day, this.recordsData, false);

      // Обработчик клика — переход в детальный режим
      canvas.addEventListener('click', () => {
        if (this.onDayClick) {
          this.onDayClick(day);
        }
      });

      // Hover-эффекты
      canvas.addEventListener('mouseenter', () => {
        canvas.style.transform = 'scale(1.05)';
        canvas.style.boxShadow = '0 4px 12px rgba(0, 128, 128, 0.2)';
      });
      canvas.addEventListener('mouseleave', () => {
        canvas.style.transform = 'scale(1)';
        canvas.style.boxShadow = 'none';
      });

      cell.appendChild(canvas);
      grid.appendChild(cell);
    }

    container.appendChild(grid);

    // Обработчики навигации
    this._bindNavigation();
  },

  /**
   * Привязать обработчики навигации
   */
  _bindNavigation() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
      const newPrev = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      newPrev.addEventListener('click', () => {
        if (this.onMonthChange) {
          this.onMonthChange(-1);
        }
      });
    }

    if (nextBtn) {
      const newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);
      newNext.addEventListener('click', () => {
        if (this.onMonthChange) {
          this.onMonthChange(1);
        }
      });
    }
  },

  /**
   * Колбэк при смене месяца
   */
  onMonthChange: null
};