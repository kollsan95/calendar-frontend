// ===== Детальный режим =====
const Detail = {
    container: null,
    year: null, month: null, day: null,
    recordsData: {},
    isActive: false,
    selectedStart: null,
    isDragging: false,

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
    },

    render() {
        if (!this.container) { console.error('❌ Detail container not initialized'); return; }
        const container = this.container;
        container.style.display = 'block';
        container.innerHTML = '';

        // Кнопка "Назад"
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Назад';
        backBtn.style.cssText = `background:none;border:none;font-size:16px;color:#008080;cursor:pointer;padding:12px 0;font-weight:500;`;
        backBtn.addEventListener('click', () => this.hide());
        container.appendChild(backBtn);

        // Карусель (верхняя часть)
        const carouselContainer = document.createElement('div');
        carouselContainer.style.cssText = `height:20vh;overflow:hidden;position:relative;margin:8px 0;`;
        const carouselTrack = document.createElement('div');
        carouselTrack.style.cssText = `display:flex;gap:8px;overflow-x:auto;padding:4px 0;scroll-behavior:smooth;height:100%;align-items:center;`;
        carouselTrack.id = 'carouselTrack';

        // Заполняем карусель днями месяца
        const lastDay = new Date(this.year, this.month, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
            const tile = document.createElement('div');
            tile.style.cssText = `flex:0 0 auto;width:${carouselContainer.clientHeight || 80}px;height:${carouselContainer.clientHeight || 80}px;border-radius:50%;overflow:hidden;cursor:pointer;transition:all 0.3s;`;
            if (d === this.day) {
                tile.style.boxShadow = '0 0 0 3px #008080, 0 4px 12px rgba(0,128,128,0.3)';
                tile.style.transform = 'scale(1.05)';
            }
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            canvas.style.cssText = `width:100%;height:100%;`;
            CanvasRenderer.drawTile(canvas, d, this.recordsData, this.year, this.month, true, 'all', null);
            tile.appendChild(canvas);
            tile.addEventListener('click', () => {
                this.day = d;
                this.render();
            });
            carouselTrack.appendChild(tile);
        }
        carouselContainer.appendChild(carouselTrack);
        container.appendChild(carouselContainer);

        // Увеличенная плитка (нижняя часть) с интерактивными секторами
        const tileContainer = document.createElement('div');
        tileContainer.style.cssText = `display:flex;justify-content:center;padding:12px 0;`;
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.cssText = `width:400px;height:400px;max-width:80vw;max-height:80vw;cursor:pointer;`;
        canvas.id = 'detailCanvas';
        tileContainer.appendChild(canvas);
        container.appendChild(tileContainer);

        // Интерактивность: выделение секторов
        let isDragging = false;
        let startHour = null;
        let selectedHours = [];

        const drawDetailTile = (highlightHours = []) => {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2 - 10;

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
            const startAngle = -Math.PI / 2;

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

                const isHighlighted = highlightHours.includes(hour);

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
                ctx.closePath();

                if (isBooked) {
                    ctx.fillStyle = color + '40';
                    ctx.fill();
                    ctx.strokeStyle = isHighlighted ? '#008080' : color;
                    ctx.lineWidth = isHighlighted ? 4 : 2.5;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = isHighlighted ? 'rgba(0,128,128,0.15)' : 'transparent';
                    ctx.fill();
                    ctx.strokeStyle = isHighlighted ? '#008080' : '#E0F2F1';
                    ctx.lineWidth = isHighlighted ? 3 : 0.5;
                    ctx.stroke();
                }

                // Подпись часа
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(angleStart + hourWidth / 2);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#7B8D8E';
                ctx.font = '10px Montserrat, sans-serif';
                ctx.fillText(String(hour).padStart(2, '0') + ':00', radius * 0.7, 0);
                ctx.restore();
            }

            // Центр
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#37474F';
            ctx.font = `600 28px Montserrat, sans-serif`;
            ctx.fillText(`${this.day}.${this.month}`, centerX, centerY);
        };

        drawDetailTile();

        // Обработчики для выделения секторов
        const getHourFromEvent = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const dx = x - centerX;
            const dy = y - centerY;
            const angle = Math.atan2(dy, dx);
            const hourWidth = (Math.PI * 2) / CONFIG.WORKING_HOURS;
            const startAngle = -Math.PI / 2;
            let rawHour = Math.floor((angle - startAngle) / hourWidth);
            if (rawHour < 0) rawHour += CONFIG.WORKING_HOURS;
            return 9 + rawHour % CONFIG.WORKING_HOURS;
        };

        const startSelection = (e) => {
            e.preventDefault();
            const hour = getHourFromEvent(e);
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
            if (hour === null) return;
            // Определяем диапазон от startHour до hour по кратчайшей дуге
            const diff = hour - startHour;
            let range = [];
            if (Math.abs(diff) <= CONFIG.WORKING_HOURS / 2) {
                if (diff >= 0) {
                    for (let h = startHour; h <= hour; h++) range.push(h);
                } else {
                    for (let h = startHour; h >= hour; h--) range.push(h);
                }
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
        listTitle.style.cssText = `font-size:16px;font-weight:500;color:#37474F;margin:12px 0 8px 0;`;
        listTitle.textContent = 'Записи на этот день:';
        container.appendChild(listTitle);

        const dateKey = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
        const dayRecords = this.recordsData[dateKey] || [];

        if (dayRecords.length === 0) {
            const empty = document.createElement('p');
            empty.style.cssText = `color:#7B8D8E;font-size:14px;padding:8px 0;`;
            empty.textContent = 'Нет записей';
            container.appendChild(empty);
        } else {
            const list = document.createElement('ul');
            list.style.cssText = `list-style:none;padding:0;margin:0;`;
            dayRecords.forEach(record => {
                const item = document.createElement('li');
                item.style.cssText = `padding:8px 12px;margin-bottom:4px;background:#E0F2F1;border-radius:8px;font-size:13px;display:flex;justify-content:space-between;align-items:center;`;
                item.innerHTML = `
                    <span><strong>${String(record.startHour).padStart(2, '0')}:00</strong> — <strong>${String(record.endHour).padStart(2, '0')}:00</strong>
                    <span style="color:#008080;margin-left:8px;">${record.serviceType}</span>
                    <span style="color:#7B8D8E;margin-left:8px;">${record.username}</span></span>
                    <button data-id="${record.id}" style="background:none;border:none;color:#C62828;cursor:pointer;font-size:16px;">✕</button>
                `;
                list.appendChild(item);
            });
            container.appendChild(list);
        }

        // Скрываем календарь
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) calendarContainer.style.display = 'none';
    }
};