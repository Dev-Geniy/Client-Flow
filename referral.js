// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
  const isDark = localStorage.getItem('theme') === 'dark';
  document.body.classList.toggle('dark', isDark);
  document.getElementById('theme-switch').checked = isDark;
  document.getElementById('sidebar-theme-switch').checked = isDark;

  if (typeof firebase === 'undefined') {
    console.error('Firebase не инициализирован. Проверьте подключение Firebase SDK.');
    showNotification('Ошибка загрузки Firebase. Попробуйте позже.', 'error');
    return;
  }

  firebase.auth().signInAnonymously().then((userCredential) => {
    console.log('Успешная авторизация:', userCredential);
    initializeReferralProgram();
  }).catch((error) => {
    console.error('Ошибка авторизации:', error.code, error.message);
    showNotification(`Не удалось авторизоваться. Код ошибки: ${error.code}`, 'error');
  });
});

// Переключение темы
document.getElementById('theme-switch').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
  document.getElementById('sidebar-theme-switch').checked = e.target.checked;
});

document.getElementById('sidebar-theme-switch').addEventListener('change', (e) => {
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
  document.getElementById('theme-switch').checked = e.target.checked;
});

// Переключение боковой панели
const sidebar = document.getElementById('sidebar');
document.querySelector('.sidebar-handle').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  const isSidebarOpen = sidebar.classList.contains('open');
  const isClickInsideSidebar = sidebar.contains(e.target);
  const isClickOnHandle = e.target.closest('.sidebar-handle');
  if (isSidebarOpen && !isClickInsideSidebar && !isClickOnHandle) {
    sidebar.classList.remove('open');
  }
});

// Установка текущего года в футере
document.getElementById('current-year').textContent = new Date().getFullYear();

// Кнопка "Вернуться наверх"
document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Функции для модального окна
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const modalContent = modal.querySelector('.modal-content');
  modal.style.display = 'flex';
  modalContent.scrollTo({ top: 0, behavior: 'smooth' });
  modalContent.focus();
  trapFocus(modal);
}

function closeModal(modal) {
  modal.style.display = 'none';
}

document.querySelectorAll('.modal .close').forEach(closeBtn => {
  closeBtn.addEventListener('click', () => {
    closeModal(closeBtn.closest('.modal'));
  });
});

// Уведомления
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add('active');
  }, 10);
  setTimeout(() => {
    notification.classList.remove('active');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Ограничение фокуса в модальном окне
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

// Обработка форм "Оставить отзыв" и "Сообщить об ошибке"
document.getElementById('feedback-form').addEventListener('submit', (e) => {
  e.preventDefault();
  closeModal(document.getElementById('feedback-modal'));
  showNotification('Спасибо за ваш отзыв!');
  e.target.reset();
});

document.getElementById('bug-report-form').addEventListener('submit', (e) => {
  e.preventDefault();
  closeModal(document.getElementById('bug-report-modal'));
  showNotification('Спасибо за сообщение об ошибке!');
  e.target.reset();
});

// Генерация уникального реферального кода
function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Инициализация реферальной программы
function initializeReferralProgram() {
  let referralCode = localStorage.getItem('referralCode');
  if (!referralCode) {
    referralCode = generateReferralCode();
    localStorage.setItem('referralCode', referralCode);
  }

  // Устанавливаем реферальную ссылку в новом формате только для отображения
  const referralLinkInput = document.getElementById('referral-link');
  referralLinkInput.value = `https://dev-geniy.github.io/Client-Flow/referral.html?ref=${referralCode}`;

  const db = firebase.database();
  const referralRef = db.ref(`referrals/${referralCode}`);

  referralRef.on('value', (snapshot) => {
    const data = snapshot.val() || { clicks: 0, friends: 0, bonuses: 0, rewards: [], visitors: {} };
    localStorage.setItem(`referralStats_${referralCode}`, JSON.stringify(data));
    updateDashboard(data);
  }, (error) => {
    console.error('Ошибка чтения данных из Firebase:', error);
    showNotification('Не удалось загрузить статистику. Попробуйте позже.', 'error');
  });

  // Проверка перехода по реферальной ссылке (старый формат для Firebase)
  const urlPath = window.location.pathname.split('/').pop();
  const refCode = urlPath && urlPath !== 'referral.html' ? urlPath : null;
  if (refCode && refCode !== referralCode) {
    const visitorId = localStorage.getItem('visitorId') || generateReferralCode();
    localStorage.setItem('visitorId', visitorId);

    referralRef.child(`visitors/${visitorId}`).once('value', (snapshot) => {
      if (!snapshot.exists()) {
        referralRef.transaction((currentData) => {
          if (!currentData) {
            return { clicks: 1, friends: 0, bonuses: 0, rewards: [], visitors: { [visitorId]: true } };
          }
          currentData.clicks = (currentData.clicks || 0) + 1;
          currentData.visitors = currentData.visitors || {};
          currentData.visitors[visitorId] = true;
          return currentData;
        }, (error) => {
          if (error) {
            console.error('Ошибка транзакции (clicks):', error);
            showNotification('Не удалось записать данные. Попробуйте снова.', 'error');
          }
        });

        document.querySelector('.referral-section').insertAdjacentHTML('beforeend', `
          <div class="referral-card confirm-card">
            <h3>Подтвердите регистрацию</h3>
            <p>Вы перешли по реферальной ссылке! Подтвердите, чтобы ваш друг получил бонус.</p>
            <button class="btn gradient-btn confirm-btn" onclick="confirmReferral('${refCode}')">
              Подтвердить
            </button>
          </div>
        `);
        showNotification('Вы перешли по реферальной ссылке!');
      }
    }, (error) => {
      console.error('Ошибка проверки посетителя:', error);
      showNotification('Не удалось проверить данные. Попробуйте снова.', 'error');
    });
  }
}

// Подтверждение регистрации
function confirmReferral(refCode) {
  const db = firebase.database();
  const referralRef = db.ref(`referrals/${refCode}`);

  referralRef.transaction((currentData) => {
    if (!currentData) {
      return { clicks: 1, friends: 1, bonuses: 1, rewards: [], visitors: {} };
    }
    currentData.friends = (currentData.friends || 0) + 1;
    currentData.bonuses = (currentData.bonuses || 0) + 1;

    const friends = currentData.friends;
    const rewards = currentData.rewards || [];
    let bonusMessage = null;

    if (friends >= 25 && !rewards.includes('exclusive_theme')) {
      rewards.push('exclusive_theme');
      bonusMessage = 'Вы получили эксклюзивную тему оформления!';
    } else if (friends >= 20 && !rewards.includes('consultation')) {
      rewards.push('consultation');
      bonusMessage = 'Вы заработали бесплатную консультацию!';
    } else if (friends >= 15 && !rewards.includes('vip_status')) {
      rewards.push('vip_status');
      bonusMessage = 'Вы получили VIP-статус!';
    } else if (friends >= 10 && !rewards.includes('500_points')) {
      rewards.push('500_points');
      bonusMessage = 'Вы заработали 500 бонусных баллов!';
    } else if (friends >= 5 && !rewards.includes('year_subscription')) {
      rewards.push('year_subscription');
      bonusMessage = 'Вы заработали годовую подписку!';
    } else if (friends >= 3 && !rewards.includes('partner_badge')) {
      rewards.push('partner_badge');
      bonusMessage = 'Вы заработали значок "Партнёр"!';
    }

    if (Math.random() < 0.1 && !rewards.includes(`random_bonus_${friends}`)) {
      rewards.push(`random_bonus_${friends}`);
      currentData.bonuses += 0.33;
      bonusMessage = bonusMessage ? `${bonusMessage} И случайный бонус: +10 дней премиума!` : 'Вы получили случайный бонус: +10 дней премиума!';
    }

    currentData.rewards = rewards;

    if (bonusMessage) {
      const bonusModal = document.getElementById('bonus-modal');
      document.getElementById('bonus-message').textContent = bonusMessage;
      bonusModal.style.display = 'flex';
      trapFocus(bonusModal);
    }

    return currentData;
  }, (error) => {
    if (error) {
      console.error('Ошибка транзакции (confirmReferral):', error);
      showNotification('Не удалось начислить бонус. Попробуйте снова.', 'error');
    }
  });

  document.querySelector('.confirm-card').remove();
  showNotification('Спасибо за регистрацию! Ваш друг получил бонус.');
}

// Обновление дашборда с анимацией
function updateDashboard(stats) {
  const clicksCount = document.getElementById('clicks-count');
  const friendsCount = document.getElementById('friends-count');
  const progressToBonus = document.getElementById('progress-to-bonus');
  const progressFill = document.getElementById('progress-fill');
  const bonusesEarned = document.getElementById('bonuses-earned');
  const rewardsList = document.getElementById('rewards-list');

  animateValue(clicksCount, parseInt(clicksCount.textContent) || 0, stats.clicks, 500);
  animateValue(friendsCount, parseInt(friendsCount.textContent) || 0, stats.friends, 500);
  animateValue(bonusesEarned, parseInt(bonusesEarned.textContent) || 0, Math.floor(stats.bonuses * 30), 500, ' дней премиума');

  const friends = stats.friends;
  let nextLevel = 3;
  if (friends >= 25) nextLevel = Infinity;
  else if (friends >= 20) nextLevel = 25;
  else if (friends >= 15) nextLevel = 20;
  else if (friends >= 10) nextLevel = 15;
  else if (friends >= 5) nextLevel = 10;
  else if (friends >= 3) nextLevel = 5;

  const friendsRemaining = Math.max(0, nextLevel - friends);
  progressToBonus.textContent = nextLevel === Infinity ? 'Все бонусы получены!' : `${friendsRemaining} ${friendsRemaining === 1 ? 'друг' : 'друзей'}`;

  const progressPercentage = nextLevel === Infinity ? 100 : (friends / nextLevel) * 100;
  progressFill.style.width = `${Math.min(progressPercentage, 100)}%`;

  rewardsList.innerHTML = '';
  const rewards = stats.rewards || [];
  if (rewards.length === 0) {
    rewardsList.innerHTML = '<li>Пока нет наград. Приглашайте друзей!</li>';
  } else {
    rewards.forEach(reward => {
      let rewardText = '';
      if (reward === 'exclusive_theme') rewardText = 'Эксклюзивная тема оформления (25 друзей)';
      else if (reward === 'consultation') rewardText = 'Бесплатная консультация (20 друзей)';
      else if (reward === 'vip_status') rewardText = 'VIP-статус (15 друзей)';
      else if (reward === '500_points') rewardText = '500 бонусных баллов (10 друзей)';
      else if (reward === 'year_subscription') rewardText = 'Годовая подписка (5 друзей)';
      else if (reward === 'partner_badge') rewardText = 'Значок "Партнёр" (3 друга)';
      else if (reward.startsWith('random_bonus')) rewardText = 'Случайный бонус: +10 дней премиума';
      rewardsList.innerHTML += `<li>${rewardText}</li>`;
    });
  }
}

// Анимация для счётчиков
function animateValue(element, start, end, duration, suffix = '') {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Функция копирования реферальной ссылки (новый формат)
function copyReferralLink() {
  const referralCode = localStorage.getItem('referralCode');
  const referralLink = `https://dev-geniy.github.io/Client-Flow/referral.html?ref=${referralCode}`;
  navigator.clipboard.writeText(referralLink).then(() => {
    showNotification('Ссылка скопирована!');
  }).catch(err => {
    console.error('Ошибка копирования:', err);
    showNotification('Не удалось скопировать ссылку.', 'error');
  });
}

// Функция шаринга реферальной ссылки (новый формат)
function shareReferralLink() {
  const referralCode = localStorage.getItem('referralCode');
  const referralLink = `https://dev-geniy.github.io/Client-Flow/referral.html?ref=${referralCode}`;
  const shareText = 'Присоединяйтесь к Client Flow и управляйте клиентами легко! Используйте мою реферальную ссылку: ' + referralLink;

  if (navigator.share) {
    navigator.share({
      title: 'Приглашение в Client Flow',
      text: shareText,
      url: referralLink
    }).then(() => {
      showNotification('Ссылка успешно отправлена!');
    }).catch(err => {
      console.error('Ошибка шаринга:', err);
      showNotification('Не удалось поделиться ссылкой. Скопируйте её вручную.', 'error');
      copyReferralLink();
    });
  } else {
    copyReferralLink();
    showNotification('Ссылка скопирована! Поделитесь ею вручную.');
  }
}

// Функция сброса статистики
function resetStats() {
  const referralCode = localStorage.getItem('referralCode');
  if (referralCode) {
    const db = firebase.database();
    db.ref(`referrals/${referralCode}`).remove()
      .then(() => {
        localStorage.removeItem(`referralStats_${referralCode}`);
        initializeReferralProgram();
        showNotification('Статистика сброшена!');
      })
      .catch((error) => {
        console.error('Ошибка сброса статистики:', error);
        showNotification('Не удалось сбросить статистику. Попробуйте снова.', 'error');
      });
  }
}

// Функция генерации новой реферальной ссылки
function generateNewReferralLink() {
  const newCode = generateReferralCode();
  const oldCode = localStorage.getItem('referralCode');
  if (oldCode) {
    const db = firebase.database();
    db.ref(`referrals/${oldCode}`).remove()
      .then(() => {
        localStorage.setItem('referralCode', newCode);
        localStorage.removeItem(`referralStats_${oldCode}`); // Исправлено на oldCode
        initializeReferralProgram();
        showNotification('Новая реферальная ссылка сгенерирована!');
      })
      .catch((error) => {
        console.error('Ошибка генерации новой ссылки:', error);
        showNotification('Не удалось сгенерировать новую ссылку. Попробуйте снова.', 'error');
      });
  } else {
    localStorage.setItem('referralCode', newCode);
    initializeReferralProgram();
    showNotification('Новая реферальная ссылка сгенерирована!');
  }
}

// Добавляем кнопку "Сгенерировать новую ссылку"
document.addEventListener('DOMContentLoaded', () => {
  const referralLinkContainer = document.querySelector('.referral-link');
  if (referralLinkContainer) {
    referralLinkContainer.insertAdjacentHTML('afterend', `
      <button class="btn gradient-btn generate-new-link-btn" onclick="generateNewReferralLink()" aria-label="Сгенерировать новую ссылку">
        <span class="material-icons">refresh</span> Новая ссылка
      </button>
    `);
  }
});

// Закрытие модального окна для бонусов
document.querySelector('#bonus-modal .close').addEventListener('click', () => {
  closeModal(document.getElementById('bonus-modal'));
});
