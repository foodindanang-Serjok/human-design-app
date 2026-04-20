// ============================================================
// bodygraph.js — расчёт типа, профиля, авторитета и SVG бодиграфа
// ============================================================

const Bodygraph = {

  // ---- Каналы Human Design (пара ворот → канал) ----
  CHANNELS: [
    [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31],
    [9, 52], [10, 20], [10, 34], [11, 56], [12, 22], [13, 33],
    [16, 48], [17, 62], [18, 58], [19, 49], [20, 57], [21, 45],
    [23, 43], [24, 61], [25, 51], [26, 44], [27, 50], [28, 38],
    [29, 46], [30, 41], [32, 54], [34, 20], [34, 57], [35, 36],
    [37, 40], [38, 28], [39, 55], [41, 30], [42, 53], [43, 23],
    [44, 26], [45, 21], [47, 64], [48, 16], [49, 19], [53, 42],
    [54, 32], [55, 39], [57, 20], [57, 34], [58, 18], [59, 6],
    [60, 3], [61, 24], [62, 17], [63, 4], [64, 47]
  ],

  // ---- Центры и какие ворота в них входят ----
  CENTERS: {
    head:      { gates: [64, 61, 63], name: 'Голова' },
    ajna:      { gates: [47, 24, 4, 17, 43, 11], name: 'Аджна' },
    throat:    { gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16], name: 'Горло' },
    gCenter:   { gates: [1, 2, 7, 10, 13, 15, 25, 46], name: 'G-центр' },
    will:      { gates: [21, 26, 40, 51], name: 'Воля' },
    solar:     { gates: [30, 36, 22, 37, 55, 49, 6], name: 'Солнечное сплетение' },
    sacral:    { gates: [5, 14, 29, 59, 9, 3, 42, 27, 34], name: 'Сакральный' },
    spleen:    { gates: [48, 57, 44, 50, 32, 28, 18], name: 'Селезёнка' },
    root:      { gates: [53, 60, 52, 19, 39, 41, 58, 38, 54], name: 'Корень' }
  },

  // ---- Определить активированные ворота (объединение личности и дизайна) ----
  getActiveGates: function(personalityGates, designGates) {
    const active = new Set();
    for (const planet of Object.values(personalityGates)) active.add(planet.gate);
    for (const planet of Object.values(designGates)) active.add(planet.gate);
    return active;
  },

  // ---- Определить активированные центры ----
  getActiveCenters: function(activeGates) {
    const activeCenters = {};
    for (const [centerKey, center] of Object.entries(this.CENTERS)) {
      const hasGate = center.gates.some(g => activeGates.has(g));
      activeCenters[centerKey] = hasGate;
    }
    return activeCenters;
  },

  // ---- Определить активированные каналы ----
  getActiveChannels: function(activeGates) {
    return this.CHANNELS.filter(([g1, g2]) => activeGates.has(g1) && activeGates.has(g2));
  },

  // ---- Определить тип по активным центрам ----
  getType: function(activeCenters, activeChannels) {
    const hasSacral = activeCenters.sacral;
    const hasThroat = activeCenters.throat;
    const hasMotor  = activeCenters.solar || activeCenters.will || activeCenters.root;

    // Рефлектор — нет ни одного определённого центра
    const anyDefined = Object.values(activeCenters).some(v => v);
    if (!anyDefined) {
      return { type: 'Рефлектор', strategy: 'Ждать лунный цикл (28 дней)', authority: 'Лунный' };
    }

    // Манифестор — горло связано с мотором, но не с сакральным
    if (hasThroat && hasMotor && !hasSacral) {
      return { type: 'Манифестор', strategy: 'Информировать перед действием', authority: 'Эго или эмоциональный' };
    }

    // Проектор — нет сакрального, нет прямой связи с горлом через мотор
    if (!hasSacral) {
      return { type: 'Проектор', strategy: 'Ждать приглашения', authority: 'Ментальный / Лунный' };
    }

    // Манифестирующий генератор — сакральный И горло связаны
    if (hasSacral && hasThroat) {
      return { type: 'Манифестирующий Генератор', strategy: 'Реагировать, затем информировать', authority: 'Сакральный или эмоциональный' };
    }

    // Генератор — сакральный центр определён
    return { type: 'Генератор', strategy: 'Ждать и реагировать', authority: 'Сакральный или эмоциональный' };
  },

  // ---- Определить профиль (линии Солнца в личности и дизайне) ----
  getProfile: function(personalityGates, designGates) {
    const persLine  = personalityGates.sun.line;
    const desLine   = designGates.sun.line;

    const profiles = {
      '1/3': 'Исследователь / Мученик',
      '1/4': 'Исследователь / Оппортунист',
      '2/4': 'Отшельник / Оппортунист',
      '2/5': 'Отшельник / Еретик',
      '3/5': 'Мученик / Еретик',
      '3/6': 'Мученик / Образец для подражания',
      '4/6': 'Оппортунист / Образец для подражания',
      '4/1': 'Оппортунист / Исследователь',
      '5/1': 'Еретик / Исследователь',
      '5/2': 'Еретик / Отшельник',
      '6/2': 'Образец для подражания / Отшельник',
      '6/3': 'Образец для подражания / Мученик'
    };

    const key = persLine + '/' + desLine;
    const name = profiles[key] || (persLine + '/' + desLine);
    return { code: key, name: name, persLine: persLine, desLine: desLine };
  },

  // ---- Уточнить авторитет по активным центрам ----
  getAuthority: function(activeCenters) {
    if (activeCenters.solar)  return 'Эмоциональный';
    if (activeCenters.sacral) return 'Сакральный';
    if (activeCenters.spleen) return 'Интуитивный (Селезёнка)';
    if (activeCenters.will)   return 'Эго (Воля)';
    if (activeCenters.gCenter) return 'G-центр (Самость)';
    return 'Ментальный / Лунный';
  },

  // ---- Главный расчёт ----
  calculate: function(birthDate) {
    const designDate = Ephemeris.getDesignDate(birthDate);

    const personalityPlanets = Ephemeris.getAllPlanets(birthDate);
    const designPlanets      = Ephemeris.getAllPlanets(designDate);

    const personalityGates   = Ephemeris.getGatesForPlanets(personalityPlanets);
    const designGates        = Ephemeris.getGatesForPlanets(designPlanets);

    const activeGates    = this.getActiveGates(personalityGates, designGates);
    const activeCenters  = this.getActiveCenters(activeGates);
    const activeChannels = this.getActiveChannels(activeGates);

    const typeData    = this.getType(activeCenters, activeChannels);
    const profile     = this.getProfile(personalityGates, designGates);
    const authority   = this.getAuthority(activeCenters);

    return {
      type:         typeData.type,
      strategy:     typeData.strategy,
      authority:    authority,
      profile:      profile,
      activeCenters: activeCenters,
      activeGates:  activeGates,
      activeChannels: activeChannels,
      personalityGates: personalityGates,
      designGates: designGates
    };
  },

  // ============================================================
  // SVG бодиграф — координаты центров
  // ============================================================
  CENTER_COORDS: {
    head:      { x: 200, y: 40,  w: 60, h: 50, shape: 'triangle' },
    ajna:      { x: 200, y: 115, w: 60, h: 50, shape: 'triangle' },
    throat:    { x: 200, y: 195, w: 80, h: 40, shape: 'rect' },
    gCenter:   { x: 200, y: 275, w: 60, h: 60, shape: 'diamond' },
    will:      { x: 290, y: 255, w: 50, h: 50, shape: 'triangle' },
    solar:     { x: 290, y: 340, w: 60, h: 50, shape: 'triangle' },
    sacral:    { x: 200, y: 365, w: 80, h: 40, shape: 'rect' },
    spleen:    { x: 110, y: 255, w: 50, h: 50, shape: 'triangle' },
    root:      { x: 200, y: 445, w: 80, h: 40, shape: 'rect' }
  },

  drawSVG: function(result) {
    const svg = document.getElementById('bodygraph-svg');
    svg.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#C4B5FD"/>
      </marker>
    `;
    svg.appendChild(defs);

    // Соединительные линии между центрами
    const connections = [
      ['head', 'ajna'], ['ajna', 'throat'], ['throat', 'gCenter'],
      ['gCenter', 'sacral'], ['sacral', 'root'],
      ['throat', 'will'], ['will', 'gCenter'],
      ['throat', 'spleen'], ['spleen', 'gCenter'],
      ['solar', 'sacral'], ['solar', 'spleen'],
      ['root', 'solar'], ['root', 'spleen']
    ];

    connections.forEach(([a, b]) => {
      const ca = this.CENTER_COORDS[a];
      const cb = this.CENTER_COORDS[b];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', ca.x);
      line.setAttribute('y1', ca.y);
      line.setAttribute('x2', cb.x);
      line.setAttribute('y2', cb.y);
      line.setAttribute('stroke', '#E0DEFA');
      line.setAttribute('stroke-width', '6');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    });

    // Рисуем центры
    for (const [key, coords] of Object.entries(this.CENTER_COORDS)) {
      const isActive = result.activeCenters[key];
      const fill     = isActive ? '#6B5CE7' : '#F0EEFF';
      const stroke   = isActive ? '#4C3ECC' : '#D0CAFF';
      const textColor = isActive ? '#FFFFFF' : '#9B8FD0';
      const centerName = this.CENTERS[key].name;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      if (coords.shape === 'rect') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', coords.x - coords.w / 2);
        rect.setAttribute('y', coords.y - coords.h / 2);
        rect.setAttribute('width', coords.w);
        rect.setAttribute('height', coords.h);
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', '1.5');
        g.appendChild(rect);
      } else if (coords.shape === 'diamond') {
        const size = coords.w / 2;
        const points = [
          coords.x + ',' + (coords.y - size),
          (coords.x + size) + ',' + coords.y,
          coords.x + ',' + (coords.y + size),
          (coords.x - size) + ',' + coords.y
        ].join(' ');
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', points);
        poly.setAttribute('fill', fill);
        poly.setAttribute('stroke', stroke);
        poly.setAttribute('stroke-width', '1.5');
        g.appendChild(poly);
      } else if (coords.shape === 'triangle') {
        const hw = coords.w / 2;
        const hh = coords.h / 2;
        let points;
        if (coords.x > 220) {
          points = [
            coords.x + ',' + (coords.y - hh),
            (coords.x + hw) + ',' + (coords.y + hh),
            (coords.x - hw) + ',' + (coords.y + hh)
          ].join(' ');
        } else if (coords.x < 180) {
          points = [
            coords.x + ',' + (coords.y + hh),
            (coords.x - hw) + ',' + (coords.y - hh),
            (coords.x + hw) + ',' + (coords.y - hh)
          ].join(' ');
        } else {
          points = [
            coords.x + ',' + (coords.y - hh),
            (coords.x + hw) + ',' + (coords.y + hh),
            (coords.x - hw) + ',' + (coords.y + hh)
          ].join(' ');
        }
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', points);
        poly.setAttribute('fill', fill);
        poly.setAttribute('stroke', stroke);
        poly.setAttribute('stroke-width', '1.5');
        g.appendChild(poly);
      }

      // Подпись центра
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', textColor);
      text.setAttribute('font-family', 'sans-serif');
      text.setAttribute('font-weight', isActive ? '700' : '400');
      text.textContent = centerName;
      g.appendChild(text);

      svg.appendChild(g);
    }
  }
};
