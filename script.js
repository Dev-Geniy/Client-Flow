const grid = document.getElementById('client-grid');
const sidebar = document.getElementById('sidebar');
const modal = document.getElementById('client-modal');
const confirmModal = document.getElementById('confirm-delete-modal');
const notification = document.getElementById('notification');
let clients = [];
try {
  const storedClients = localStorage.getItem('clients');
  clients = storedClients ? JSON.parse(storedClients) : [];
} catch (error) {
  console.error('Ошибка при загрузке данных из localStorage:', error);
  clients = [];
  localStorage.setItem('clients', JSON.stringify(clients));
}
let chartInstance = null;
let deleteIndex = null;

// Панель
document.querySelector('.sidebar-handle').addEventListener('click', (e) => {
  e.stopPropagation();
  sidebar.classList.toggle('open');
  updateChart();
});

// Закрытие панели при клике вне её
document.addEventListener('click', (e) => {
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
    sidebar.classList.remove('open');
    updateChart();
  }
});

// Тема
const themeSwitch = document.getElementById('theme-switch');
themeSwitch.addEventListener('change', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateChart();
});
if (localStorage.getItem('theme') === 'dark') {
  themeSwitch.checked = true;
  document.body.classList.add('dark');
}

// Анимации
const animations = document.getElementById('animations');
animations.addEventListener('change', () => {
  document.body.style.transition = animations.checked ? 'all 0.3s ease' : 'none';
});

// Вид карточек
const cardLayout = document.getElementById('card-layout');
cardLayout.addEventListener('change', () => {
  renderClients(document.querySelector('.filter-btn.active').id.replace('filter-', ''));
  localStorage.setItem('cardLayout', cardLayout.value);
});
if (localStorage.getItem('cardLayout')) cardLayout.value = localStorage.getItem('cardLayout');

// Рендеринг клиентов
function renderClients(filter = 'all', tagFilter = '', dateFilter = '') {
  const fragment = document.createDocumentFragment();
  let filteredClients = clients.filter(c => 
    (filter === 'all' || c.status === filter || (filter === 'favorite' && c.favorite)) && 
    (!tagFilter || c.tags?.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()))) &&
    (!dateFilter || new Date(c.createdAt).toISOString().split('T')[0] === dateFilter)
  );

  filteredClients.forEach((client, index) => {
    const card = document.createElement('div');
    card.classList.add('client-card', client.status);
    if (client.favorite) card.classList.add('favorite');

    const progress = client.deadline ? calculateProgress(client.deadline) : null;

    if (cardLayout.value === 'compact') {
      card.classList.add('compact');
      card.innerHTML = `
        <h3>${client.name}</h3>
        ${client.company ? `<p>${client.company}</p>` : ''}
        ${client.tags?.length ? `<div class="tags"><span class="tag">#${client.tags[0]}</span></div>` : ''}
        <div class="actions">
          <button onclick="editClient(${index})" title="Редактировать клиента"><span class="material-icons">edit</span></button>
          <button onclick="showConfirmDelete(${index})" title="Удалить клиента"><span class="material-icons">delete</span></button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <h3>${client.name}</h3>
        ${client.company ? `<p>${client.company}</p>` : ''}
        ${client.image ? `<img src="${client.image}" alt="${client.name}">` : ''}
        ${client.social ? `<p><a href="${client.social}" target="_blank">${client.social.split('/').pop()}</a></p>` : ''}
        ${client.phones?.length ? client.phones.map(phone => `<p>${phone}</p>`).join('') : ''}
        ${client.tags?.length ? `<div class="tags">${client.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        ${client.notes ? `<pre class="notes">${escapeHtml(client.notes)}</pre>` : ''}
        ${progress !== null ? `<div class="deadline-progress ${progress >= 100 ? 'expired' : ''}" style="width: ${Math.min(progress, 100)}%;"></div>` : ''}
        <div class="status-indicator"></div>
        <div class="actions">
          <button onclick="editClient(${index})" title="Редактировать клиента"><span class="material-icons">edit</span></button>
          <button onclick="showConfirmDelete(${index})" title="Удалить клиента"><span class="material-icons">delete</span></button>
        </div>
      `;
    }
    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
  updateStats();
  updateChart();
}

renderClients();

// Drag-and-drop
new Sortable(grid, {
  animation: 150,
  onEnd: (evt) => {
    const moved = clients.splice(evt.oldIndex, 1)[0];
    clients.splice(evt.newIndex, 0, moved);
    try {
      localStorage.setItem('clients', JSON.stringify(clients));
    } catch (error) {
      console.error('Ошибка при сохранении данных в localStorage:', error);
      showNotification('Ошибка при сохранении данных');
    }
  }
});

// Добавление клиента
document.getElementById('add-client').addEventListener('click', () => {
  modal.style.display = 'flex';
  document.getElementById('client-form').reset();
  document.getElementById('phones-container').innerHTML = `
    <div class="phone-group">
      <input placeholder="Телефон" name="phone" autocomplete="tel">
      <button type="button" class="btn-add-phone" title="Добавить ещё телефон">+</button>
    </div>
  `;
  document.getElementById('client-form').dataset.index = '';
});

// Закрытие модалки
document.querySelector('#client-modal .close').addEventListener('click', () => modal.style.display = 'none');

// Динамическое добавление телефонов
document.getElementById('phones-container').addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-add-phone')) {
    const container = document.getElementById('phones-container');
    const newPhone = document.createElement('div');
    newPhone.classList.add('phone-group');
    newPhone.innerHTML = '<input placeholder="Телефон" name="phone" style="margin: 10px 0;" autocomplete="tel">';
    container.appendChild(newPhone);
  }
});

// Форма
document.getElementById('client-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const phones = Array.from(document.querySelectorAll('#phones-container input[name="phone"]'))
    .map(input => input.value)
    .filter(v => v);
  const data = {
    name: document.getElementById('name').value,
    company: document.getElementById('company').value,
    social: document.getElementById('social').value,
    website: document.getElementById('website').value,
    phones: phones,
    image: document.getElementById('image').value,
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
    deadline: document.getElementById('deadline').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    favorite: document.getElementById('favorite').checked,
    priority: document.getElementById('status').value === 'priority' ? 1 : 0,
    createdAt: new Date().toISOString()
  };

  const index = e.target.dataset.index;
  if (index !== '') clients[index] = data;
  else clients.push(data);

  clients.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  try {
    localStorage.setItem('clients', JSON.stringify(clients));
  } catch (error) {
    console.error('Ошибка при сохранении данных в localStorage:', error);
    showNotification('Ошибка при сохранении данных');
  }
  renderClients(document.querySelector('.filter-btn.active').id.replace('filter-', ''));
  modal.style.display = 'none';
  showNotification('Клиент сохранён');
});

// Редактирование
window.editClient = (index) => {
  modal.style.display = 'flex';
  const client = clients[index];
  document.getElementById('name').value = client.name;
  document.getElementById('company').value = client.company || '';
  document.getElementById('social').value = client.social;
  document.getElementById('website').value = client.website;
  const phonesContainer = document.getElementById('phones-container');
  phonesContainer.innerHTML = client.phones?.length ? client.phones.map((phone, i) => `
    <div class="phone-group">
      <input placeholder="Телефон" name="phone" value="${phone}" style="margin: 10px 0;" autocomplete="tel">
      ${i === 0 ? '<button type="button" class="btn-add-phone" title="Добавить ещё телефон">+</button>' : ''}
    </div>
  `).join('') : `
    <div class="phone-group">
      <input placeholder="Телефон" name="phone" autocomplete="tel">
      <button type="button" class="btn-add-phone" title="Добавить ещё телефон">+</button>
    </div>
  `;
  document.getElementById('image').value = client.image || '';
  document.getElementById('tags').value = client.tags?.join(', ') || '';
  document.getElementById('deadline').value = client.deadline || '';
  document.getElementById('status').value = client.status;
  document.getElementById('notes').value = client.notes;
  document.getElementById('favorite').checked = client.favorite || false;
  document.getElementById('client-form').dataset.index = index;
};

// Удаление с подтверждением
window.showConfirmDelete = (index) => {
  deleteIndex = index;
  confirmModal.style.display = 'flex';
};

document.getElementById('confirm-delete-cancel').addEventListener('click', () => {
  confirmModal.style.display = 'none';
  deleteIndex = null;
});

document.getElementById('confirm-delete-ok').addEventListener('click', () => {
  if (deleteIndex !== null) {
    clients.splice(deleteIndex, 1);
    try {
      localStorage.setItem('clients', JSON.stringify(clients));
    } catch (error) {
      console.error('Ошибка при сохранении данных в localStorage:', error);
      showNotification('Ошибка при сохранении данных');
    }
    renderClients(document.querySelector('.filter-btn.active').id.replace('filter-', ''));
    showNotification('Клиент удалён');
    confirmModal.style.display = 'none';
    deleteIndex = null;
  }
});

// Фильтры
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderClients(btn.id.replace('filter-', ''), document.getElementById('tag-filter').value, document.getElementById('date-filter').value);
  });
});

document.getElementById('tag-filter').addEventListener('input', (e) => {
  renderClients(document.querySelector('.filter-btn.active').id.replace('filter-', ''), e.target.value, document.getElementById('date-filter').value);
});

document.getElementById('date-filter').addEventListener('change', (e) => {
  renderClients(document.querySelector('.filter-btn.active').id.replace('filter-', ''), document.getElementById('tag-filter').value, e.target.value);
});

// Поиск
document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(query) || 
    (c.company && c.company.toLowerCase().includes(query))
  );
  const fragment = document.createDocumentFragment();
  filteredClients.forEach((client, index) => {
    const card = document.createElement('div');
    card.classList.add('client-card', client.status);
    if (client.favorite) card.classList.add('favorite');

    const progress = client.deadline ? calculateProgress(client.deadline) : null;

    if (cardLayout.value === 'compact') {
      card.classList.add('compact');
      card.innerHTML = `
        <h3>${client.name}</h3>
        ${client.company ? `<p>${client.company}</p>` : ''}
        ${client.tags?.length ? `<div class="tags"><span class="tag">#${client.tags[0]}</span></div>` : ''}
        <div class="actions">
          <button onclick="editClient(${index})" title="Редактировать клиента"><span class="material-icons">edit</span></button>
          <button onclick="showConfirmDelete(${index})" title="Удалить клиента"><span class="material-icons">delete</span></button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <h3>${client.name}</h3>
        ${client.company ? `<p>${client.company}</p>` : ''}
        ${client.image ? `<img src="${client.image}" alt="${client.name}">` : ''}
        ${client.social ? `<p><a href="${client.social}" target="_blank">${client.social.split('/').pop()}</a></p>` : ''}
        ${client.phones?.length ? client.phones.map(phone => `<p>${phone}</p>`).join('') : ''}
        ${client.tags?.length ? `<div class="tags">${client.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        ${client.notes ? `<pre class="notes">${escapeHtml(client.notes)}</pre>` : ''}
        ${progress !== null ? `<div class="deadline-progress ${progress >= 100 ? 'expired' : ''}" style="width: ${Math.min(progress, 100)}%;"></div>` : ''}
        <div class="status-indicator"></div>
        <div class="actions">
          <button onclick="editClient(${index})" title="Редактировать клиента"><span class="material-icons">edit</span></button>
          <button onclick="showConfirmDelete(${index})" title="Удалить клиента"><span class="material-icons">delete</span></button>
        </div>
      `;
    }
    fragment.appendChild(card);
  });

  grid.innerHTML = '';
  grid.appendChild(fragment);
  updateStats();
});

// Экспорт
document.getElementById('export-btn').addEventListener('click', () => {
  const escapeCsvValue = (value) => {
    if (!value) return '';
    return `"${value.replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
  };

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
    "Имя,Компания,Телефоны,Соцсеть,Сайт,Изображение,Теги,Дедлайн,Статус,Заметки,Избранный,Дата создания\n" +
    clients.map(c => [
      escapeCsvValue(c.name),
      escapeCsvValue(c.company),
      escapeCsvValue(c.phones?.join(';')),
      escapeCsvValue(c.social),
      escapeCsvValue(c.website),
      escapeCsvValue(c.image),
      escapeCsvValue(c.tags?.join(';')),
      escapeCsvValue(c.deadline),
      escapeCsvValue(c.status),
      escapeCsvValue(c.notes),
      c.favorite,
      escapeCsvValue(c.createdAt)
    ].join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'clients.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('Данные экспортированы');
});

// Импорт
document.getElementById('import-btn').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = [];
      let currentLine = '';
      let inQuotes = false;

      for (let char of text) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === '\n' && !inQuotes) {
          lines.push(currentLine);
          currentLine = '';
        } else {
          currentLine += char;
        }
      }
      if (currentLine) lines.push(currentLine);

      clients = lines.slice(1).map(line => {
        const fields = [];
        let currentField = '';
        let inQuotes = false;

        for (let char of line) {
          if (char === '"' && !inQuotes) {
            inQuotes = true;
          } else if (char === '"' && inQuotes) {
            inQuotes = false;
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
          } else {
            currentField += char;
          }
        }
        fields.push(currentField);

        const [name, company, phones, social, website, image, tags, deadline, status, notes, favorite, createdAt] = fields;
        return {
          name: name.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          company: company.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          phones: phones.replace(/^"|"$/g, '').replace(/""/g, '"').split(';').filter(p => p) || [],
          social: social.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          website: website.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          image: image.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          tags: tags.replace(/^"|"$/g, '').replace(/""/g, '"').split(';').filter(t => t) || [],
          deadline: deadline.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
          status: status.replace(/^"|"$/g, '').replace(/""/g, '"') || 'active',
          notes: notes.replace(/^"|"$/g, '').replace(/""/g, '"').replace(/\\n/g, '\n') || '',
          favorite: favorite === 'true',
          createdAt: createdAt.replace(/^"|"$/g, '').replace(/""/g, '"') || new Date().toISOString()
        };
      }).filter(c => c.name);

      try {
        localStorage.setItem('clients', JSON.stringify(clients));
      } catch (error) {
        console.error('Ошибка при сохранении данных в localStorage:', error);
        showNotification('Ошибка при сохранении данных');
      }
      renderClients();
      showNotification('Данные импортированы');
    };
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
});

// Отправка email
document.getElementById('send-email').addEventListener('click', () => {
  const email = document.getElementById('social').value.includes('@') ? document.getElementById('social').value : '';
  if (email) window.location.href = `mailto:${email}`;
});

// Добавить в календарь
document.getElementById('add-to-calendar').addEventListener('click', () => {
  const deadline = document.getElementById('deadline').value;
  const name = document.getElementById('name').value;
  if (deadline) {
    const date = new Date(deadline);
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&dates=${date.toISOString().replace(/-|:|\.\d\d\d/g, '')}/${date.toISOString().replace(/-|:|\.\d\d\d/g, '')}`;
    window.open(googleCalendarUrl, '_blank');
  }
});

// Статистика
function updateStats() {
  document.getElementById('total-clients').textContent = clients.length;
  document.getElementById('active-clients').textContent = clients.filter(c => c.status === 'active').length;
  document.getElementById('pending-tasks').textContent = clients.filter(c => c.status === 'priority').length;
  document.getElementById('favorites').textContent = clients.filter(c => c.favorite).length;
}

// Уведомления
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add('active');
  setTimeout(() => notification.classList.remove('active'), 2000);
}

// Прогресс-бар для дедлайнов
function calculateProgress(deadline) {
  const now = new Date();
  const due = new Date(deadline);
  const created = new Date(clients.find(c => c.deadline === deadline)?.createdAt || now);
  const total = due - created;
  const elapsed = now - created;
  return total > 0 ? Math.max(0, (elapsed / total) * 100) : 100;
}

// График роста клиентской базы
function updateChart() {
  const ctx = document.getElementById('client-growth-chart').getContext('2d');

  const monthlyData = {};
  clients.forEach(client => {
    const date = new Date(client.createdAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
  });

  const labels = Object.keys(monthlyData).sort();
  const data = labels.map(label => monthlyData[label]);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Новые клиенты',
        data: data,
        borderColor: document.body.classList.contains('dark') ? '#bb86fc' : '#7c4dff',
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: true, title: { display: true, text: 'Месяц' } },
        y: { beginAtZero: true, title: { display: true, text: 'Клиенты' } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Инициализация графика при загрузке
updateChart();

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker зарегистрирован'))
      .catch(err => console.error('Ошибка регистрации Service Worker:', err));
  });
}
