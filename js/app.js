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

// Показать/скрыть спиннер
function showSpinner(show) {
  var spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = show ? 'flex' : 'none';
}

async function calculate() {
  var name = document.getElementById('input-name').value.trim() || 'Пользователь';

  if (!selectedDay || !selectedMonth || !selectedYear) {
    alert('Пожалуйста, выбери дату рождения');
    return;
  }

  // Показываем спиннер
  showSpinner(true);

  try {
    // Инициализируем Swiss Ephemeris если ещё не загружен
    await Ephemeris.init();

   // Пользователь вводит местное время — переводим в UTC
var utcDate = new Date(Date.UTC(selectedYear, selectedMonth-1, selectedDay, selectedHour, selectedMin, 0));

    var result = Bodygraph.calculate(utcDate);
    console.log('Активные центры:', JSON.stringify(result.activeCenters));
console.log('Активные ворота:', Array.from(result.activeGates).sort((a,b)=>a-b).join(', '));
    showResult(name, result);
    showScreen('screen-result');
  } catch(e) {
    console.error('Ошибка расчёта:', e);
    alert('Ошибка расчёта. Проверь подключение к интернету.');
  } finally {
    showSpinner(false);
  }
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
    return '<div class="rec-item"><span class="rec-icon">'+(icons[i]||'✦')+'</span><p>'+r+'</p></div>';
  }).join('');

  if (tip) {
    html += '<div class="rec-item"><span class="rec-icon">📌</span>' +
      '<p><strong>Профиль '+result.profile.code+':</strong> '+tip+'</p></div>';
  }

  document.getElementById('rec-text').innerHTML = html;
  Bodygraph.drawSVG(result);
}

// ---- Рекомендации ----
var RECOMMENDATIONS = {
  'Генератор': [
    'Твоя сила — в реакции. Не начинай первым, жди когда жизнь позовёт тебя.',
    'Занимайся только тем, что вызывает внутренний отклик.',
    'Ложись спать только когда устал физически.',
    'Задавай себе вопросы на которые можно ответить да или нет.'
  ],
  'Манифестирующий Генератор': [
    'Ты можешь делать несколько дел одновременно — это твоя суперсила.',
    'Реагируй на возможности, затем сообщай окружающим о своих намерениях.',
    'Пробовать и менять направление — нормально для тебя.',
    'Пропускай лишние шаги. Твоя интуиция видит короткий путь.'
  ],
  'Проектор': [
    'Ты создан чтобы видеть суть в людях и процессах.',
    'Жди приглашения прежде чем давать советы.',
    'Ложись спать до наступления усталости.',
    'Специализируйся — твоё признание приходит через глубокое знание.'
  ],
  'Манифестор': [
    'Ты рождён начинать. Информируй тех, кого это затронет.',
    'Тебе нужна свобода и независимость.',
    'Ложись спать раньше других, даже если не устал.',
    'Следи за гневом — это сигнал что тебя ограничивают.'
  ],
  'Рефлектор': [
    'Не принимай важных решений в моменте. Жди 28 дней.',
    'Окружение имеет для тебя решающее значение.',
    'Ты видишь мир объективно — это твой дар.',
    'Выходи на природу — она помогает очиститься от чужих энергий.'
  ]
};

var PROFILE_TIPS = {
  '1': 'Исследователь — тебе важна прочная база.',
  '2': 'Отшельник — не игнорируй потребность в уединении.',
  '3': 'Мученик — ты учишься через ошибки.',
  '4': 'Оппортунист — твои возможности приходят через людей.',
  '5': 'Еретик — другие видят в тебе решение своих проблем.',
  '6': 'Ролевая модель — после 50 ты становишься образцом для других.'
};

// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js');
  });
}
