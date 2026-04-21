// ============================================================
// bodygraph.js
// ============================================================

const Bodygraph = {

  CHANNELS: [
    [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],
    [9,52],[10,20],[10,34],[11,56],[12,22],[13,33],
    [16,48],[17,62],[18,58],[19,49],[20,57],[21,45],
    [23,43],[24,61],[25,51],[26,44],[27,50],[28,38],
    [29,46],[30,41],[32,54],[34,20],[34,57],[35,36],
    [37,40],[38,28],[39,55],[41,30],[42,53],[43,23],
    [44,26],[45,21],[47,64],[48,16],[49,19],[53,42],
    [54,32],[55,39],[57,20],[57,34],[58,18],[59,6],
    [60,3],[61,24],[62,17],[63,4],[64,47]
  ],

  CENTERS: {
    head:    { gates:[64,61,63],                         name:'Голова' },
    ajna:    { gates:[47,24,4,17,43,11],                 name:'Аджна' },
    throat:  { gates:[62,23,56,35,12,45,33,8,31,20,16],  name:'Горло' },
    gCenter: { gates:[1,2,7,10,13,15,25,46],             name:'G-центр' },
    will:    { gates:[21,26,40,51],                      name:'Воля' },
    solar:   { gates:[30,36,22,37,55,49,6],              name:'Солнечное' },
    sacral:  { gates:[5,14,29,59,9,3,42,27,34],          name:'Сакральный' },
    spleen:  { gates:[48,57,44,50,32,28,18],             name:'Селезёнка' },
    root:    { gates:[53,60,52,19,39,41,58,38,54],       name:'Корень' }
  },

  LINES: {
    1:'Исследователь', 2:'Отшельник', 3:'Мученик',
    4:'Оппортунист',   5:'Еретик',    6:'Ролевая модель'
  },

  PROFILES: {
    '1/3':'Исследователь / Мученик',    '1/4':'Исследователь / Оппортунист',
    '2/4':'Отшельник / Оппортунист',    '2/5':'Отшельник / Еретик',
    '3/5':'Мученик / Еретик',           '3/6':'Мученик / Ролевая модель',
    '4/6':'Оппортунист / Ролевая модель','4/1':'Оппортунист / Исследователь',
    '5/1':'Еретик / Исследователь',     '5/2':'Еретик / Отшельник',
    '6/2':'Ролевая модель / Отшельник', '6/3':'Ролевая модель / Мученик'
  },

  getActiveGates: function(pg, dg) {
    const a = new Set();
    for (const p of Object.values(pg)) a.add(p.gate);
    for (const p of Object.values(dg)) a.add(p.gate);
    return a;
  },

  getActiveCenters: function(ag) {
    const ac = {};
    for (const [k,c] of Object.entries(this.CENTERS))
      ac[k] = c.gates.some(g => ag.has(g));
    return ac;
  },

  getActiveChannels: function(ag) {
    return this.CHANNELS.filter(([g1,g2]) => ag.has(g1) && ag.has(g2));
  },

  getType: function(ac) {
    const anyDefined = Object.values(ac).some(v => v);
    if (!anyDefined) return { type:'Рефлектор', strategy:'Ждать лунный цикл (28 дней)' };
    if (ac.throat && (ac.solar||ac.will||ac.root) && !ac.sacral)
      return { type:'Манифестор', strategy:'Информировать перед действием' };
    if (!ac.sacral) return { type:'Проектор', strategy:'Ждать приглашения' };
    if (ac.sacral && ac.throat)
      return { type:'Манифестирующий Генератор', strategy:'Реагировать, затем информировать' };
    return { type:'Генератор', strategy:'Ждать и реагировать' };
  },

  getProfile: function(pg, dg) {
    const pl = pg.sun.line, dl = dg.sun.line;
    const key = pl+'/'+dl;
    const name = this.PROFILES[key] ||
      (this.LINES[pl]||pl)+' / '+(this.LINES[dl]||dl);
    return { code:key, name:name, persLine:pl, desLine:dl };
  },

  getAuthority: function(ac) {
    if (ac.solar)   return 'Эмоциональный';
    if (ac.sacral)  return 'Сакральный';
    if (ac.spleen)  return 'Интуитивный';
    if (ac.will)    return 'Эго (Воля)';
    if (ac.gCenter) return 'G-центр';
    return 'Ментальный / Лунный';
  },

  calculate: function(birthDate) {
    const dd = Ephemeris.getDesignDate(birthDate);
    const pp = Ephemeris.getAllPlanets(birthDate);
    const dp = Ephemeris.getAllPlanets(dd);
    const pg = Ephemeris.getGatesForPlanets(pp);
    const dg = Ephemeris.getGatesForPlanets(dp);
    const ag = this.getActiveGates(pg, dg);
    const ac = this.getActiveCenters(ag);
    const typeData = this.getType(ac);
    return {
      type:             typeData.type,
      strategy:         typeData.strategy,
      authority:        this.getAuthority(ac),
      profile:          this.getProfile(pg, dg),
      activeCenters:    ac,
      activeGates:      ag,
      activeChannels:   this.getActiveChannels(ag),
      personalityGates: pg,
      designGates:      dg
    };
  },

  // ============================================================
  // SVG бодиграф с силуэтом
  // ============================================================

  // Цвета центров
  CENTER_COLORS: {
    head:    { active:'rgba(230,230,255,0.92)', stroke:'rgba(200,200,255,1)' },
    ajna:    { active:'rgba(80,210,120,0.92)',  stroke:'rgba(100,240,140,1)' },
    throat:  { active:'rgba(60,195,185,0.92)',  stroke:'rgba(80,220,210,1)'  },
    gCenter: { active:'rgba(220,195,50,0.92)',  stroke:'rgba(255,225,60,1)'  },
    will:    { active:'rgba(255,140,60,0.92)',  stroke:'rgba(255,170,80,1)'  },
    solar:   { active:'rgba(200,80,220,0.92)',  stroke:'rgba(220,100,240,1)' },
    sacral:  { active:'rgba(185,40,90,0.92)',   stroke:'rgba(220,60,110,1)'  },
    spleen:  { active:'rgba(130,220,100,0.92)', stroke:'rgba(160,245,120,1)' },
    root:    { active:'rgba(220,130,40,0.92)',  stroke:'rgba(255,160,50,1)'  }
  },

  drawSVG: function(result) {
    const svg = document.getElementById('bodygraph-svg');
    if (!svg) return;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 360 520');

    const ns = 'http://www.w3.org/2000/svg';

    // Фон — силуэт
    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', 'silhouette.jpeg');
    img.setAttribute('x', '0');
    img.setAttribute('y', '0');
    img.setAttribute('width', '360');
    img.setAttribute('height', '520');
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.appendChild(img);

    // Затемнение
    const overlay = document.createElementNS(ns, 'rect');
    overlay.setAttribute('width', '360');
    overlay.setAttribute('height', '520');
    overlay.setAttribute('fill', 'rgba(10,8,24,0.35)');
    svg.appendChild(overlay);

    const ac = result.activeCenters;
    const colors = this.CENTER_COLORS;

    const inactive_fill   = 'rgba(255,255,255,0.07)';
    const inactive_stroke = 'rgba(255,255,255,0.28)';

    const shape = (type, ac_key, params) => {
      const active = ac[ac_key];
      const fill   = active ? colors[ac_key].active  : inactive_fill;
      const stroke = active ? colors[ac_key].stroke : inactive_stroke;
      const sw = active ? '2' : '1.5';
      const g = document.createElementNS(ns, 'g');
      let el;

      if (type === 'tri-up') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          params.cx+','+(params.cy-params.h)+' '+
          (params.cx+params.w/2)+','+(params.cy+params.h/2)+' '+
          (params.cx-params.w/2)+','+(params.cy+params.h/2));
      } else if (type === 'tri-down') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          params.cx+','+(params.cy+params.h)+' '+
          (params.cx+params.w/2)+','+(params.cy-params.h/2)+' '+
          (params.cx-params.w/2)+','+(params.cy-params.h/2));
      } else if (type === 'circle') {
        el = document.createElementNS(ns, 'circle');
        el.setAttribute('cx', params.cx);
        el.setAttribute('cy', params.cy);
        el.setAttribute('r', params.r);
      } else if (type === 'diamond') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          params.cx+','+(params.cy-params.h)+' '+
          (params.cx+params.w/2)+','+params.cy+' '+
          params.cx+','+(params.cy+params.h)+' '+
          (params.cx-params.w/2)+','+params.cy);
      } else if (type === 'hex') {
        const cx=params.cx, cy=params.cy, w=params.w/2, h=params.h/2;
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          cx+','+(cy-h)+' '+(cx+w)+','+(cy-h/2)+' '+
          (cx+w)+','+(cy+h/2)+' '+cx+','+(cy+h)+' '+
          (cx-w)+','+(cy+h/2)+' '+(cx-w)+','+(cy-h/2));
      } else if (type === 'rect') {
        el = document.createElementNS(ns, 'rect');
        el.setAttribute('x', params.cx - params.w/2);
        el.setAttribute('y', params.cy - params.h/2);
        el.setAttribute('width', params.w);
        el.setAttribute('height', params.h);
        el.setAttribute('rx', '6');
      }

      el.setAttribute('fill', fill);
      el.setAttribute('stroke', stroke);
      el.setAttribute('stroke-width', sw);
      g.appendChild(el);
      svg.appendChild(g);
    };

    // Голова — треугольник вверх — голова
    shape('tri-up',   'head',    { cx:180, cy:52,  w:56, h:30 });
    // Аджна — треугольник вниз — сразу под головой
    shape('tri-down', 'ajna',    { cx:180, cy:90,  w:56, h:25 });
    // Горло — круг — шея
    shape('circle',   'throat',  { cx:180, cy:118, r:18  });
    // G — ромб — центр груди
    shape('diamond',  'gCenter', { cx:180, cy:188, w:50, h:35 });
    // Воля — треугольник — правая грудь
    shape('tri-up',   'will',    { cx:240, cy:178, w:46, h:32 });
    // Солнечное — треугольник — правый бок
    shape('tri-up',   'solar',   { cx:248, cy:248, w:46, h:32 });
    // Сакральный — шестиугольник — живот
    shape('hex',      'sacral',  { cx:180, cy:255, w:56, h:38 });
    // Селезёнка — треугольник вниз — левый бок
    shape('tri-down', 'spleen',  { cx:120, cy:178, w:46, h:32 });
    // Корень — прямоугольник — низ
    shape('rect',     'root',    { cx:180, cy:318, w:64, h:28 });
  }
};
