// ============================================================
// ephemeris.js — Swiss Ephemeris через динамический import
// ============================================================

const Ephemeris = {

  swe: null,
  ready: false,
  initPromise: null,

  init: async function() {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const mod = await import('./swisseph.js');
        const SwissEph = mod.default;
        this.swe = new SwissEph();
        await this.swe.initSwissEph();
        this.ready = true;
        console.log('Swiss Ephemeris загружен!');
      } catch(e) {
        console.warn('Swiss Ephemeris недоступен, используем упрощённый расчёт:', e.message);
        this.ready = false;
      }
    })();

    return this.initPromise;
  },

  norm360: function(a) {
    return ((a % 360) + 360) % 360;
  },

  // Позиции планет через Swiss Ephemeris или fallback
  getAllPlanets: function(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const h = date.getUTCHours() + date.getUTCMinutes() / 60;

    if (this.ready && this.swe) {
      return this._getPlanetsSWE(y, m, d, h);
    } else {
      return this._getPlanetsFallback(date);
    }
  },

  _getPlanetsSWE: function(y, m, d, h) {
    const swe = this.swe;
    const jd = swe.julday(y, m, d, h);
    const PLANET_IDS = { sun:0, moon:1, mercury:2, venus:3, mars:4,
                         jupiter:5, saturn:6, uranus:7, neptune:8, pluto:9 };
    const result = {};
    for (const [name, id] of Object.entries(PLANET_IDS)) {
      try {
        const pos = swe.calc_ut(jd, id, 2);
        result[name] = this.norm360(pos[0]);
      } catch(e) {
        result[name] = 0;
      }
    }
    return result;
  },

  // Fallback — упрощённый алгоритм
  _getPlanetsFallback: function(date) {
    const jd = this._toJD(date);
    const T = (jd - 2451545.0) / 36525;
    const norm = this.norm360.bind(this);
    const pl = (L0,L1,M0,M1,C1,C2) => {
      const L=L0+L1*T, M=M0+M1*T, Mrad=M*Math.PI/180;
      return norm(L + C1*Math.sin(Mrad) + C2*Math.sin(2*Mrad));
    };
    const L0=280.46646+36000.76983*T;
    const M=357.52911+35999.05029*T;
    const Mrad=M*Math.PI/180;
    const C=(1.914602-0.004817*T)*Math.sin(Mrad)+(0.019993-0.000101*T)*Math.sin(2*Mrad);
    const sun=norm(L0+C);
    const moonL=218.3165+481267.8813*T;
    const moonM=134.9634+477198.8676*T;
    const moonMrad=moonM*Math.PI/180;
    const moonLrad=moonL*Math.PI/180;
    const moon=norm(moonL+6.2886*Math.sin(moonMrad)+1.274*Math.sin(2*moonLrad-moonMrad));
    return {
      sun, moon,
      mercury: pl(252.2509,149472.6749,174.7948,149472.5153,6.5526,0.85),
      venus:   pl(181.9798,58517.8157,212.2606,58517.8036,0.7758,0.0033),
      mars:    pl(355.433,19140.2993,19.373,19140.303,10.6912,0.6228),
      jupiter: pl(34.3515,3034.9057,20.9275,3034.9057,5.5549,0.1683),
      saturn:  pl(50.0774,1222.1138,317.021,1222.1138,6.3585,0.2204),
      uranus:  pl(314.055,428.4665,142.5905,428.4665,5.3042,0.1534),
      neptune: pl(304.3487,218.4862,259.8835,218.4862,1.0302,0.0118),
      pluto:   pl(238.929,145.2078,14.882,145.2078,28.315,4.3408)
    };
  },

  _toJD: function(date) {
    const y=date.getUTCFullYear(), m=date.getUTCMonth()+1;
    const d=date.getUTCDate(), h=date.getUTCHours()+date.getUTCMinutes()/60;
    return 367*y-Math.floor(7*(y+Math.floor((m+9)/12))/4)+Math.floor(275*m/9)+d+1721013.5+h/24;
  },

  // Точная таблица ворот HD
  GATE_TABLE: [
    [17,3.875],[21,9.5],[51,15.125],[42,20.75],[3,26.375],
    [27,32],[24,37.625],[2,43.25],[23,48.875],[8,54.5],
    [20,60.125],[16,65.75],[35,71.375],[45,77],[12,82.625],
    [15,88.25],[52,93.875],[39,99.5],[53,105.125],[62,110.75],
    [56,116.375],[31,122],[33,127.625],[7,133.25],[4,138.875],
    [29,144.5],[59,150.125],[40,155.75],[64,161.375],[47,167],
    [6,172.625],[46,178.25],[18,183.875],[48,189.5],[57,195.125],
    [32,200.75],[50,206.375],[28,212],[44,217.625],[1,223.25],
    [43,228.875],[14,234.5],[34,240.125],[9,245.75],[5,251.375],
    [26,257],[11,262.625],[10,268.25],[58,273.875],[38,279.5],
    [54,285.125],[61,290.75],[60,296.375],[41,302],[19,307.625],
    [13,313.25],[49,318.875],[30,324.5],[55,330.125],[37,335.75],
    [63,341.375],[22,347],[36,352.625],[25,358.25]
  ],

  getGate: function(longitude) {
    const lon = this.norm360(longitude);
    const table = this.GATE_TABLE;
    let idx = table.length - 1;
    for (let i = 0; i < table.length - 1; i++) {
      if (lon >= table[i][1] && lon < table[i+1][1]) { idx = i; break; }
    }
    if (lon >= 358.25 || lon < 3.875) idx = table.length - 1;
    const gate = table[idx][0];
    let pos = lon - table[idx][1];
    if (pos < 0) pos += 360;
    return { gate, line: Math.min(Math.floor(pos / 0.9375) + 1, 6) };
  },

  getGatesForPlanets: function(planets) {
    const result = {};
    for (const [name, lon] of Object.entries(planets)) {
      result[name] = this.getGate(lon);
    }
    return result;
  },

  getDesignDate: function(birthDate) {
    // Получаем позицию Солнца при рождении
    const birthPlanets = this.getAllPlanets(birthDate);
    const birthSun = birthPlanets.sun;
    const targetSun = this.norm360(birthSun - 88);

    // Бинарный поиск даты когда Солнце было на 88° раньше
    let lo = new Date(birthDate.getTime() - 95 * 86400000);
    let hi = new Date(birthDate.getTime() - 80 * 86400000);

    for (let i = 0; i < 50; i++) {
      const mid = new Date((lo.getTime() + hi.getTime()) / 2);
      const sunMid = this.getAllPlanets(mid).sun;
      let diff = sunMid - targetSun;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      if (diff > 0) hi = mid; else lo = mid;
    }

    return new Date((lo.getTime() + hi.getTime()) / 2);
  }
};
