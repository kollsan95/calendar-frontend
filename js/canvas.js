// ===== Отрисовка плиток на Canvas =====
const CanvasRenderer = {
    drawTile(canvas, day, records, year, month, isSmall = false, filter = 'all', userFilter = null, isFreeMode = false) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 6;
        const innerRadius = radius * 0.2; // Отступ 20% от центра

        ctx.clearRect(0, 0, size, size);

        // Фон
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9';
        ctx.fill();
        ctx.strokeStyle = '#E0F2F1';
        ctx.lineWidth = 1;
        ctx.stroke();

        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRecords = records[dateKey] || [];
        const hourWidth = (Math.PI * 2) / CONFIG.WORKING_HOURS;
        const startAngle = Math.PI / 2; // 9 часов слева

        const currentUser = Auth.getUser();

        // Собираем занятые часы
        const bookedHours = [];
        for (const record of dayRecords) {
            for (let h = record.startHour; h < record.endHour; h++) {
                bookedHours.push(h);
            }
        }

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
                if (filter !== 'all' && serviceType !== filter) shouldBeGray = true;
                if (userFilter && currentUser && !Auth.isAdmin()) {
                    if (recordUsername !== currentUser.username) shouldBeGray = true;
                }
                if (userFilter && Auth.isAdmin() && userFilter !== 'all') {
                    if (recordUsername !== userFilter) shouldBeGray = true;
                }
            } else {
                // Проверка свободных
                if (isFreeMode) {
                    isFree = true;
                }
            }

            ctx.beginPath();
            ctx.moveTo(centerX + innerRadius * Math.cos(angleStart), centerY + innerRadius * Math.sin(angleStart));
            ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
            ctx.arc(centerX, centerY, innerRadius, angleEnd, angleStart);
            ctx.closePath();

            if (isBooked) {
                ctx.fillStyle = shouldBeGray ? `${CONFIG.GRAY}40` : color + '40';
                ctx.fill();
                ctx.strokeStyle = shouldBeGray ? CONFIG.GRAY : color;
                ctx.lineWidth = isSmall ? 1.5 : 2.5;
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
        }

        // Подписи часов (снаружи круга, горизонтально)
        for (let i = 0; i < CONFIG.WORKING_HOURS; i++) {
            const hour = 9 + i;
            const angle = startAngle + i * hourWidth + hourWidth / 2;
            const labelRadius = radius + 14;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#7B8D8E';
            ctx.font = isSmall ? '8px Montserrat, sans-serif' : '10px Montserrat, sans-serif';
            // Не поворачиваем, пишем горизонтально
            ctx.fillText(String(hour).padStart(2, '0'), x, y);
            ctx.restore();
        }

        // Число месяца в центре (только для календаря, не для детального)
        if (!isSmall) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#37474F';
            const fontSize = size * 0.32;
            ctx.font = `600 ${fontSize}px Montserrat, sans-serif`;
            ctx.fillText(day, centerX, centerY + 2);
        }
    },

    createTile(day, records, year, month, onClick = null, filter = 'all', userFilter = null, isFreeMode = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        canvas.style.cssText = `width:100%;height:100%;cursor:pointer;border-radius:50%;transition:transform 0.2s,box-shadow 0.2s;`;
        this.drawTile(canvas, day, records, year, month, false, filter, userFilter, isFreeMode);
        if (onClick) canvas.addEventListener('click', () => onClick(day));
        return canvas;
    }
};