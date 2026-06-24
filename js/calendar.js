// ===== Рендеринг календаря =====

const Calendar = {
  container: null,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  recordsData: {},
  onDayClick: null,

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
      padding: 10px 0;
      margin-bottom: 16px;
    `;
    header.innerHTML = `
      <button id="prevMonth" style="background: none; border: none; font-size: 24px; color: #008080; cursor: pointer;">‹</button>
      <span style="font-size: 20px; font-weight: 600; color: #008080;">
        ${new Date(this.year, this.month - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
      </span>
      <button id="nextMonth" style="background: none; border: none; font-size: 24px; color: #008080; cursor: pointer;">›</button>
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
        font-weight: 500;
        color: #7B8D8E;
        padding: 4px 0;
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
      grid.appendChild(empty);
    }

    // Дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cell = document.createElement('div');
      cell.style.cssText = `
        aspect-ratio: 1;
        width: 100%;
        position: relative;
      `;

      const onClick = this.onDayClick ? () => this.onDayClick(day) : null;
      const canvas = CanvasRenderer.createTile(day, this.recordsData, onClick);
      cell.appendChild(canvas);
      grid.appendChild(cell);
    }

    container.appendChild(grid);

    // Сохраняем ссылки на кнопки для навигации
    this._bindNavigation();
  },

  /**
   * Привязать обработчики навигации
   */
  _bindNavigation() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      document.getElementById('prevMonth').addEventListener('click', () => {
        if (this.onMonthChange) {
          this.onMonthChange(-1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      document.getElementById('nextMonth').addEventListener('click', () => {
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