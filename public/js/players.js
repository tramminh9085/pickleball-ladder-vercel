let players = [];
let editingPlayerId = null;

function actionButton(label, buttonClass, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-sm ${buttonClass}`;
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
}

function renderPlayers() {
    const rows = players.map(player => {
        const row = document.createElement('div');
        row.className = 'management-player';
        const identity = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = player.name;
        const email = document.createElement('div');
        email.className = 'management-player-details';
        email.textContent = player.email || 'Chưa có email';
        identity.append(name, email);

        const details = document.createElement('div');
        details.className = 'management-player-details';
        details.textContent = `${player.location || 'Chưa có địa điểm'} · Trình độ ${player.skillLevel ?? '-'}`;

        row.append(identity, details);
        if (window.adminAuthenticated) {
            const actions = document.createElement('div');
            actions.className = 'management-actions';
            actions.append(
                actionButton('Sửa', 'btn-outline-primary', () => beginEdit(player)),
                actionButton('Xoá', 'btn-outline-danger', () => deletePlayer(player))
            );
            row.append(actions);
        } else {
            row.append(document.createElement('div'));
        }
        return row;
    });
    document.getElementById('playerManagementList').replaceChildren(...rows);
}

async function loadPlayers() {
    const response = await fetch('/api/players');
    if (!response.ok) throw new Error('Unable to load players');
    players = await response.json();
    renderPlayers();
}

function beginEdit(player) {
    editingPlayerId = player.id;
    document.getElementById('playerName').value = player.name || '';
    document.getElementById('playerEmail').value = player.email || '';
    document.getElementById('playerLocation').value = player.location || '';
    document.getElementById('playerSkillLevel').value = player.skillLevel ?? '';
    document.getElementById('savePlayerButton').innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
    document.getElementById('cancelPlayerEdit').classList.remove('d-none');
}

function resetForm() {
    editingPlayerId = null;
    document.getElementById('playerForm').reset();
    document.getElementById('savePlayerButton').innerHTML = '<i class="fas fa-plus"></i> Thêm người chơi';
    document.getElementById('cancelPlayerEdit').classList.add('d-none');
}

async function submitPlayer(event) {
    event.preventDefault();
    const skillLevelValue = document.getElementById('playerSkillLevel').value;
    const payload = {
        name: document.getElementById('playerName').value.trim(),
        email: document.getElementById('playerEmail').value.trim() || null,
        location: document.getElementById('playerLocation').value.trim() || null,
        skillLevel: skillLevelValue === '' ? null : Number(skillLevelValue)
    };
    const response = await window.secureFetch(
        editingPlayerId ? `/api/players/${editingPlayerId}` : '/api/players',
        {
        method: editingPlayerId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
        }
    );
    const message = document.getElementById('playerMessage');
    if (!response.ok) {
        message.className = 'match-message text-danger';
        message.textContent = 'Không thể lưu người chơi. Kiểm tra email hoặc dữ liệu nhập.';
        return;
    }
    resetForm();
    await loadPlayers();
    message.className = 'match-message text-success';
    message.textContent = 'Đã lưu thông tin người chơi.';
}

async function deletePlayer(player) {
    if (!confirm(`Xoá người chơi ${player.name}? Lịch sử trận đấu vẫn được giữ lại.`)) return;
    const response = await window.secureFetch(`/api/players/${player.id}`, { method: 'DELETE' });
    if (!response.ok) {
        document.getElementById('playerMessage').textContent = 'Không thể xoá người chơi.';
        return;
    }
    if (editingPlayerId === player.id) resetForm();
    await loadPlayers();
}

document.getElementById('playerForm').addEventListener('submit', submitPlayer);
document.getElementById('cancelPlayerEdit').addEventListener('click', resetForm);
document.addEventListener('admin-auth-changed', () => {
    resetForm();
    renderPlayers();
});
window.authReady.then(loadPlayers).catch(error => console.error(error));
