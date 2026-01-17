// В начале файла admin.js добавляем:

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
function checkAdminAuth() {
    // Проверяем сессию админа
    const adminSession = localStorage.getItem('fame_admin_session');
    if (!adminSession) {
        alert('Сессия админа не активна. Пожалуйста, войдите через основную панель.');
        window.close();
        return;
    }
    
    const userData = localStorage.getItem('fame_user');
    if (userData) {
        try {
            currentAdmin = JSON.parse(userData);
            if (!currentAdmin.isAdmin) {
                alert('Доступ запрещен! Требуются права администратора.');
                window.close();
                return;
            }
            document.getElementById('admin-username').textContent = currentAdmin.username;
        } catch (e) {
            console.error('Ошибка парсинга данных администратора:', e);
            redirectToLogin();
        }
    } else {
        redirectToLogin();
    }
}

// ==================== ВЫХОД ИЗ АДМИН-ПАНЕЛИ ====================
function adminLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('fame_admin_session');
        window.close();
    }
}

// Обновляем функцию logout в основном script.js:
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        currentUser = null;
        localStorage.removeItem('fame_user');
        localStorage.removeItem('fame_admin_session');
        updateUIForAuth();
        showNotification('Вы вышли из системы');
        
        // Закрываем админ-панель если она открыта
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage('admin_logout', '*');
        }
    }
}
// ==================== КОНСТАНТЫ И ПЕРЕМЕННЫЕ ====================
let currentAdmin = null;
let applications = [];
let members = [];
let users = [];
let currentFilter = 'all';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ-панель загружается...');
    
    // Проверка авторизации админа
    checkAdminAuth();
    
    // Загрузка данных
    loadData();
    
    // Инициализация интерфейса
    initAdminUI();
    
    // Инициализация модальных окон
    initModals();
    
    // Обновляем счетчики
    updateCounters();
    
    console.log('Админ-панель готова');
});

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
function checkAdminAuth() {
    const userData = localStorage.getItem('fame_user');
    if (userData) {
        try {
            currentAdmin = JSON.parse(userData);
            if (!currentAdmin.isAdmin) {
                alert('Доступ запрещен! Требуются права администратора.');
                window.location.href = '../index.html';
                return;
            }
            document.getElementById('admin-username').textContent = currentAdmin.username;
        } catch (e) {
            console.error('Ошибка парсинга данных администратора:', e);
            redirectToLogin();
        }
    } else {
        redirectToLogin();
    }
}

function redirectToLogin() {
    alert('Требуется авторизация администратора');
    window.location.href = '../index.html';
}

function adminLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('fame_user');
        window.location.href = '../index.html';
    }
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadData() {
    // Загрузка заявок
    applications = JSON.parse(localStorage.getItem('fame_applications') || '[]');
    
    // Загрузка участников
    members = JSON.parse(localStorage.getItem('fame_members') || '[]');
    
    // Загрузка пользователей
    users = JSON.parse(localStorage.getItem('fame_users') || '[]');
    
    console.log('Данные загружены:', {
        applications: applications.length,
        members: members.length,
        users: users.length
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ====================
function initAdminUI() {
    // Навигация по секциям
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.dataset.section + '-section';
            
            // Обновляем активный пункт меню
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем выбранную секцию
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
            
            // Загружаем данные для секции
            switch (sectionId) {
                case 'applications-section':
                    loadApplications();
                    break;
                case 'members-section':
                    loadMembersTable();
                    break;
                case 'users-section':
                    loadUsersTable();
                    break;
            }
        });
    });
    
    // Фильтрация заявок
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.status;
            loadApplications();
        });
    });
    
    // Кнопка добавления участника
    document.getElementById('add-member-btn')?.addEventListener('click', function() {
        openMemberModal();
    });
    
    // Кнопка сохранения участника
    document.getElementById('save-member-btn')?.addEventListener('click', saveMember);
    
    // Импорт данных
    document.getElementById('import-file')?.addEventListener('change', importData);
}

// ==================== ОБНОВЛЕНИЕ СЧЕТЧИКОВ ====================
function updateCounters() {
    // Счетчик заявок (только ожидающие)
    const pendingApps = applications.filter(app => app.status === 'pending').length;
    document.getElementById('applications-count').textContent = pendingApps || '0';
    
    // Счетчик участников
    document.getElementById('members-count').textContent = members.length || '0';
    
    // Счетчик пользователей
    document.getElementById('users-count').textContent = users.length || '0';
}

// ==================== РАБОТА С ЗАЯВКАМИ ====================
function loadApplications() {
    const container = document.getElementById('applications-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Фильтрация заявок
    let filteredApplications = applications;
    if (currentFilter !== 'all') {
        filteredApplications = applications.filter(app => app.status === currentFilter);
    }
    
    // Сортировка по дате (новые сверху)
    filteredApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filteredApplications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>Нет заявок по выбранному фильтру</p>
            </div>
        `;
        return;
    }
    
    // Отображение заявок
    filteredApplications.forEach(application => {
        const card = createApplicationCard(application);
        container.appendChild(card);
    });
}

function createApplicationCard(application) {
    const card = document.createElement('div');
    card.className = 'application-card';
    card.dataset.id = application.id;
    
    // Форматирование даты
    const createdDate = new Date(application.createdAt);
    const formattedDate = createdDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Определение цвета статуса
    const statusColors = {
        'pending': 'status-pending',
        'review': 'status-review',
        'accepted': 'status-accepted',
        'rejected': 'status-rejected'
    };
    
    const statusTexts = {
        'pending': 'Ожидает',
        'review': 'На рассмотрении',
        'accepted': 'Принята',
        'rejected': 'Отклонена'
    };
    
    // Создание ссылок
    let linksHtml = '';
    if (application.links && application.links.length > 0) {
        linksHtml = '<ul class="links-list">';
        application.links.forEach(link => {
            if (link.trim()) {
                linksHtml += `<li><a href="${link}" target="_blank">${link}</a></li>`;
            }
        });
        linksHtml += '</ul>';
    }
    
    card.innerHTML = `
        <div class="application-header">
            <div class="application-user">
                <div class="application-avatar" style="background: ${getColorFromString(application.nickname)}">
                    ${application.nickname.charAt(0).toUpperCase()}
                </div>
                <div class="application-info">
                    <h3>${application.nickname}</h3>
                    <p>@${application.username} • ${formattedDate}</p>
                    <p>Категория: <strong>${application.category}</strong></p>
                </div>
            </div>
            <div class="application-status ${statusColors[application.status]}">
                ${statusTexts[application.status]}
            </div>
        </div>
        
        <div class="application-details">
            <p><strong>Telegram:</strong> ${application.telegram}</p>
            <p><strong>Описание:</strong> ${application.description}</p>
            ${linksHtml ? `<p><strong>Ссылки:</strong></p>${linksHtml}` : ''}
        </div>
        
        <div class="application-actions">
            <button class="btn-view" onclick="viewApplication(${application.id})">
                <i class="fas fa-eye"></i> Просмотр
            </button>
            
            ${application.status === 'pending' || application.status === 'review' ? `
                <button class="btn-accept" onclick="acceptApplication(${application.id})">
                    <i class="fas fa-check"></i> Принять
                </button>
                <button class="btn-reject" onclick="rejectApplicationPrompt(${application.id})">
                    <i class="fas fa-times"></i> Отклонить
                </button>
            ` : ''}
            
            ${application.status === 'accepted' ? `
                <button class="btn-edit" onclick="editMemberFromApplication(${application.id})">
                    <i class="fas fa-user-edit"></i> Редактировать
                </button>
            ` : ''}
            
            <button class="btn-delete" onclick="deleteApplication(${application.id})">
                <i class="fas fa-trash"></i> Удалить
            </button>
        </div>
    `;
    
    return card;
}

function viewApplication(applicationId) {
    const application = applications.find(app => app.id == applicationId);
    if (!application) return;
    
    const modal = document.getElementById('application-modal');
    const details = document.getElementById('application-details');
    const actions = document.getElementById('application-actions');
    
    // Форматирование даты
    const createdDate = new Date(application.createdAt);
    const formattedDate = createdDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let reviewedInfo = '';
    if (application.reviewedAt) {
        const reviewedDate = new Date(application.reviewedAt);
        const formattedReviewedDate = reviewedDate.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        reviewedInfo = `
            <div class="application-detail-item">
                <h4><i class="fas fa-user-check"></i> Рассмотрена</h4>
                <p>${formattedReviewedDate} • ${application.reviewedBy || 'Администратор'}</p>
            </div>
        `;
    }
    
    let rejectionReason = '';
    if (application.rejectionReason) {
        rejectionReason = `
            <div class="rejection-reason">
                <h4><i class="fas fa-times-circle"></i> Причина отказа</h4>
                <p>${application.rejectionReason}</p>
            </div>
        `;
    }
    
    // Создание ссылок
    let linksHtml = '';
    if (application.links && application.links.length > 0) {
        linksHtml = '<ul class="links-list">';
        application.links.forEach(link => {
            if (link.trim()) {
                linksHtml += `<li><a href="${link}" target="_blank">${link}</a></li>`;
            }
        });
        linksHtml += '</ul>';
    }
    
    details.innerHTML = `
        <div class="application-detail-item">
            <h4><i class="fas fa-user"></i> Основная информация</h4>
            <p><strong>Никнейм:</strong> ${application.nickname}</p>
            <p><strong>Пользователь:</strong> ${application.username}</p>
            <p><strong>Telegram:</strong> ${application.telegram}</p>
            <p><strong>Категория:</strong> ${application.category}</p>
        </div>
        
        <div class="application-detail-item">
            <h4><i class="fas fa-file-alt"></i> Описание</h4>
            <p>${application.description}</p>
        </div>
        
        ${linksHtml ? `
            <div class="application-detail-item">
                <h4><i class="fas fa-link"></i> Ссылки</h4>
                ${linksHtml}
            </div>
        ` : ''}
        
        <div class="application-detail-item">
            <h4><i class="fas fa-info-circle"></i> Детали заявки</h4>
            <p><strong>Статус:</strong> ${getStatusText(application.status)}</p>
            <p><strong>Создана:</strong> ${formattedDate}</p>
        </div>
        
        ${reviewedInfo}
        ${rejectionReason}
    `;
    
    // Кнопки действий
    actions.innerHTML = '';
    if (application.status === 'pending' || application.status === 'review') {
        actions.innerHTML = `
            <button class="btn-accept" onclick="acceptApplication(${application.id})">
                <i class="fas fa-check"></i> Принять заявку
            </button>
            <button class="btn-reject" onclick="rejectApplicationPrompt(${application.id})">
                <i class="fas fa-times"></i> Отклонить заявку
            </button>
            <button class="btn-cancel close-modal">Закрыть</button>
        `;
    } else {
        actions.innerHTML = `
            <button class="btn-cancel close-modal">Закрыть</button>
        `;
    }
    
    modal.classList.add('active');
}

function acceptApplication(applicationId) {
    if (!confirm('Принять эту заявку? Пользователь будет добавлен в список участников.')) {
        return;
    }
    
    const application = applications.find(app => app.id == applicationId);
    if (!application) return;
    
    // Обновляем статус заявки
    application.status = 'accepted';
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = currentAdmin.username;
    
    // Сохраняем изменения
    localStorage.setItem('fame_applications', JSON.stringify(applications));
    
    // Добавляем пользователя в участники
    const newMember = window.opener?.addMemberFromApplication?.(application) || addMemberFromApplication(application);
    
    // Уведомление пользователя (в реальном приложении здесь была бы отправка уведомления)
    createNotificationForUser(application.userId, 'Ваша заявка была принята! Вы добавлены в список участников.');
    
    // Обновляем интерфейс
    loadApplications();
    updateCounters();
    closeModal(document.getElementById('application-modal'));
    
    alert('Заявка принята! Пользователь добавлен в участники.');
}

function rejectApplicationPrompt(applicationId) {
    const reason = prompt('Укажите причину отказа (оставьте пустым для отказа без причины):');
    if (reason === null) return; // Пользователь нажал отмена
    
    rejectApplication(applicationId, reason || 'Без указания причины');
}

function rejectApplication(applicationId, reason) {
    const application = applications.find(app => app.id == applicationId);
    if (!application) return;
    
    // Обновляем статус заявки
    application.status = 'rejected';
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = currentAdmin.username;
    application.rejectionReason = reason;
    
    // Сохраняем изменения
    localStorage.setItem('fame_applications', JSON.stringify(applications));
    
    // Уведомление пользователя
    createNotificationForUser(application.userId, `Ваша заявка была отклонена. Причина: ${reason}`);
    
    // Обновляем интерфейс
    loadApplications();
    updateCounters();
    closeModal(document.getElementById('application-modal'));
    
    alert('Заявка отклонена.');
}

function deleteApplication(applicationId) {
    if (!confirm('Удалить эту заявку? Это действие нельзя отменить.')) {
        return;
    }
    
    applications = applications.filter(app => app.id != applicationId);
    localStorage.setItem('fame_applications', JSON.stringify(applications));
    
    loadApplications();
    updateCounters();
    alert('Заявка удалена.');
}

// ==================== РАБОТА С УЧАСТНИКАМИ ====================
function loadMembersTable() {
    const tbody = document.getElementById('members-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (members.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #888;">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>Нет участников</p>
                </td>
            </tr>
        `;
        return;
    }
    
    members.forEach(member => {
        const row = createMemberRow(member);
        tbody.appendChild(row);
    });
}

function createMemberRow(member) {
    const row = document.createElement('tr');
    
    // Форматирование даты
    const joinDate = new Date(member.joinDate);
    const formattedDate = joinDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Определение статусов
    const statusBadges = [];
    if (member.verified) statusBadges.push('<span class="status-badge" style="background: rgba(0,170,0,0.1); color: #0f0; border: 1px solid #0f0;">✓</span>');
    if (member.pinned) statusBadges.push('<span class="status-badge" style="background: rgba(170,85,0,0.1); color: #fa0; border: 1px solid #fa0;">📍</span>');
    if (member.scam) statusBadges.push('<span class="status-badge" style="background: rgba(255,50,50,0.1); color: #ff4444; border: 1px solid #ff4444;">⚠️</span>');
    
    row.innerHTML = `
        <td>${member.id}</td>
        <td>
            <div class="member-avatar" style="background: ${getColorFromString(member.nickname)}">
                ${member.nickname.charAt(0).toUpperCase()}
            </div>
        </td>
        <td>
            <strong>${member.nickname}</strong><br>
            <small style="color: #888;">${member.username}</small>
        </td>
        <td>${member.category}</td>
        <td>${statusBadges.join(' ')}</td>
        <td>${formattedDate}</td>
        <td>
            <button class="btn-edit" onclick="editMember(${member.id})" title="Редактировать">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" onclick="deleteMember(${member.id})" title="Удалить">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function openMemberModal(member = null) {
    const modal = document.getElementById('member-modal');
    const form = document.getElementById('member-form');
    
    if (member) {
        // Редактирование существующего участника
        document.getElementById('member-id').value = member.id;
        document.getElementById('edit-nickname').value = member.nickname;
        document.getElementById('edit-username').value = member.username;
        document.getElementById('edit-category').value = member.category;
        document.getElementById('edit-description').value = member.description || '';
        document.getElementById('edit-verified').checked = member.verified || false;
        document.getElementById('edit-pinned').checked = member.pinned || false;
        document.getElementById('edit-scam').checked = member.scam || false;
    } else {
        // Добавление нового участника
        form.reset();
        document.getElementById('member-id').value = '';
    }
    
    modal.classList.add('active');
}

function editMember(memberId) {
    const member = members.find(m => m.id == memberId);
    if (member) {
        openMemberModal(member);
    }
}

function editMemberFromApplication(applicationId) {
    const application = applications.find(app => app.id == applicationId);
    if (!application) return;
    
    // Ищем соответствующего участника
    const member = members.find(m => m.username === application.telegram || m.nickname === application.nickname);
    if (member) {
        openMemberModal(member);
    } else {
        alert('Участник не найден');
    }
}

function saveMember() {
    const memberId = document.getElementById('member-id').value;
    const nickname = document.getElementById('edit-nickname').value.trim();
    const username = document.getElementById('edit-username').value.trim();
    const category = document.getElementById('edit-category').value;
    const description = document.getElementById('edit-description').value.trim();
    const verified = document.getElementById('edit-verified').checked;
    const pinned = document.getElementById('edit-pinned').checked;
    const scam = document.getElementById('edit-scam').checked;
    
    if (!nickname || !username || !category) {
        alert('Заполните обязательные поля');
        return;
    }
    
    if (memberId) {
        // Обновление существующего участника
        const index = members.findIndex(m => m.id == memberId);
        if (index !== -1) {
            members[index] = {
                ...members[index],
                nickname,
                username,
                category,
                description,
                verified,
                pinned,
                scam
            };
        }
    } else {
        // Добавление нового участника
        const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
        const newMember = {
            id: newId,
            nickname,
            username,
            category,
            role: category,
            description,
            avatar: `img/avatar${newId}.png`,
            verified,
            pinned,
            scam,
            joinDate: new Date().toISOString().split('T')[0],
            activity: "Постоянная",
            details: description,
            skills: ["Добавлен администратором"],
            socials: {
                telegram: username.replace('@', '')
            }
        };
        members.push(newMember);
    }
    
    // Сохраняем изменения
    localStorage.setItem('fame_members', JSON.stringify(members));
    
    // Обновляем интерфейс
    loadMembersTable();
    updateCounters();
    closeModal(document.getElementById('member-modal'));
    
    alert('Изменения сохранены!');
    
    // Обновляем главную страницу, если она открыта
    if (window.opener) {
        window.opener.location.reload();
    }
}

function deleteMember(memberId) {
    if (!confirm('Удалить этого участника? Это действие нельзя отменить.')) {
        return;
    }
    
    members = members.filter(m => m.id != memberId);
    localStorage.setItem('fame_members', JSON.stringify(members));
    
    loadMembersTable();
    updateCounters();
    alert('Участник удален.');
    
    // Обновляем главную страницу, если она открыта
    if (window.opener) {
        window.opener.location.reload();
    }
}

// ==================== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ ====================
function loadUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #888;">
                    <i class="fas fa-user-cog" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>Нет пользователей</p>
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const row = document.createElement('tr');
    
    // Форматирование даты
    const joinDate = new Date(user.createdAt);
    const formattedDate = joinDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    row.innerHTML = `
        <td>${user.id}</td>
        <td>
            <strong>${user.username}</strong>
            ${user.id === currentAdmin.id ? ' <small style="color: #ff4444;">(Вы)</small>' : ''}
        </td>
        <td>${user.email || '-'}</td>
        <td>
            <span class="role-badge ${user.isAdmin ? 'role-admin' : 'role-user'}">
                ${user.isAdmin ? 'Администратор' : 'Пользователь'}
            </span>
        </td>
        <td>${formattedDate}</td>
        <td>
            ${user.id !== currentAdmin.id ? `
                <button class="btn-edit" onclick="editUserRole(${user.id})" title="Изменить роль">
                    <i class="fas fa-user-cog"></i>
                </button>
                <button class="btn-delete" onclick="deleteUser(${user.id})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            ` : '-'}
        </td>
    `;
    
    return row;
}

function editUserRole(userId) {
    const user = users.find(u => u.id == userId);
    if (!user) return;
    
    const newRole = confirm(`Текущая роль: ${user.isAdmin ? 'Администратор' : 'Пользователь'}\n\nСделать ${user.isAdmin ? 'пользователем' : 'администратором'}?`);
    
    if (newRole !== null) {
        user.isAdmin = !user.isAdmin;
        localStorage.setItem('fame_users', JSON.stringify(users));
        loadUsersTable();
        alert('Роль изменена!');
    }
}

function deleteUser(userId) {
    if (!confirm('Удалить этого пользователя? Все его заявки также будут удалены.')) {
        return;
    }
    
    // Удаляем пользователя
    users = users.filter(u => u.id != userId);
    localStorage.setItem('fame_users', JSON.stringify(users));
    
    // Удаляем заявки пользователя
    applications = applications.filter(app => app.userId != userId);
    localStorage.setItem('fame_applications', JSON.stringify(applications));
    
    loadUsersTable();
    loadApplications();
    updateCounters();
    alert('Пользователь удален.');
}

// ==================== РАБОТА С НАСТРОЙКАМИ ====================
function exportData() {
    const data = {
        applications: applications,
        members: members,
        users: users,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fame-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Данные экспортированы!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('Импортировать данные? Существующие данные будут перезаписаны.')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Проверяем структуру данных
            if (!data.applications || !data.members || !data.users) {
                throw new Error('Неверный формат файла');
            }
            
            // Импортируем данные
            localStorage.setItem('fame_applications', JSON.stringify(data.applications));
            localStorage.setItem('fame_members', JSON.stringify(data.members));
            localStorage.setItem('fame_users', JSON.stringify(data.users));
            
            // Перезагружаем данные
            loadData();
            loadApplications();
            loadMembersTable();
            loadUsersTable();
            updateCounters();
            
            alert('Данные успешно импортированы!');
            
        } catch (error) {
            alert('Ошибка при импорте данных: ' + error.message);
        }
        
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

function clearOldApplications() {
    if (!confirm('Очистить все отклоненные и старые принятые заявки? Это действие нельзя отменить.')) {
        return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 1); // 1 месяц назад
    
    applications = applications.filter(app => {
        // Оставляем ожидающие и на рассмотрении
        if (app.status === 'pending' || app.status === 'review') return true;
        
        // Оставляем принятые за последний месяц
        if (app.status === 'accepted') {
            const appDate = new Date(app.reviewedAt || app.createdAt);
            return appDate > cutoffDate;
        }
        
        // Удаляем отклоненные и старые
        return false;
    });
    
    localStorage.setItem('fame_applications', JSON.stringify(applications));
    loadApplications();
    updateCounters();
    alert('Старые заявки очищены!');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getStatusText(status) {
    const statuses = {
        'pending': 'Ожидает рассмотрения',
        'review': 'На рассмотрении',
        'accepted': 'Принята',
        'rejected': 'Отклонена'
    };
    return statuses[status] || status;
}

function getColorFromString(str) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

function createNotificationForUser(userId, message) {
    // В реальном приложении здесь была бы отправка уведомления пользователю
    console.log(`Уведомление для пользователя ${userId}: ${message}`);
}

function addMemberFromApplication(application) {
    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    
    const newMember = {
        id: newId,
        nickname: application.nickname,
        username: application.telegram,
        category: application.category,
        role: application.category,
        description: application.description,
        avatar: `img/avatar${newId}.png`,
        verified: false,
        pinned: false,
        scam: false,
        project: application.links.length > 0 ? application.links[0] : "",
        telegram: application.telegram.replace('@', ''),
        joinDate: new Date().toISOString().split('T')[0],
        activity: "Постоянная",
        details: application.description,
        skills: ["Новый участник"],
        socials: {
            telegram: application.telegram
        }
    };
    
    members.push(newMember);
    localStorage.setItem('fame_members', JSON.stringify(members));
    
    return newMember;
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================
function initModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
    }
}