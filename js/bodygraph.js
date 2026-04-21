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
    head:    { gates:[64,61,63],                    name:'Голова' },
    ajna:    { gates:[47,24,4,17,43,11],            name:'Аджна' },
    throat:  { gates:[62,23,56,35,12,45,33,8,31,20,16], name:'Горло' },
    gCenter: { gates:[1,2,7,10,13,15,25,46],        name:'G-центр' },
    will:    { gates:[21,26,40,51],                 name:'Воля' },
    solar:   { gates:[30,36,22,37,55,49,6],         name:'Солн.сплет.' },
    sacral:  { gates:[5,14,29,59,9,3,42,27,34],     name:'Сакральный' },
    spleen:  { gates:[48,57,44,50,32,28,18],        name:'Селезёнка' },
    root:    { gates:[53,60,52,19,39,41,58,38,54],  name:'Корень' }
  },

  LINES: {
    1:'Исследователь', 2:'Отшельник', 3:'Мученик',
    4:'Оппортунист',   5:'Еретик',    6:'Ролевая модель'
  },

  PROFILES: {
    '1/3':'Исследователь / Мученик',   '1/4':'Исследователь / Оппортунист',
    '2/4':'Отшельник / Оппортунист',   '2/5':'Отшельник / Еретик',
    '3/5':'Мученик / Еретик',          '3/6':'Мученик / Ролевая модель',
    '4/6':'Оппортунист / Ролевая модель','4/1':'Оппортунист / Исследователь',
    '5/1':'Еретик / Исследователь',    '5/2':'Еретик / Отшельник',
    '6/2':'Ролевая модель / Отшельник','6/3':'Ролевая модель / Мученик'
  },

  getActiveGates: function(pg, dg) {
    const a = new Set();
    for (const p of Object.values(pg)) a.add(p.gate);
    for (const p of Object.values(dg)) a.add(p.gate);
    return a;
  },

  getActiveCenters: function(ag) {
    const ac = {};
    for (const [k, c] of Object.entries(this.CENTERS))
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
  // SVG бодиграф
  // ============================================================
  drawSVG: function(result) {
    const svg = document.getElementById('bodygraph-svg');
    if (!svg) return;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 360 460');

    // Координаты центров
    const C = {
      head:    { x:180, y:45,  w:60, h:48, s:'tri-up'   },
      ajna:    { x:180, y:110, w:60, h:48, s:'tri-down' },
      throat:  { x:180, y:178, w:84, h:38, s:'rect'     },
      gCenter: { x:180, y:248, w:58, h:58, s:'diamond'  },
      will:    { x:268, y:225, w:50, h:42, s:'tri-up'   },
      solar:   { x:268, y:308, w:54, h:46, s:'tri-up'   },
      sacral:  { x:180, y:325, w:84, h:38, s:'rect'     },
      spleen:  { x:92,  y:225, w:50, h:42, s:'tri-down' },
      root:    { x:180, y:408, w:84, h:38, s:'rect'     }
    };

    // Каналы
    const CONN = [
      ['head','ajna'],['ajna','throat'],['throat','gCenter'],
      ['gCenter','sacral'],['sacral','root'],
      ['throat','will'],['will','gCenter'],
      ['throat','spleen'],['spleen','gCenter'],
      ['solar','sacral'],['solar','spleen'],
      ['root','solar'],['root','spleen']
    ];

    const ns = 'http://www.w3.org/2000/svg';

    // Рисуем линии каналов
    CONN.forEach(([a,b]) => {
      const ca = C[a], cb = C[b];
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', ca.x); ln.setAttribute('y1', ca.y);
      ln.setAttribute('x2', cb.x); ln.setAttribute('y2', cb.y);
      ln.setAttribute('stroke', 'rgba(255,215,0,0.18)');
      ln.setAttribute('stroke-width', '5');
      ln.setAttribute('stroke-linecap', 'round');
      svg.appendChild(ln);
    });

    // Названия центров
    const NAMES = {
      head:'Голова', ajna:'Аджна', throat:'Горло',
      gCenter:'G', will:'Воля', solar:'Солн.',
      sacral:'Сакральный', spleen:'Селезёнка', root:'Корень'
    };

    // Рисуем центры
    Object.entries(C).forEach(([key, c]) => {
      const active = result.activeCenters[key];
      const fill   = active ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.05)';
      const stroke = active ? '#ffd700' : 'rgba(255,215,0,0.22)';
      const tc     = active ? '#1a0e00' : 'rgba(255,255,255,0.32)';
      const hw = c.w/2, hh = c.h/2;
      const g = document.createElementNS(ns, 'g');
      let el;

      if (c.s === 'rect') {
        el = document.createElementNS(ns, 'rect');
        el.setAttribute('x', c.x-hw); el.setAttribute('y', c.y-hh);
        el.setAttribute('width', c.w); el.setAttribute('height', c.h);
        el.setAttribute('rx', '8');
      } else if (c.s === 'diamond') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          c.x+','+(c.y-hw)+' '+(c.x+hw)+','+c.y+' '+c.x+','+(c.y+hw)+' '+(c.x-hw)+','+c.y);
      } else if (c.s === 'tri-up') {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          c.x+','+(c.y-hh)+' '+(c.x+hw)+','+(c.y+hh)+' '+(c.x-hw)+','+(c.y+hh));
      } else {
        el = document.createElementNS(ns, 'polygon');
        el.setAttribute('points',
          c.x+','+(c.y+hh)+' '+(c.x+hw)+','+(c.y-hh)+' '+(c.x-hw)+','+(c.y-hh));
      }

      el.setAttribute('fill', fill);
      el.setAttribute('stroke', stroke);
      el.setAttribute('stroke-width', '1.5');
      g.appendChild(el);

      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', c.x);
      t.setAttribute('y', c.y + 4);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('font-size', key === 'sacral' || key === 'spleen' ? '8' : '9');
      t.setAttribute('fill', tc);
      t.setAttribute('font-family', 'sans-serif');
      t.setAttribute('font-weight', active ? '700' : '400');
      t.textContent = NAMES[key];
      g.appendChild(t);
      svg.appendChild(g);
    });
  }
};
