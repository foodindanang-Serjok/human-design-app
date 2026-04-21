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
    // Центр определён только если в нём есть ворота из ПОЛНОГО канала
    // Сначала находим все ворота которые входят в активные каналы
    const definedGates = new Set();
    this.CHANNELS.forEach(([g1, g2]) => {
      if (ag.has(g1) && ag.has(g2)) {
        definedGates.add(g1);
        definedGates.add(g2);
      }
    });
    const ac = {};
    for (const [k, c] of Object.entries(this.CENTERS))
      ac[k] = c.gates.some(g => definedGates.has(g));
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
    const ac = result.activeCenters;
    const colors = this.CENTER_COLORS;
    const inF = 'rgba(255,255,255,0.07)';
    const inS = 'rgba(255,255,255,0.25)';

    const img = document.createElementNS(ns, 'image');
    img.setAttribute('href', 'silhouette.jpeg');
    img.setAttribute('x', '0'); img.setAttribute('y', '0');
    img.setAttribute('width', '360'); img.setAttribute('height', '520');
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.appendChild(img);

    const ov = document.createElementNS(ns, 'rect');
    ov.setAttribute('width', '360'); ov.setAttribute('height', '520');
    ov.setAttribute('fill', 'rgba(10,8,24,0.35)');
    svg.appendChild(ov);

    const draw = (type, key, p) => {
      const active = ac[key];
      const fill   = active ? colors[key].active  : inF;
      const stroke = active ? colors[key].stroke : inS;
      const g = document.createElementNS(ns, 'g');
      let el;
      if (type === 'tri-up') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          p.cx+','+(p.cy-p.h)+' '+(p.cx+p.w/2)+','+(p.cy+p.h/2)+' '+(p.cx-p.w/2)+','+(p.cy+p.h/2));
      } else if (type === 'tri-down') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          p.cx+','+(p.cy+p.h)+' '+(p.cx+p.w/2)+','+(p.cy-p.h/2)+' '+(p.cx-p.w/2)+','+(p.cy-p.h/2));
      } else if (type === 'circle') {
        el = document.createElementNS(ns, 'circle');
        el.setAttribute('cx', p.cx); el.setAttribute('cy', p.cy); el.setAttribute('r', p.r);
      } else if (type === 'diamond') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          p.cx+','+(p.cy-p.h)+' '+(p.cx+p.w/2)+','+p.cy+' '+p.cx+','+(p.cy+p.h)+' '+(p.cx-p.w/2)+','+p.cy);
      } else if (type === 'hex') {
        const w=p.w/2, h=p.h/2;
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          p.cx+','+(p.cy-h)+' '+(p.cx+w)+','+(p.cy-h/2)+' '+
          (p.cx+w)+','+(p.cy+h/2)+' '+p.cx+','+(p.cy+h)+' '+
          (p.cx-w)+','+(p.cy+h/2)+' '+(p.cx-w)+','+(p.cy-h/2));
      } else if (type === 'rect') {
        el = document.createElementNS(ns, 'rect');
        el.setAttribute('x', p.cx-p.w/2); el.setAttribute('y', p.cy-p.h/2);
        el.setAttribute('width', p.w); el.setAttribute('height', p.h);
        el.setAttribute('rx', '5');
      }
      el.setAttribute('fill', fill); el.setAttribute('stroke', stroke);
      el.setAttribute('stroke-width', active ? '2' : '1.5');
      g.appendChild(el); svg.appendChild(g);
    };

    draw('tri-up',   'head',    { cx:180, cy:68,  w:36, h:20 });
    draw('tri-down', 'ajna',    { cx:180, cy:96,  w:36, h:18 });
    draw('circle',   'throat',  { cx:180, cy:148, r:14  });
    draw('diamond',  'gCenter', { cx:180, cy:198, w:38, h:28 });
    draw('tri-up',   'will',    { cx:228, cy:188, w:34, h:24 });
    draw('tri-up',   'solar',   { cx:235, cy:248, w:34, h:24 });
    draw('hex',      'sacral',  { cx:180, cy:258, w:44, h:30 });
    draw('tri-down', 'spleen',  { cx:132, cy:188, w:34, h:24 });
    draw('rect',     'root',    { cx:180, cy:318, w:52, h:22 });
  }
};
