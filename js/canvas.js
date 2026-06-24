// ===== Отрисовка плиток на Canvas =====

const CanvasRenderer = {
  /**
   * Отрисовать круговую плитку
   */
  drawTile(canvas, day, records, isSmall = false) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 6;

    ctx.clearRect(0, 0, size, size);

    // Фон
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFDF9';
    ctx.fill();
    ctx.strokeStyle = '#E0F2F1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Сектора
    const dayRecords = records[day] || [];
    const hourWidth = (Math.PI * 2) / CONFIG.WORKING_HOURS;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < CONFIG.WORKING_HOURS; i++) {
      const hour = 9 + i;
      const angleStart = startAngle + i * hourWidth;
      const angleEnd = angleStart + hourWidth;

      let isBooked = false;
      let color = CONFIG.GRAY;
      let serviceType = '';

      for (const record of dayRecords) {
        if (hour >= record.startHour && hour < record.endHour) {
          isBooked = true;
          serviceType = record.serviceType;
          color = CONFIG.COLORS[serviceType] || CONFIG.GRAY;
          break;
        }
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
      ctx.closePath();

      if (isBooked) {
        ctx.fillStyle = color + '40'; // Полупрозрачный
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isSmall ? 1.5 : 2.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'transparent';
        ctx.fill();
        ctx.strokeStyle = '#E0F2F1';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Число месяца по центру
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#37474F';
    const fontSize = isSmall ? size * 0.3 : size * 0.35;
    ctx.font = `600 ${fontSize}px Montserrat, sans-serif`;
    ctx.fillText(day, centerX, centerY + 2);
  },

  /**
   * Создать Canvas элемент для плитки
   */
  createTile(day, records, onClick = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    canvas.style.cssText = `
      width: 100%;
      height: 100%;
      cursor: pointer;
      border-radius: 50%;
      transition: transform 0.2s;
    `;

    this.drawTile(canvas, day, records, false);

    if (onClick) {
      canvas.addEventListener('click', () => onClick(day));
    }

    return canvas;
  }
};