// ============================================================
// ephemeris.js — упрощённый расчёт позиций планет
// Используем алгоритм VSOP87 (упрощённая версия)
// Точность достаточна для определения типа Human Design
// ============================================================

const Ephemeris = {

  // Перевод даты в юлианский день
  toJulianDay: function(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const h = date.getUTCHours() + date.getUTCMinutes() / 60;

    let jd = 367 * y
      - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
      + Math.floor(275 * m / 9)
      + d + 1721013.5 + h / 24;
    return jd;
  },

  // Нормализация угла в диапазон 0-360
  norm360: function(angle) {
    return ((angle % 360) + 360) % 360;
  },

  // Позиция Солнца (эклиптическая долгота)
  sunLongitude: function(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
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
    const F = 93.2721 + 483202.0175 * T;
    const Frad = F * Math.PI / 180;
    const Lrad = L * Math.PI / 180;
    const corr = 6.2886 * Math.sin(Mrad)
      + 1.2740 * Math.sin(2 * Lrad - Mrad)
      + 0.6583 * Math.sin(2 * Lrad)
      + 0.2136 * Math.sin(2 * Mrad);
    return this.norm360(L + corr);
  },

  // Позиция планеты по упрощённой формуле
  planetLongitude: function(jd, L0, L1, M0, M1, C1, C2) {
    const T = (jd - 2451545.0) / 36525;
    const L = L0 + L1 * T;
    const M = M0 + M1 * T;
    const Mrad = M * Math.PI / 180;
    const C = C1 * Math.sin(Mrad) + C2 * Math.sin(2 * Mrad);
    return this.norm360(L + C);
  },

  // Позиции всех 9 планет Human Design
  getAllPlanets: function(date) {
    const jd = this.toJulianDay(date);

    return {
      sun:     this.sunLongitude(jd),
      moon:    this.moonLongitude(jd),
      mercury: this.planetLongitude(jd, 252.2509, 149472.6749, 174.7948, 149472.5153, 6.5526, 0.8500),
      venus:   this.planetLongitude(jd, 181.9798, 58517.8157, 212.2606, 58517.8036, 0.7758, 0.0033),
      mars:    this.planetLongitude(jd, 355.4330, 19140.2993, 19.3730, 19140.3030, 10.6912, 0.6228),
      jupiter: this.planetLongitude(jd, 34.3515,  3034.9057,  20.9275,  3034.9057,  5.5549, 0.1683),
      saturn:  this.planetLongitude(jd, 50.0774,  1222.1138,  317.021,  1222.1138,  6.3585, 0.2204),
      uranus:  this.planetLongitude(jd, 314.0550,  428.4665,  142.5905,  428.4665,  5.3042, 0.1534),
      neptune: this.planetLongitude(jd, 304.3487,  218.4862,  259.8835,  218.4862,  1.0302, 0.0118),
      pluto:   this.planetLongitude(jd, 238.9290,  145.2078,  14.8820,  145.2078,  28.3150, 4.3408)
    };
  },

  // Перевод эклиптической долготы в ворота Human Design (64 гексаграммы И-Цзин)
  // Порядок ворот по кругу зодиака — фиксированная таблица соответствий
  GATE_SEQUENCE: [
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2,  23, 8,  20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7,  4,  29, 59, 40, 64, 47, 6,  46, 18, 48, 57, 32, 50,
    28, 44, 1,  43, 14, 34, 9,  5,  26, 11, 10, 58, 38, 54, 61, 60
  ],

  // Получить ворота и линию по эклиптической долготе
  getGate: function(longitude) {
    const idx = Math.floor(longitude / (360 / 64));
    const gate = this.GATE_SEQUENCE[idx % 64];
    const linePos = (longitude % (360 / 64)) / (360 / 64);
    const line = Math.floor(linePos * 6) + 1;
    return { gate: gate, line: Math.min(line, 6) };
  },

  // Получить все ворота для набора планет
  getGatesForPlanets: function(planets) {
    const result = {};
    for (const [planet, longitude] of Object.entries(planets)) {
      result[planet] = this.getGate(longitude);
    }
    return result;
  },

  // Дата рождения минус 88 дней и 88 минут (дизайнная дата)
  getDesignDate: function(birthDate) {
    const ms = birthDate.getTime() - (88 * 24 * 60 * 60 * 1000) - (88 * 60 * 1000);
    return new Date(ms);
  }
};
