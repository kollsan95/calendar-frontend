// ===== Детальный режим =====

const Detail = {
  container: null,
  year: null,
  month: null,
  day: null,
  recordsData: {},
  isActive: false,

  /**
   * Инициализация
   */
  init(container) {
    this.container = container;
  },

  /**
   * Войти в детальный режим
   */
  show(year, month, day, recordsData) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.recordsData = recordsData || {};
    this.isActive = true;

    this.render();
  },

  /**
   * Выйти из детального режима
   */
  hide() {
    this.isActive = false;
    if (this.container) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
    }
    // Показываем календарь
    const calendarContainer = document.getElementById('calendarContainer');
    if (calendarContainer) {
      calendarContainer.style.display = 'block';
    }
  },

  /**
   * Отрисовать детальный режим
   */
  render() {
    if (!this.container) {
      console.error('❌ Detail container not initialized');
      return;
    }

    const container = this.container;
    container.style.display = 'block';
    container.innerHTML = '';

    // Кнопка "Назад"
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Назад';
    backBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 16px;
      color: #008080;
      cursor: pointer;
      padding: 12px 0;
      font-weight: 500;
    `;
    backBtn.addEventListener('click', () => this.hide());
    container.appendChild(backBtn);

    // Заголовок
    const header = document.createElement('h2');
    header.style.cssText = `
      font-size: 24px;
      font-weight: 600;
      color: #008080;
      margin: 8px 0 16px 0;
    `;
    header.textContent = `${this.day}.${this.month}.${this.year}`;
    container.appendChild(header);

    // Увеличенная плитка
    const tileContainer = document.createElement('div');
    tileContainer.style.cssText = `
      display: flex;
      justify-content: center;
      padding: 20px 0;
    `;

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.cssText = `
      width: 300px;
      height: 300px;
      max-width: 80vw;
      max-height: 80vw;
    `;

    // Рисуем увеличенную плитку
    const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
    const dayRecords = this.recordsData[dateKey] || [];
    
    // Передаём объект с записями для отрисовки
    const recordsForDay = {};
    recordsForDay[dateKey] = dayRecords;
    CanvasRenderer.drawTile(canvas, this.day, recordsForDay, false);

    tileContainer.appendChild(canvas);
    container.appendChild(tileContainer);

    // Список записей на этот день
    const listTitle = document.createElement('h4');
    listTitle.style.cssText = `
      font-size: 16px;
      font-weight: 500;
      color: #37474F;
      margin: 16px 0 8px 0;
    `;
    listTitle.textContent = 'Записи на этот день:';
    container.appendChild(listTitle);

    if (dayRecords.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = `
        color: #7B8D8E;
        font-size: 14px;
        padding: 16px 0;
      `;
      empty.textContent = 'Нет записей';
      container.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
      `;
      for (const record of dayRecords) {
        const item = document.createElement('li');
        item.style.cssText = `
          padding: 10px 14px;
          margin-bottom: 6px;
          background: #E0F2F1;
          border-radius: 10px;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        item.innerHTML = `
          <span>
            <strong>${String(record.startHour).padStart(2, '0')}:00</strong> — 
            <strong>${String(record.endHour).padStart(2, '0')}:00</strong>
            <span style="color: #008080; margin-left: 8px;">${record.serviceType}</span>
            <span style="color: #7B8D8E; margin-left: 8px;">${record.username}</span>
          </span>
          <button data-id="${record.id}" style="background: none; border: none; color: #C62828; cursor: pointer; font-size: 18px;">✕</button>
        `;
        list.appendChild(item);
      }
      container.appendChild(list);
    }

    // Кнопка "Добавить запись"
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Добавить запись';
    addBtn.style.cssText = `
      width: 100%;
      padding: 14px;
      margin-top: 16px;
      background: #008080;
      color: #FFF;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    `;
    addBtn.addEventListener('click', () => {
      if (typeof Modal !== 'undefined' && Modal.showCreate) {
        Modal.showCreate(this.day, this.month, this.year);
      } else {
        alert('Модальное окно не загружено');
      }
    });
    container.appendChild(addBtn);

    // Скрываем основной календарь
    const calendarContainer = document.getElementById('calendarContainer');
    if (calendarContainer) {
      calendarContainer.style.display = 'none';
    }
  }
};