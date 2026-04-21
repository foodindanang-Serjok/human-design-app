// ============================================================
// ephemeris.js — расчёт позиций планет через таблицу эфемерид
// Данные: planets_table.js (1920-2050, шаг 1 день, точность 0.1°)
// ============================================================

const Ephemeris = {

  // Инициализация — просто заглушка для совместимости
  init: async function() { return; },

  norm360: function(a) { return ((a % 360) + 360) % 360; },

  // Получить позиции всех планет по дате
  getAllPlanets: function(date) {
    const jd = this._toJD(date);
    const idx = this._jdToIdx(jd);
    const frac = (jd - (EPH_START_JD + idx * EPH_STEP)) / EPH_STEP;

    const NAMES = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
    const result = {};

    for (let p = 0; p < 10; p++) {
      let val = ephGet(p, idx);
      // Линейная интерполяция между днями для точности
      if (idx < EPH_ROWS - 1) {
        const next = ephGet(p, idx + 1);
        let diff = next - val;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        val = this.norm360(val + diff * frac);
      }
      result[NAMES[p]] = val;
    }
    return result;
  },

  // Юлианский день
  _toJD: function(date) {
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const h = date.getUTCHours() + date.getUTCMinutes() / 60;
    if (m <= 2) { y--; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + h / 24 + B - 1524.5;
  },

  // Индекс в таблице
  _jdToIdx: function(jd) {
    const idx = Math.floor((jd - EPH_START_JD) / EPH_STEP);
    return Math.max(0, Math.min(idx, EPH_ROWS - 2));
  },

  // ============================================================
  // Точная таблица ворот HD по градусам зодиака
  // ============================================================
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

  // Дата дизайна = Солнце на 88° раньше
  getDesignDate: function(birthDate) {
    const birthPlanets = this.getAllPlanets(birthDate);
    const birthSun = birthPlanets.sun;
    const targetSun = this.norm360(birthSun - 88);

    // Бинарный поиск
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
