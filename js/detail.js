// ===== Детальный режим =====
const Detail = {
    container: null,
    year: null, month: null, day: null,
    recordsData: {},
    isActive: false,
    selectedStart: null,
    isDragging: false,
    filter: 'all',
    userFilter: null,
    isFreeMode: false,

    init(container) { this.container = container; },

    show(year, month, day, recordsData) {
        this.year = year; this.month = month; this.day = day;
        this.recordsData = recordsData || {};
        this.isActive = true;
        this.selectedStart = null;
        this.render();
    },

    hide() {
        this.isActive = false;
        if (this.container) { this.container.innerHTML = ''; this.container.style.display = 'none'; }
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) calendarContainer.style.display = 'block';
        const filters = document.getElementById('filtersContainer');
        if (filters) filters.style.display = 'block';
        const windowsBtn = document.getElementById('windowsBtn');
        if (windowsBtn) windowsBtn.style.display = 'block';
    },

    render() {
        if (!this.container) { console.error('❌ Detail container not initialized'); return; }
        const container = this.container;
        container.style.display = 'block';
        container.innerHTML = '';

        // Фильтры над каруселью
        const filterBar = document.createElement('div');
        filterBar.style.cssText = `display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;justify-content:center;`;
        filterBar.innerHTML = `
            <button class="detail-filter-chip" data-type="all" style="padding:3px 12px;border-radius:14px;border:1px solid #008080;background:#008080;color:#FFF;font-size:11px;cursor:pointer;">Все</button>
            <button class="detail-filter-chip" data-type="free" style="padding:3px 12px;border-radius:14px;border:1px solid #E0F2F1;background:#FFF;color:#37474F;font-size:11px;cursor:pointer;">Свободные</button>
            <button class="detail-filter-chip" data-type="Кератин" style="padding:3px 12px;border-radius:14px;border:1px solid #E0F2F1;background:#FFF;color:#37474F;font-size:11px;cursor:pointer;">Кератин</button>
            <button class="detail-filter-chip" data-type="Ботокс" style="padding:3px 12px;border-radius:14px;border:1px solid #E0F2F1;background:#FFF;color:#37474F;font-size:11px;cursor:pointer;">Ботокс</button>
            <button class="detail-filter-chip" data-type="Холодное" style="padding:3px 12px;border-radius:14px;border:1px solid #E0F2F1;background:#FFF;color:#37474F;font-size:11px;cursor:pointer;">Холодное</button>
            <button class="detail-filter-chip" data-type="Полировка" style="padding:3px 12px;border-radius:14px;border:1px solid #E0F2F1;background:#FFF;color:#37474F;font-size:11px;cursor:pointer;">Полировка</button>
        `;
        container.appendChild(filterBar);

        // Фильтр пользователя (только для админа)
        if (Auth.isAdmin()) {
            const userFilterDiv = document.createElement('div');
            userFilterDiv.style.cssText = `text-align:center;margin-bottom:8px;`;
            const select = document.createElement('select');
            select.style.cssText = `padding:3px 12px;border-radius:14px;border:1px solid #E0F2F1;font-size:11px;background:#FFF;`;
            select.innerHTML = '<option value="all">Все пользователи</option>';
            // Загружаем пользователей
            API.getUsers().then(users => {
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.username;
                    opt.textContent = u.username;
                    select.appendChild(opt);
                });
            });
            select.addEventListener('change', () => {
                this.userFilter = select.value === 'all' ? null : select.value;
                this.render();
            });
            userFilterDiv.appendChild(select);
            container.appendChild(userFilterDiv);
        }

        // Кнопка "Назад" (обёрнута в овал)
        const backWrapper = document.createElement('div');
        backWrapper.style.cssText = `display:flex;justify-content:flex-start;margin-bottom:8px;`;
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Назад';
        backBtn.style.cssText = `padding:6px 20px;border-radius:30px;border:1px solid #008080;background:transparent;color:#008080;font-size:14px;font-weight:500;cursor:pointer;`;
        backBtn.addEventListener('click', () => this.hide());
        backWrapper.appendChild(backBtn);
        container.appendChild(backWrapper);

        // Заголовок с месяцем
        const monthTitle = document.createElement('div');
        monthTitle.style.cssText = `text-align:center;font-size:16px;font-weight:600;color:#008080;margin-bottom:8px;`;
        monthTitle.textContent = `${new Date(this.year, this.month - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}`;
        container.appendChild(monthTitle);

        // Карусель
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:12px;`;

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹';
        prevBtn.style.cssText = `background:none;border:none;font-size:24px;color:#008080;cursor:pointer;padding:0 8px;`;
        carouselWrapper.appendChild(prevBtn);

        const carouselContainer = document.createElement('div');
        carouselContainer.style.cssText = `flex:1;overflow:hidden;position:relative;`;
        const carouselTrack = document.createElement('div');
        carouselTrack.style.cssText = `display:flex;gap:8px;transition:transform 0.3s ease;padding:4px 0;`;
        carouselTrack.id = 'carouselTrack';
        carouselContainer.appendChild(carouselTrack);

        // Заполняем карусель
        const daysInMonth = new Date(this.year, this.month, 0).getDate();
        const tiles = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const tile = document.createElement('div');
            tile.style.cssText = `flex:0 0 auto;width:60px;height:60px;border-radius:50%;overflow:hidden;cursor:pointer;transition:all 0.3s;position:relative;`;
            if (d === this.day) {
                tile.style.boxShadow = '0 0 0 3px #008080, 0 4px 12px rgba(0,128,128,0.3)';
                tile.style.transform = 'scale(1.05)';
            }
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            canvas.style.cssText = `width:100%;height:100%;`;
            CanvasRenderer.drawTile(canvas, d, this.recordsData, this.year, this.month, true, this.filter, this.userFilter, this.isFreeMode);
            tile.appendChild(canvas);

            // Подпись дня недели под кружком
            const dateObj = new Date(this.year, this.month - 1, d);
            const dayLabel = document.createElement('div');
            dayLabel.style.cssText = `text-align:center;font-size:9px;color:#7B8D8E;margin-top:2px;`;
            dayLabel.textContent = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][dateObj.getDay()];
            tile.appendChild(dayLabel);

            tile.addEventListener('click', () => {
                this.day = d;
                this.render();
            });
            tiles.push(tile);
            carouselTrack.appendChild(tile);
        }
        carouselWrapper.appendChild(carouselContainer);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '›';
        nextBtn.style.cssText = `background:none;border:none;font-size:24px;color:#008080;cursor:pointer;padding:0 8px;`;
        carouselWrapper.appendChild(nextBtn);

        container.appendChild(carouselWrapper);

        // Прокрутка карусели к выбранному дню
        setTimeout(() => {
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            const items = track.children;
            let scrollPos = 0;
            for (let i = 0; i < items.length; i++) {
                const child = items[i];
                const dayNum = parseInt(child.textContent);
                if (dayNum === this.day) {
                    const rect = track.getBoundingClientRect();
                    const childRect = child.getBoundingClientRect();
                    scrollPos = childRect.left - rect.left - (rect.width / 2) + (childRect.width / 2);
                    break;
                }
            }
            track.style.transform = `translateX(${-scrollPos}px)`;
        }, 50);

        // Навигация по карусели
        let currentScroll = 0;
        const scrollStep = 120;
        prevBtn.addEventListener('click', () => {
            currentScroll -= scrollStep;
            const track = document.getElementById('carouselTrack');
            if (track) track.style.transform = `translateX(${currentScroll}px)`;
        });
        nextBtn.addEventListener('click', () => {
            currentScroll += scrollStep;
            const track = document.getElementById('carouselTrack');
            if (track) track.style.transform = `translateX(${currentScroll}px)`;
        });

        // Увеличенная плитка
        const tileContainer = document.createElement('div');
        tileContainer.style.cssText = `display:flex;justify-content:center;padding:8px 0;`;
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.cssText = `width:400px;height:400px;max-width:80vw;max-height:80vw;cursor:pointer;`;
        canvas.id = 'detailCanvas';
        tileContainer.appendChild(canvas);
        container.appendChild(tileContainer);

        // Отрисовка увеличенной плитки
        const drawDetailTile = (highlightHours = []) => {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2 - 10;
            const innerRadius = radius * 0.2;

            ctx.clearRect(0, 0, size, size);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFDF9';
            ctx.fill();
            ctx.strokeStyle = '#E0F2F1';
            ctx.lineWidth = 2;
            ctx.stroke();

            const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
            const dayRecords = this.recordsData[dateKey] || [];
            const hourWidth = (Math.PI * 2) / CONFIG.WORKING_HOURS;
            const startAngle = Math.PI / 2;

            const currentUser = Auth.getUser();

            for (let i = 0; i < CONFIG.WORKING_HOURS; i++) {
                const hour = 9 + i;
                const angleStart = startAngle + i * hourWidth;
                const angleEnd = angleStart + hourWidth;

                let isBooked = false;
                let color = CONFIG.GRAY;
                let recordUsername = null;
                let serviceType = null;

                for (const record of dayRecords) {
                    if (hour >= record.startHour && hour < record.endHour) {
                        isBooked = true;
                        serviceType = record.serviceType;
                        recordUsername = record.username;
                        color = CONFIG.COLORS[serviceType] || CONFIG.GRAY;
                        break;
                    }
                }

                let shouldBeGray = false;
                let isFree = false;

                if (isBooked) {
                    if (this.filter !== 'all' && serviceType !== this.filter) shouldBeGray = true;
                    if (this.userFilter && !Auth.isAdmin()) {
                        if (recordUsername !== currentUser.username) shouldBeGray = true;
                    }
                    if (this.userFilter && Auth.isAdmin() && this.userFilter !== 'all') {
                        if (recordUsername !== this.userFilter) shouldBeGray = true;
                    }
                } else {
                    if (this.isFreeMode) isFree = true;
                }

                const isHighlighted = highlightHours.includes(hour);

                ctx.beginPath();
                ctx.moveTo(centerX + innerRadius * Math.cos(angleStart), centerY + innerRadius * Math.sin(angleStart));
                ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
                ctx.arc(centerX, centerY, innerRadius, angleEnd, angleStart);
                ctx.closePath();

                if (isBooked) {
                    ctx.fillStyle = shouldBeGray ? `${CONFIG.GRAY}40` : color + '40';
                    ctx.fill();
                    ctx.strokeStyle = isHighlighted ? '#008080' : (shouldBeGray ? CONFIG.GRAY : color);
                    ctx.lineWidth = isHighlighted ? 4 : 2.5;
                    ctx.stroke();
                } else if (isFree) {
                    ctx.fillStyle = 'rgba(0, 200, 100, 0.15)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(0, 200, 100, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = 'transparent';
                    ctx.fill();
                    ctx.strokeStyle = '#E0F2F1';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                // Подписи часов снаружи (горизонтально)
                const labelRadius = radius + 16;
                const lx = centerX + labelRadius * Math.cos(angleStart + hourWidth / 2);
                const ly = centerY + labelRadius * Math.sin(angleStart + hourWidth / 2);
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#7B8D8E';
                ctx.font = '10px Montserrat, sans-serif';
                ctx.fillText(String(hour).padStart(2, '0'), lx, ly);
                ctx.restore();
            }

            // В центре не выводим дату в детальном режиме
        };

        drawDetailTile();

        // Интерактивность: выделение секторов
        let isDragging = false;
        let startHour = null;
        let selectedHours = [];

        const getHourFromEvent = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = ((e.clientX || e.touches?.[0]?.clientX) - rect.left) / rect.width * canvas.width;
            const y = ((e.clientY || e.touches?.[0]?.clientY) - rect.top) / rect.height * canvas.height;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const radiusPx = canvas.width / 2 - 10;
            const innerRadiusPx = radiusPx * 0.2;
            if (dist < innerRadiusPx || dist > radiusPx) return null; // Вне активной области
            const angle = Math.atan2(dy, dx);
            const hourWidth = (Math.PI * 2) / CONFIG.WORKING_HOURS;
            const startAngle = Math.PI / 2;
            let rawHour = Math.floor((angle - startAngle) / hourWidth);
            if (rawHour < 0) rawHour += CONFIG.WORKING_HOURS;
            return 9 + rawHour % CONFIG.WORKING_HOURS;
        };

        const startSelection = (e) => {
            e.preventDefault();
            const hour = getHourFromEvent(e);
            if (hour === null) return;
            // Проверяем, занят ли сектор
            const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
            const dayRecords = this.recordsData[dateKey] || [];
            let isBooked = false;
            for (const record of dayRecords) {
                if (hour >= record.startHour && hour < record.endHour) { isBooked = true; break; }
            }
            if (isBooked) return;
            isDragging = true;
            startHour = hour;
            selectedHours = [hour];
            drawDetailTile(selectedHours);
        };

        const moveSelection = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const hour = getHourFromEvent(e);
            if (hour === null) {
                // Если курсор вышел за пределы круга — сбрасываем выделение
                isDragging = false;
                selectedHours = [];
                drawDetailTile([]);
                return;
            }
            // Определяем диапазон от startHour до hour по кратчайшей дуге
            const diff = hour - startHour;
            let range = [];
            if (Math.abs(diff) <= CONFIG.WORKING_HOURS / 2) {
                if (diff >= 0) { for (let h = startHour; h <= hour; h++) range.push(h); }
                else { for (let h = startHour; h >= hour; h--) range.push(h); }
            } else {
                if (diff > 0) {
                    for (let h = startHour; h >= 9; h--) range.push(h);
                    for (let h = 20; h >= hour; h--) range.push(h);
                } else {
                    for (let h = startHour; h <= 20; h++) range.push(h);
                    for (let h = 9; h <= hour; h++) range.push(h);
                }
            }
            selectedHours = range;
            drawDetailTile(selectedHours);
        };

        const endSelection = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (selectedHours.length >= 2) {
                const start = Math.min(...selectedHours);
                const end = Math.max(...selectedHours) + 1;
                if (typeof Modal !== 'undefined' && Modal.showCreate) {
                    Modal.showCreate(this.day, this.month, this.year, { start, end });
                }
            }
            selectedHours = [];
            drawDetailTile([]);
        };

        canvas.addEventListener('mousedown', startSelection);
        canvas.addEventListener('mousemove', moveSelection);
        canvas.addEventListener('mouseup', endSelection);
        canvas.addEventListener('mouseleave', (e) => { if (isDragging) { isDragging = false; selectedHours = []; drawDetailTile([]); } });

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.touches[0]; startSelection({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} }); });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const touch = e.touches[0]; moveSelection({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} }); });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); endSelection({}); });

        // Список записей
        const listTitle = document.createElement('h4');
        listTitle.style.cssText = `font-size:14px;font-weight:500;color:#37474F;margin:8px 0 4px 0;`;
        listTitle.textContent = 'Записи на этот день:';
        container.appendChild(listTitle);

        const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
        const dayRecords = this.recordsData[dateKey] || [];

        if (dayRecords.length === 0) {
            const empty = document.createElement('p');
            empty.style.cssText = `color:#7B8D8E;font-size:13px;padding:4px 0;`;
            empty.textContent = 'Нет записей';
            container.appendChild(empty);
        } else {
            const list = document.createElement('ul');
            list.style.cssText = `list-style:none;padding:0;margin:0;`;
            dayRecords.forEach(record => {
                const item = document.createElement('li');
                item.style.cssText = `padding:6px 10px;margin-bottom:4px;background:#E0F2F1;border-radius:8px;font-size:12px;display:flex;justify-content:space-between;align-items:center;`;
                item.innerHTML = `
                    <span><strong>${String(record.startHour).padStart(2, '0')}:00</strong> — <strong>${String(record.endHour).padStart(2, '0')}:00</strong>
                    <span style="color:#008080;margin-left:6px;">${record.serviceType}</span>
                    <span style="color:#7B8D8E;margin-left:6px;">${record.username}</span></span>
                    <button data-id="${record.id}" style="background:none;border:none;color:#C62828;cursor:pointer;font-size:14px;">✕</button>
                `;
                list.appendChild(item);
            });
            container.appendChild(list);
        }

        // Скрываем календарь и фильтры
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) calendarContainer.style.display = 'none';
        const filters = document.getElementById('filtersContainer');
        if (filters) filters.style.display = 'none';
        const windowsBtn = document.getElementById('windowsBtn');
        if (windowsBtn) windowsBtn.style.display = 'none';

        // Обработчики фильтров в детальном режиме
        document.querySelectorAll('.detail-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.dataset.type;
                this.filter = type;
                this.isFreeMode = (type === 'free');
                // Обновляем активный чип
                document.querySelectorAll('.detail-filter-chip').forEach(c => {
                    c.style.background = '#FFF';
                    c.style.color = '#37474F';
                    c.style.borderColor = '#E0F2F1';
                });
                chip.style.background = '#008080';
                chip.style.color = '#FFF';
                chip.style.borderColor = '#008080';
                this.render();
            });
        });
    }
};