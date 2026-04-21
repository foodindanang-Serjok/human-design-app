// ============================================================
// app.js — логика приложения
// ============================================================

function showScreen(id) {
  document.querySelectorAll('[id^="screen-"]').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function calculate() {
  var name = document.getElementById('input-name').value.trim() || 'Пользователь';
  var city = document.getElementById('input-city').value.trim();

  if (!selectedDay || !selectedMonth || !selectedYear) {
    alert('Пожалуйста, выбери дату рождения');
    return;
  }

  // Учитываем часовой пояс браузера (пользователь вводит местное время)
  var localDate = new Date(selectedYear, selectedMonth - 1, selectedDay, selectedHour, selectedMin, 0);
  var utcDate   = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);

  var result = Bodygraph.calculate(utcDate);
  showResult(name, result);
  showScreen('screen-result');
}

function showResult(name, result) {
  document.getElementById('res-name').textContent      = name;
  document.getElementById('res-type').textContent      = result.type;
  document.getElementById('res-strategy').textContent  = result.strategy;
  document.getElementById('res-authority').textContent = result.authority;
  document.getElementById('res-profile').textContent   =
    result.profile.code + ' — ' + result.profile.name;

  var recs     = RECOMMENDATIONS[result.type] || RECOMMENDATIONS['Генератор'];
  var persLine = String(result.profile.persLine);
  var tip      = PROFILE_TIPS[persLine] || '';
  var icons    = ['⚡','🎯','🌙','💡'];

  var html = recs.map(function(r, i) {
    return '<div class="rec-item"><span class="rec-icon">' +
      (icons[i] || '✦') + '</span><p>' + r + '</p></div>';
  }).join('');

  if (tip) {
    html += '<div class="rec-item"><span class="rec-icon">📌</span>' +
      '<p><strong>Профиль ' + result.profile.code + ':</strong> ' + tip + '</p></div>';
  }

  document.getElementById('rec-text').innerHTML = html;
}

// ---- Рекомендации по типам ----
var RECOMMENDATIONS = {
  'Генератор': [
    'Твоя сила — в реакции. Не начинай первым, жди когда жизнь позовёт тебя. Физический отклик в теле важнее умственного решения.',
    'Занимайся только тем, что вызывает внутренний отклик. Работа без удовлетворения истощает сакральный центр.',
    'Ложись спать только когда устал физически. Тело знает когда оно готово к отдыху.',
    'Задавай себе вопросы на которые можно ответить да или нет. Тело знает ответ раньше головы.'
  ],
  'Манифестирующий Генератор': [
    'Ты можешь делать несколько дел одновременно — это твоя суперсила, а не разбросанность.',
    'Реагируй на возможности, затем сообщай окружающим о своих намерениях. Это снизит сопротивление.',
    'Пробовать и менять направление — нормально для тебя. Ты учишься через опыт, не через теорию.',
    'Пропускай лишние шаги в процессах. Твоя интуиция видит короткий путь — доверяй ей.'
  ],
  'Проектор': [
    'Ты создан чтобы видеть суть в людях и процессах. Не трать энергию на тех, кто не просит твоего руководства.',
    'Жди приглашения прежде чем давать советы. Непрошеный совет — даже гениальный — не будет услышан.',
    'Ложись спать до наступления усталости. Ты поглощаешь чужую энергию за день и нуждаешься в тишине.',
    'Твоё признание приходит через глубокое знание. Специализируйся, изучай одну тему так, чтобы стать незаменимым.'
  ],
  'Манифестор': [
    'Ты рождён начинать. Но прежде чем действовать — информируй тех, кого это затронет.',
    'Тебе нужна свобода и независимость. Не позволяй другим управлять твоим расписанием без необходимости.',
    'Ложись спать раньше других, даже если не устал. Твоему телу нужен изолированный отдых.',
    'Следи за гневом — это сигнал что тебя контролируют или ограничивают.'
  ],
  'Рефлектор': [
    'Не принимай важных решений в моменте. Подожди полный лунный цикл (28 дней) — картина прояснится.',
    'Ты зеркало мира вокруг. Окружение имеет для тебя решающее значение — выбирай людей и места осознанно.',
    'У тебя нет постоянных центров. Это дар — ты видишь мир объективно, без фиксированных фильтров.',
    'Выходи на природу регулярно. Тишина и одиночество помогают очиститься от чужих энергий.'
  ]
};

var PROFILE_TIPS = {
  '1': 'Исследователь — тебе важна прочная база. Изучи тему до конца прежде чем действовать.',
  '2': 'Отшельник — тебе нужно время в одиночестве. Не игнорируй потребность в уединении.',
  '3': 'Мученик — ты учишься через ошибки. Каждый провал это данные, а не поражение.',
  '4': 'Оппортунист — твои возможности приходят через людей. Инвестируй в отношения.',
  '5': 'Еретик — другие видят в тебе решение своих проблем. Управляй ожиданиями.',
  '6': 'Ролевая модель — твоя жизнь делится на три фазы. До 30 экспериментируешь, до 50 наблюдаешь, после 50 становишься образцом для других.'
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js');
  });
}
