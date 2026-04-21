// Переключение экранов
function showScreen(id) {
  document.querySelectorAll('[id^="screen-"]').forEach(function(screen) {
    screen.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// Главная функция расчёта
function calculate() {
  var name = document.getElementById('input-name').value.trim() || 'Пользователь';
  var city = document.getElementById('input-city').value.trim();

  // Берём дату и время из барабана
  var day   = selectedDay;
  var month = selectedMonth;
  var year  = selectedYear;
  var hour  = selectedHour;
  var min   = selectedMin;

  // Проверка
  if (!day || !month || !year) {
    alert('Пожалуйста, выбери дату рождения');
    return;
  }

  // Собираем дату
  var birthDate = new Date(Date.UTC(year, month - 1, day, hour, min, 0));

  // Запускаем расчёт Human Design
  var result = Bodygraph.calculate(birthDate);

  // Показываем результат
  showResult(name, result);
  showScreen('screen-result');
}

// Заполняем экран результата
function showResult(name, result) {
  document.getElementById('res-name').textContent     = name;
  document.getElementById('res-type').textContent     = result.type;
  document.getElementById('res-strategy').textContent = result.strategy;
  document.getElementById('res-profile').textContent  = result.profile.code + ' — ' + result.profile.name;

  // Рекомендации
  var recs = RECOMMENDATIONS[result.type] || RECOMMENDATIONS['Генератор'];
  var persLine = String(result.profile.persLine);
  var profileTip = PROFILE_TIPS[persLine] || '';

  var html = recs.map(function(r) {
    return '<div class="rec-item"><span class="rec-icon">' + r.icon + '</span><p>' + r.text + '</p></div>';
  }).join('');

  if (profileTip) {
    html += '<div class="rec-item"><span class="rec-icon">📌</span><p><strong>Профиль ' +
      result.profile.code + ':</strong> ' + profileTip + '</p></div>';
  }

  document.getElementById('rec-text').innerHTML = html;
}

// ---- Рекомендации по типам ----
var RECOMMENDATIONS = {
  'Генератор': [
    { icon: '⚡', text: 'Твоя сила — в реакции. Не начинай первым, жди когда жизнь позовёт тебя. Физический отклик в теле важнее умственного решения.' },
    { icon: '🔋', text: 'Занимайся только тем, что вызывает внутренний отклик. Работа без удовлетворения истощает сакральный центр.' },
    { icon: '🌙', text: 'Ложись спать только когда устал физически. Усталость без полного расслабления тела не даёт восстановиться.' },
    { icon: '🎯', text: 'Задавай себе вопросы на которые можно ответить "да" или "нет". Тело знает ответ раньше головы.' }
  ],
  'Манифестирующий Генератор': [
    { icon: '⚡', text: 'Ты можешь делать несколько дел одновременно — это твоя суперсила, а не разбросанность.' },
    { icon: '🚀', text: 'Реагируй на возможности, затем сообщай окружающим о своих намерениях. Это снизит сопротивление.' },
    { icon: '🔄', text: 'Пробовать и менять направление — нормально для тебя. Ты учишься через опыт, не через теорию.' },
    { icon: '💡', text: 'Пропускай лишние шаги в процессах. Твоя интуиция видит короткий путь — доверяй ей.' }
  ],
  'Проектор': [
    { icon: '👁', text: 'Ты создан чтобы видеть суть в людях и процессах. Не трать энергию на тех, кто не просит твоего руководства.' },
    { icon: '✉️', text: 'Жди приглашения прежде чем давать советы. Непрошеный совет — даже гениальный — не будет услышан.' },
    { icon: '😴', text: 'Ложись спать до наступления усталости. Ты поглощаешь чужую энергию за день и нуждаешься в тишине.' },
    { icon: '🏆', text: 'Твоё признание приходит через глубокое знание. Специализируйся, изучай одну тему так, чтобы стать незаменимым.' }
  ],
  'Манифестор': [
    { icon: '🔥', text: 'Ты рождён начинать. Но прежде чем действовать — информируй тех, кого это затронет.' },
    { icon: '🕊', text: 'Тебе нужна свобода и независимость. Не позволяй другим управлять твоим расписанием без необходимости.' },
    { icon: '💤', text: 'Ложись спать раньше других, даже если не устал. Твоему телу нужен изолированный отдых.' },
    { icon: '⚠️', text: 'Следи за гневом — это сигнал что тебя контролируют или ограничивают.' }
  ],
  'Рефлектор': [
    { icon: '🌕', text: 'Не принимай важных решений в моменте. Подожди полный лунный цикл (28 дней) — картина прояснится.' },
    { icon: '🌍', text: 'Ты зеркало мира вокруг. Окружение имеет для тебя решающее значение — выбирай людей и места осознанно.' },
    { icon: '🔮', text: 'У тебя нет постоянных центров. Это дар — ты видишь мир объективно, без фиксированных фильтров.' },
    { icon: '🌿', text: 'Выходи на природу регулярно. Тишина и одиночество помогают очиститься от чужих энергий.' }
  ]
};

// ---- Профильные рекомендации ----
var PROFILE_TIPS = {
  '1': 'Исследователь — тебе важна прочная база. Изучи тему до конца прежде чем действовать.',
  '2': 'Отшельник — тебе нужно время в одиночестве. Не игнорируй потребность в уединении.',
  '3': 'Мученик — ты учишься через ошибки. Каждый провал это данные, а не поражение.',
  '4': 'Оппортунист — твои возможности приходят через людей. Инвестируй в отношения.',
  '5': 'Еретик — другие видят в тебе решение своих проблем. Управляй ожиданиями.',
  '6': 'Ролевая модель — твоя жизнь делится на три фазы. До 30 ты экспериментируешь, до 50 наблюдаешь, после 50 становишься образцом для других.'
};

// PWA: регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js');
  });
}
