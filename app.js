// ============================================================
// app.js — логика интерфейса и рекомендации по саморазвитию
// ============================================================

// ---- Навигация между экранами ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  var screen = document.getElementById(id);
  if (screen) {
    screen.classList.add('active');
    window.scrollTo(0, 0);
  }
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
    { icon: '🔄', text: 'Пробовать и "бросать" — нормально для тебя. Ты учишься через опыт, не через теорию.' },
    { icon: '💡', text: 'Пропускай лишние шаги в процессах. Твоя интуиция видит короткий путь — доверяй ей.' }
  ],
  'Проектор': [
    { icon: '👁', text: 'Ты создан чтобы видеть суть в людях и процессах. Не трать энергию на тех, кто не просит твоего руководства.' },
    { icon: '✉️', text: 'Жди приглашения прежде чем давать советы. Непрошеный совет — даже гениальный — не будет услышан.' },
    { icon: '😴', text: 'Ложись спать до наступления усталости. Ты поглощаешь чужую энергию за день и нуждаешься в тишине для разгрузки.' },
    { icon: '🏆', text: 'Твоё признание приходит через глубокое знание. Специализируйся, изучай одну тему так, чтобы стать незаменимым.' }
  ],
  'Манифестор': [
    { icon: '🔥', text: 'Ты рождён начинать. Но прежде чем действовать — информируй тех, кого это затронет. Это снимает сопротивление.' },
    { icon: '🕊', text: 'Тебе нужна свобода и независимость. Не позволяй другим управлять твоим расписанием без необходимости.' },
    { icon: '💤', text: 'Ложись спать раньше других, даже если не устал. Твоему телу нужен изолированный отдых — отдельная кровать или комната.' },
    { icon: '⚠️', text: 'Следи за гневом — это сигнал что тебя контролируют или ограничивают. Это не дефект, это навигация.' }
  ],
  'Рефлектор': [
    { icon: '🌕', text: 'Не принимай важных решений в моменте. Подожди полный лунный цикл (28 дней) — картина прояснится.' },
    { icon: '🌍', text: 'Ты зеркало мира вокруг. Окружение имеет для тебя решающее значение — выбирай людей и места осознанно.' },
    { icon: '🔮', text: 'У тебя нет постоянных центров. Это дар — ты видишь мир объективно, без фиксированных фильтров.' },
    { icon: '🌿', text: 'Выходи на природу регулярно. Тишина и одиночество помогают тебе очиститься от чужих энергий.' }
  ]
};

// ---- Профильные рекомендации ----
var PROFILE_TIPS = {
  '1': 'Тебе важна прочная база — изучи тему до конца, прежде чем действовать.',
  '2': 'Тебе нужно время в одиночестве. Не игнорируй потребность в уединении.',
  '3': 'Ты учишься через ошибки — каждый провал это данные, а не поражение.',
  '4': 'Твои возможности приходят через людей. Инвестируй в отношения.',
  '5': 'Другие видят в тебе решение своих проблем. Управляй ожиданиями.',
  '6': 'Твоя жизнь делится на три фазы. После 50 ты становишься образцом для других.'
};

// ---- Расчёт ----
function calculate() {
  var name   = document.getElementById('input-name').value.trim() || 'Пользователь';
  var date   = document.getElementById('input-date').value;
  var time   = document.getElementById('input-time').value || '12:00';

  if (!date) {
    alert('Пожалуйста, укажи дату рождения');
    return;
  }

  var birthDate = new Date(date + 'T' + time + ':00Z');

  // Расчёт
  var result = Bodygraph.calculate(birthDate);

  // Заполняем UI
  document.getElementById('result-name').textContent = name;
  document.getElementById('result-type').textContent = result.type;
  document.getElementById('res-type').textContent      = result.type;
  document.getElementById('res-strategy').textContent  = result.strategy;
  document.getElementById('res-authority').textContent = result.authority;
  document.getElementById('res-profile').textContent   = result.profile.code + ' — ' + result.profile.name;

  // Рисуем бодиграф
  Bodygraph.drawSVG(result);

  // Рекомендации
  var recs     = RECOMMENDATIONS[result.type] || RECOMMENDATIONS['Генератор'];
  var persLine = String(result.profile.persLine);
  var profileTip = PROFILE_TIPS[persLine] || '';

  var recHtml = recs.map(function(r) {
    return '<div class="rec-item"><span class="rec-icon">' + r.icon + '</span><p>' + r.text + '</p></div>';
  }).join('');

  if (profileTip) {
    recHtml += '<div class="rec-item"><span class="rec-icon">📌</span><p><strong>Профиль ' + result.profile.code + ':</strong> ' + profileTip + '</p></div>';
  }

  document.getElementById('rec-text').innerHTML = recHtml;

  showScreen('screen-result');
}

// ---- PWA: регистрация Service Worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(reg) {
      console.log('Service Worker зарегистрирован:', reg.scope);
    }).catch(function(err) {
      console.log('Ошибка SW:', err);
    });
  });
}
