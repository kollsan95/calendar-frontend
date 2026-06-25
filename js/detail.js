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
    carouselScrollPos: 0,

    init(container) { this.container = container; },

    show(year, month, day, recordsData) {
        this.year = year; this.month = month; this.day = day;
        this.recordsData = recordsData || {};
        this.isActive = true;
        this.selectedStart = null;
        this.carouselScrollPos = 0;
        this.render();
    },

    hide() {
        this.isActive = false;
        if (this.container) { this.container.innerHTML = ''; this.container.style.display = 'none'; }
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) calendarContainer.style.display = 'block';
        const filtersContainer = document.getElementById('filtersContainer');
        if (filtersContainer) filtersContainer.style.display = 'block';
        const bottomPanel = document.getElementById('bottomPanel');
        if (bottomPanel) bottomPanel.style.display = 'flex';
    },

    render() {
        if (!this.container) { console.error('❌ Detail container not initialized'); return; }
        const container = this.container;
        container.style.display = 'block';
        container.innerHTML = '';

        // Кнопка "Назад" (овал) + фильтры
        const topBar = document.createElement('div');
        topBar.style.cssText = `display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;`;
        
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Назад';
        backBtn.style.cssText = `padding:6px 20px;border-radius:30px;border:1px solid #008080;background:transparent;color:#008080;font-size:14px;font-weight:500;cursor:pointer;`;
        backBtn.addEventListener('click', () => this.hide());
        topBar.appendChild(backBtn);

        // Фильтры (чипсы) — справа
        const filterWrapper = document.createElement('div');
        filterWrapper.style.cssText = `display:flex;flex-wrap:wrap;gap:4px;`;
        const filterLabels = ['Все', 'Свободные', 'Кератин', 'Ботокс', 'Холодное', 'Полировка'];
        filterLabels.forEach(label => {
            const type = label === 'Все' ? 'all' : label === 'Свободные' ? 'free' : label;
            const chip = document.createElement('button');
            chip.textContent = label;
            chip.dataset.type = type;
            const isActive = this.filter === type;
            chip.style.cssText = `
                padding:4px 14px;border-radius:16px;border:1px solid ${isActive ? '#008080' : '#E0F2F1'};
                background:${isActive ? '#008080' : '#FFF'};color:${isActive ? '#FFF' : '#37474F'};
                font-size:12px;cursor:pointer;font-family:'Montserrat',sans-serif;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                user-select: none;
            `;
            chip.addEventListener('click', () => {
                this.filter = type;
                this.isFreeMode = (type === 'free');
                this.render();
            });
            filterWrapper.appendChild(chip);
        });
        topBar.appendChild(filterWrapper);
        container.appendChild(topBar);

        // Фильтр пользователя (только для админа) — справа под кругом
        if (Auth.isAdmin()) {
            const userFilterDiv = document.createElement('div');
            userFilterDiv.style.cssText = `display:flex;justify-content:flex-end;margin-bottom:8px;`;
            const select = document.createElement('select');
            select.style.cssText = `padding:4px 14px;border-radius:16px;border:1px solid #E0F2F1;font-size:12px;background:#FFF;font-family:'Montserrat',sans-serif;box-shadow: 0 2px 4px rgba(0,0,0,0.05);cursor:pointer;`;
            select.innerHTML = '<option value="all">Все пользователи</option>';
            API.getUsers().then(users => {
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.username;
                    opt.textContent = u.username;
                    if (this.userFilter === u.username) opt.selected = true;
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

        // Заголовок с месяцем
        const monthTitle = document.createElement('div');
        monthTitle.style.cssText = `text-align:center;font-size:16px;font-weight:600;color:#008080;margin-bottom:8px;`;
        monthTitle.textContent = `${new Date(this.year, this.month - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}`;
        container.appendChild(monthTitle);

        // Карусель
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `display:flex;align-items:center;gap:4px;margin-bottom:12px;position:relative;`;

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹';
        prevBtn.style.cssText = `background:none;border:none;font-size:28px;color:#008080;cursor:pointer;padding:0 8px;z-index:10;`;
        carouselWrapper.appendChild(prevBtn);

        const carouselContainer = document.createElement('div');
        carouselContainer.style.cssText = `flex:1;overflow:hidden;position:relative;`;
        const carouselTrack = document.createElement('div');
        carouselTrack.style.cssText = `display:flex;gap:8px;transition:transform 0.4s ease;padding:4px 0;`;
        carouselTrack.id = 'carouselTrack';
        carouselContainer.appendChild(carouselTrack);
        carouselWrapper.appendChild(carouselContainer);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '›';
        nextBtn.style.cssText = `background:none;border:none;font-size:28px;color:#008080;cursor:pointer;padding:0 8px;z-index:10;`;
        carouselWrapper.appendChild(nextBtn);

        container.appendChild(carouselWrapper);

        // Заполняем карусель
        this._populateCarousel(carouselTrack);

        // Прокрутка к выбранному дню (по центру)
        setTimeout(() => this._scrollToDay(carouselTrack), 100);

        // Навигация (исправлено направление)
        prevBtn.addEventListener('click', () => {
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            const itemWidth = track.children[0]?.offsetWidth + 8 || 68;
            this.carouselScrollPos += itemWidth;
            track.style.transform = `translateX(${this.carouselScrollPos}px)`;
        });
        nextBtn.addEventListener('click', () => {
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            const itemWidth = track.children[0]?.offsetWidth + 8 || 68;
            this.carouselScrollPos -= itemWidth;
            track.style.transform = `translateX(${this.carouselScrollPos}px)`;
        });

        // Свайп (мышь и touch)
        let isDraggingCarousel = false;
        let startX = 0;
        let startScrollPos = 0;

        const startCarouselDrag = (x) => {
            isDraggingCarousel = true;
            startX = x;
            startScrollPos = this.carouselScrollPos;
            carouselTrack.style.transition = 'none';
        };
        const moveCarouselDrag = (x) => {
            if (!isDraggingCarousel) return;
            const diff = x - startX;
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            this.carouselScrollPos = startScrollPos + diff;
            track.style.transform = `translateX(${this.carouselScrollPos}px)`;
        };
        const endCarouselDrag = () => {
            if (!isDraggingCarousel) return;
            isDraggingCarousel = false;
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            track.style.transition = 'transform 0.4s ease';
            const itemWidth = track.children[0]?.offsetWidth + 8 || 68;
            const offset = Math.round(this.carouselScrollPos / itemWidth) * itemWidth;
            this.carouselScrollPos = offset;
            track.style.transform = `translateX(${offset}px)`;
        };

        carouselTrack.addEventListener('mousedown', (e) => startCarouselDrag(e.clientX));
        document.addEventListener('mousemove', (e) => moveCarouselDrag(e.clientX));
        document.addEventListener('mouseup', endCarouselDrag);

        carouselTrack.addEventListener('touchstart', (e) => startCarouselDrag(e.touches[0].clientX), { passive: true });
        carouselTrack.addEventListener('touchmove', (e) => moveCarouselDrag(e.touches[0].clientX), { passive: true });
        carouselTrack.addEventListener('touchend', endCarouselDrag, { passive: true });

        // Колесико мыши
        carouselContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            const itemWidth = track.children[0]?.offsetWidth + 8 || 68;
            this.carouselScrollPos += delta * itemWidth;
            track.style.transform = `translateX(${this.carouselScrollPos}px)`;
        }, { passive: false });

        // Увеличенная плитка
        const tileContainer = document.createElement('div');
        tileContainer.style.cssText = `display:flex;justify-content:center;padding:8px 0;`;
        const canvas = document.createElement('canvas');
        canvas.width = 440;
        canvas.height = 440;
        canvas.style.cssText = `width:440px;height:440px;max-width:85vw;max-height:85vw;cursor:pointer;`;
        canvas.id = 'detailCanvas';
        tileContainer.appendChild(canvas);
        container.appendChild(tileContainer);

        // Отрисовка увеличенной плитки с выделением
        const drawDetailTile = (highlightHours = []) => {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2 - 14;
            const innerRadius = radius * 0.4;

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

                // Подписи часов (горизонтально, увеличенный радиус)
                const labelRadius = radius + 22;
                const lx = centerX + labelRadius * Math.cos(angleStart + hourWidth / 2);
                const ly = centerY + labelRadius * Math.sin(angleStart + hourWidth / 2);
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#7B8D8E';
                ctx.font = '11px Montserrat, sans-serif';
                ctx.fillText(String(hour).padStart(2, '0'), lx, ly);
                ctx.restore();
            }
        };

        drawDetailTile();

        // Интерактивность: выделение секторов с цветом
        let isDraggingDetail = false;
        let startHourDetail = null;
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
            const radiusPx = canvas.width / 2 - 14;
            const innerRadiusPx = radiusPx * 0.4;
            if (dist < innerRadiusPx || dist > radiusPx) return null;
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
            const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
            const dayRecords = this.recordsData[dateKey] || [];
            let isBooked = false;
            for (const record of dayRecords) {
                if (hour >= record.startHour && hour < record.endHour) { isBooked = true; break; }
            }
            if (isBooked) return;
            isDraggingDetail = true;
            startHourDetail = hour;
            selectedHours = [hour];
            drawDetailTile(selectedHours);
        };

        const moveSelection = (e) => {
            if (!isDraggingDetail) return;
            e.preventDefault();
            const hour = getHourFromEvent(e);
            if (hour === null) {
                isDraggingDetail = false;
                selectedHours = [];
                drawDetailTile([]);
                return;
            }
            const diff = hour - startHourDetail;
            let range = [];
            if (Math.abs(diff) <= CONFIG.WORKING_HOURS / 2) {
                if (diff >= 0) { for (let h = startHourDetail; h <= hour; h++) range.push(h); }
                else { for (let h = startHourDetail; h >= hour; h--) range.push(h); }
            } else {
                if (diff > 0) {
                    for (let h = startHourDetail; h >= 9; h--) range.push(h);
                    for (let h = 20; h >= hour; h--) range.push(h);
                } else {
                    for (let h = startHourDetail; h <= 20; h++) range.push(h);
                    for (let h = 9; h <= hour; h++) range.push(h);
                }
            }
            selectedHours = range;
            drawDetailTile(selectedHours);
        };

        const endSelection = (e) => {
            if (!isDraggingDetail) return;
            isDraggingDetail = false;
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
        canvas.addEventListener('mouseleave', (e) => { if (isDraggingDetail) { isDraggingDetail = false; selectedHours = []; drawDetailTile([]); } });

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

        // Скрываем календарь и нижнюю панель
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) calendarContainer.style.display = 'none';
        const filtersContainer = document.getElementById('filtersContainer');
        if (filtersContainer) filtersContainer.style.display = 'none';
        const bottomPanel = document.getElementById('bottomPanel');
        if (bottomPanel) bottomPanel.style.display = 'none';
    },

    _populateCarousel(track) {
        const daysInMonth = new Date(this.year, this.month, 0).getDate();
        const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        track.innerHTML = '';

        for (let d = 1; d <= daysInMonth; d++) {
            const tileWrapper = document.createElement('div');
            tileWrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;flex:0 0 auto;width:60px;`;

            const tile = document.createElement('div');
            tile.style.cssText = `width:52px;height:52px;border-radius:50%;overflow:hidden;cursor:pointer;transition:all 0.3s;`;
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

            const dateObj = new Date(this.year, this.month - 1, d);
            const dayLabel = document.createElement('div');
            dayLabel.style.cssText = `text-align:center;font-size:9px;color:#7B8D8E;margin-top:2px;`;
            dayLabel.textContent = daysOfWeek[dateObj.getDay()];
            tileWrapper.appendChild(tile);
            tileWrapper.appendChild(dayLabel);

            tile.addEventListener('click', () => {
                this.day = d;
                this.render();
            });
            track.appendChild(tileWrapper);
        }
    },

    _scrollToDay(track) {
        if (!track) return;
        const items = track.children;
        let targetIndex = 0;
        for (let i = 0; i < items.length; i++) {
            const child = items[i];
            const dayNum = parseInt(child.querySelector('div')?.textContent || '0');
            if (dayNum === this.day) { targetIndex = i; break; }
        }
        const trackWidth = track.parentElement?.offsetWidth || 300;
        const itemWidth = 60 + 8;
        const offset = targetIndex * itemWidth - trackWidth / 2 + itemWidth / 2;
        this.carouselScrollPos = -offset;
        track.style.transform = `translateX(${this.carouselScrollPos}px)`;
    }
};