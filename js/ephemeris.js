// ============================================================
// ephemeris.js — точный расчёт позиций планет для Human Design
// Алгоритм: VSOP87 упрощённый + точная таблица ворот HD
// Дата дизайна = 88 градусов Солнца назад (не 88 дней!)
// ============================================================

const Ephemeris = {

  // Перевод даты в юлианский день
  toJulianDay: function(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const h = date.getUTCHours() + date.getUTCMinutes() / 60;
    return 367*y - Math.floor(7*(y+Math.floor((m+9)/12))/4)
      + Math.floor(275*m/9) + d + 1721013.5 + h/24;
  },

  // Нормализация угла 0-360
  norm360: function(a) {
    return ((a % 360) + 360) % 360;
  },

  // Позиция Солнца (эклиптическая долгота)
  sunLongitude: function(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T;
    const M  = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mrad = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
      + 0.000289 * Math.sin(3 * Mrad);
    return this.norm360(L0 + C);
  },

  // Позиция Луны
  moonLongitude: function(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L = 218.3165 + 481267.8813 * T;
    const M = 134.9634 + 477198.8676 * T;
    const Mrad = M * Math.PI / 180;
    const Lrad = L * Math.PI / 180;
    const corr = 6.2886 * Math.sin(Mrad)
      + 1.2740 * Math.sin(2 * Lrad - Mrad)
      + 0.6583 * Math.sin(2 * Lrad)
      + 0.2136 * Math.sin(2 * Mrad);
    return this.norm360(L + corr);
  },

  // Позиция планеты
  planetLongitude: function(jd, L0, L1, M0, M1, C1, C2) {
    const T = (jd - 2451545.0) / 36525;
    const L = L0 + L1 * T;
    const M = M0 + M1 * T;
    const Mrad = M * Math.PI / 180;
    const C = C1 * Math.sin(Mrad) + C2 * Math.sin(2 * Mrad);
    return this.norm360(L + C);
  },

  // Все планеты Human Design
  getAllPlanets: function(date) {
    const jd = this.toJulianDay(date);
    return {
      sun:     this.sunLongitude(jd),
      moon:    this.moonLongitude(jd),
      mercury: this.planetLongitude(jd, 252.2509, 149472.6749, 174.7948, 149472.5153, 6.5526, 0.8500),
      venus:   this.planetLongitude(jd, 181.9798,  58517.8157, 212.2606,  58517.8036, 0.7758, 0.0033),
      mars:    this.planetLongitude(jd, 355.4330,  19140.2993,  19.3730,  19140.3030,10.6912, 0.6228),
      jupiter: this.planetLongitude(jd,  34.3515,   3034.9057,  20.9275,   3034.9057, 5.5549, 0.1683),
      saturn:  this.planetLongitude(jd,  50.0774,   1222.1138, 317.0210,   1222.1138, 6.3585, 0.2204),
      uranus:  this.planetLongitude(jd, 314.0550,    428.4665, 142.5905,    428.4665, 5.3042, 0.1534),
      neptune: this.planetLongitude(jd, 304.3487,    218.4862, 259.8835,    218.4862, 1.0302, 0.0118),
      pluto:   this.planetLongitude(jd, 238.9290,    145.2078,  14.8820,    145.2078,28.3150, 4.3408)
    };
  },

  // ============================================================
  // ТОЧНАЯ ТАБЛИЦА ВОРОТ HD по градусам зодиака
  // Источник: официальная система Human Design (Ra Uru Hu)
  // Формат: [номер ворот, начальный градус (0=0°Овна)]
  // ============================================================
  GATE_TABLE: [
    [17,  3.875], [21,  9.500], [51, 15.125], [42, 20.750], [3,  26.375],
    [27, 32.000], [24, 37.625], [2,  43.250], [23, 48.875], [8,  54.500],
    [20, 60.125], [16, 65.750], [35, 71.375], [45, 77.000], [12, 82.625],
    [15, 88.250], [52, 93.875], [39, 99.500], [53,105.125], [62,110.750],
    [56,116.375], [31,122.000], [33,127.625], [7, 133.250], [4, 138.875],
    [29,144.500], [59,150.125], [40,155.750], [64,161.375], [47,167.000],
    [6, 172.625], [46,178.250], [18,183.875], [48,189.500], [57,195.125],
    [32,200.750], [50,206.375], [28,212.000], [44,217.625], [1, 223.250],
    [43,228.875], [14,234.500], [34,240.125], [9, 245.750], [5, 251.375],
    [26,257.000], [11,262.625], [10,268.250], [58,273.875], [38,279.500],
    [54,285.125], [61,290.750], [60,296.375], [41,302.000], [19,307.625],
    [13,313.250], [49,318.875], [30,324.500], [55,330.125], [37,335.750],
    [63,341.375], [22,347.000], [36,352.625], [25,358.250]
  ],

  // Получить ворота и линию по эклиптической долготе
  getGate: function(longitude) {
    const lon = this.norm360(longitude);
    const table = this.GATE_TABLE;
    let idx = table.length - 1; // default: ворота 25 (358.25 - 3.875)

    for (let i = 0; i < table.length - 1; i++) {
      if (lon >= table[i][1] && lon < table[i+1][1]) {
        idx = i;
        break;
      }
    }
    // Ворота 25 охватывают 358.25° - 3.875° (переход через 0°)
    if (lon >= 358.250 || lon < 3.875) {
      idx = table.length - 1;
    }

    const gate     = table[idx][0];
    const start    = table[idx][1];
    const lineSize = 5.625 / 6; // 0.9375° на линию

    let posInGate = lon - start;
    if (posInGate < 0) posInGate += 360;

    const line = Math.min(Math.floor(posInGate / lineSize) + 1, 6);
    return { gate: gate, line: line };
  },

  // Ворота для набора планет
  getGatesForPlanets: function(planets) {
    const result = {};
    for (const [planet, longitude] of Object.entries(planets)) {
      result[planet] = this.getGate(longitude);
    }
    return result;
  },

  // ============================================================
  // ДАТА ДИЗАЙНА = позиция когда Солнце было на 88° раньше
  // Это НЕ 88 календарных дней — используем бинарный поиск!
  // ============================================================
  getDesignDate: function(birthDate) {
    const birthJD    = this.toJulianDay(birthDate);
    const birthSun   = this.sunLongitude(birthJD);
    const targetSun  = this.norm360(birthSun - 88);

    // Бинарный поиск: ищем JD когда Солнце было в targetSun
    let lo = birthJD - 95;
    let hi = birthJD - 80;

    for (let i = 0; i < 60; i++) {
      const mid    = (lo + hi) / 2;
      const sunMid = this.sunLongitude(mid);

      let diff = sunMid - targetSun;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;

      if (diff > 0) hi = mid;
      else          lo = mid;
    }

    const designJD = (lo + hi) / 2;
    const ms = (designJD - 2440587.5) * 86400000;
    return new Date(ms);
  }
};
