// ===== Модальное окно =====

const Modal = {
  /**
   * Показать модальное окно создания/редактирования записи
   */
  showCreate(day, month, year, selectedRange = null) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Если диапазон не выбран — устанавливаем по умолчанию (9:00 - 10:00)
    const startHour = selectedRange ? selectedRange.start : 9;
    const endHour = selectedRange ? selectedRange.end : 10;
    
    const overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #FFFDF9;
      border-radius: 24px;
      padding: 32px;
      max-width: 420px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease;
    `;
    
    const isAdmin = Auth.isAdmin();
    const currentUser = Auth.getUser();
    
    modal.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 600; color: #008080; margin-bottom: 8px;">
        📝 Новая запись
      </h3>
      <p style="font-size: 14px; color: #7B8D8E; margin-bottom: 24px;">
        ${day}.${month}.${year}
      </p>
      
      <div class="form-group">
        <label>Время</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <select id="modalStartHour" style="flex: 1; padding: 10px; border: 1.5px solid #E0F2F1; border-radius: 12px; font-size: 16px;">
            ${this._generateHourOptions(9, 20)}
          </select>
          <span style="color: #7B8D8E;">—</span>
          <select id="modalEndHour" style="flex: 1; padding: 10px; border: 1.5px solid #E0F2F1; border-radius: 12px; font-size: 16px;">
            ${this._generateHourOptions(10, 21)}
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label for="modalUser">Пользователь</label>
        <select id="modalUser" style="width: 100%; padding: 10px; border: 1.5px solid #E0F2F1; border-radius: 12px; font-size: 16px;" ${!isAdmin ? 'disabled' : ''}>
          ${this._generateUserOptions(isAdmin, currentUser)}
        </select>
      </div>
      
      <div class="form-group">
        <label for="modalService">Тип услуги</label>
        <select id="modalService" style="width: 100%; padding: 10px; border: 1.5px solid #E0F2F1; border-radius: 12px; font-size: 16px;">
          <option value="Кератин">Кератин</option>
          <option value="Ботокс">Ботокс</option>
          <option value="Холодное">Холодное</option>
          <option value="Полировка">Полировка</option>
        </select>
      </div>
      
      <div id="adminFields" style="${isAdmin ? 'display: block;' : 'display: none;'}">
        <div class="form-group">
          <label for="modalInsta">Instagram (ссылка)</label>
          <input id="modalInsta" type="text" placeholder="https://instagram.com/..." style="width: 100%; padding: 10px; border: 1.5px solid #E0F2F1; border-radius: 12px; font-size: 16px;" />
        </div>
        <div class="form-group">
          <label for="modalPhone">Телефон</label>
          <input id="modalPhone" type="text" placeholder="+7 (999) 123-45-67" style="width: 100%; padding: 10px; border: 1.5px solid #E0F2F1; border-radius: 12px; font-size: 16px;" />
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button id="modalCancel" style="flex: 1; padding: 14px; background: #E0F2F1; color: #37474F; border: none; border-radius: 14px; font-size: 16px; font-weight: 600; cursor: pointer;">
          Отмена
        </button>
        <button id="modalSave" style="flex: 2; padding: 14px; background: #008080; color: #FFF; border: none; border-radius: 14px; font-size: 16px; font-weight: 600; cursor: pointer;">
          Сохранить
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Устанавливаем выбранные часы
    document.getElementById('modalStartHour').value = startHour;
    document.getElementById('modalEndHour').value = endHour;
    
    // Закрытие по клику на оверлей
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    
    // Кнопка Отмена
    document.getElementById('modalCancel').addEventListener('click', () => this.close());
    
    // Кнопка Сохранить
    document.getElementById('modalSave').addEventListener('click', async () => {
      await this._saveRecord(date);
    });
  },
  
  /**
   * Закрыть модальное окно
   */
  close() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.remove();
    }
  },
  
  /**
   * Сохранение записи
   */
  async _saveRecord(date) {
    const startHour = parseInt(document.getElementById('modalStartHour').value);
    const endHour = parseInt(document.getElementById('modalEndHour').value);
    const username = document.getElementById('modalUser').value;
    const serviceType = document.getElementById('modalService').value;
    const insta = document.getElementById('modalInsta')?.value || '';
    const phone = document.getElementById('modalPhone')?.value || '';
    
    // Валидация
    if (startHour >= endHour) {
      alert('Время начала должно быть меньше времени окончания');
      return;
    }
    
    // Для админа проверяем обязательные поля (если пользователь не админ)
    const isAdmin = Auth.isAdmin();
    const currentUser = Auth.getUser();
    if (isAdmin && username !== currentUser.username) {
      if (!insta || !phone) {
        alert('Для записи другого пользователя необходимо указать Instagram и телефон');
        return;
      }
    }
    
    try {
      const response = await API.saveRecord({
        date,
        startHour,
        endHour,
        username,
        serviceType,
        insta,
        phone
      });
      
      if (response.status === 'ok') {
        // Обновляем кеш для текущего месяца
        const { year, month } = Calendar.getCurrentMonth();
        Cache.clear(year, month);
        await loadAndRender(true);
        this.close();
      } else {
        alert(response.message || 'Ошибка сохранения');
      }
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  },
  
  /**
   * Генерация опций для часов
   */
  _generateHourOptions(start, end) {
    let options = '';
    for (let i = start; i <= end; i++) {
      const label = String(i).padStart(2, '0') + ':00';
      options += `<option value="${i}">${label}</option>`;
    }
    return options;
  },
  
  /**
   * Генерация опций для пользователей
   */
  _generateUserOptions(isAdmin, currentUser) {
    // TODO: загружать список пользователей с сервера
    // Пока используем фиксированный список
    const users = ['admin', 'user1', 'user2'];
    let options = '';
    
    if (isAdmin) {
      for (const user of users) {
        options += `<option value="${user}">${user}</option>`;
      }
    } else {
      options += `<option value="${currentUser.username}">${currentUser.username}</option>`;
    }
    
    return options;
  }
};

// Добавляем стили анимации
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);