let players = [];
let playDays = [];
let matches = [];
let standings = [];
let selectedPlayDayId = null;
let editingPlayDayId = null;
let editingMatchId = null;
let appConfig = { maxLosses: 3, showMaxColumn: true };

const text = (id, value) => {
    document.getElementById(id).textContent = value ?? '';
};

const selectedPlayDay = () => playDays.find(day => day.id === selectedPlayDayId);
const selectedDayPlayers = () => {
    const playerIds = new Set(selectedPlayDay()?.playerIds || []);
    return players.filter(player => playerIds.has(player.id));
};
const selectedDayMatches = () => matches.filter(match => match.playDayId === selectedPlayDayId);

function actionButton(label, buttonClass, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-sm ${buttonClass}`;
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
}

function createPlayerRow(player, index) {
    const games = player.wins + player.losses;
    const winPercentage = games ? (player.wins / games * 100).toFixed(1) : '0.0';
    const row = document.createElement('div');
    row.className = 'table-row';

    const rank = document.createElement('div');
    rank.className = 'rank-badge';
    rank.textContent = index + 1;

    const info = document.createElement('div');
    info.className = 'player-info';
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name;
    info.append(name);

    const pointDifference = document.createElement('div');
    pointDifference.className = 'stat-cell rating';
    pointDifference.textContent = player.pointDifference > 0
        ? `+${player.pointDifference}`
        : player.pointDifference;
    const wins = document.createElement('div');
    wins.className = 'stat-cell';
    wins.textContent = player.wins;
    const losses = document.createElement('div');
    losses.className = 'stat-cell';
    losses.textContent = player.losses;
    const winRate = document.createElement('div');
    winRate.className = 'stat-cell';
    winRate.textContent = `${winPercentage}%`;

    const maxCol = document.createElement('div');
    maxCol.className = 'stat-cell max-col';
    if (player.losses >= appConfig.maxLosses) {
        maxCol.textContent = appConfig.maxLosses;
        maxCol.style.color = 'red';
        maxCol.style.fontWeight = 'bold';
    } else {
        maxCol.textContent = player.losses;
    }

    row.append(rank, info, pointDifference, wins, losses, winRate, maxCol);
    return row;
}

function compareStandings(a, b) {
    const aGames = a.wins + a.losses;
    const bGames = b.wins + b.losses;
    const aWinRate = aGames ? a.wins / aGames : 0;
    const bWinRate = bGames ? b.wins / bGames : 0;
    return bWinRate - aWinRate
        || b.wins - a.wins
        || b.pointDifference - a.pointDifference
        || a.name.localeCompare(b.name, 'vi');
}

function calculateStandings() {
    const byPlayerId = new Map(selectedDayPlayers().map(player => [
        player.id,
        { ...player, wins: 0, losses: 0, pointDifference: 0 }
    ]));

    selectedDayMatches().forEach(match => {
        const team1Won = match.winningTeam === 1;
        const difference = match.team1Score - match.team2Score;
        [
            [match.team1Player1Id, team1Won, difference],
            [match.team1Player2Id, team1Won, difference],
            [match.team2Player1Id, !team1Won, -difference],
            [match.team2Player2Id, !team1Won, -difference]
        ].forEach(([playerId, won, pointDifference]) => {
            const player = byPlayerId.get(playerId);
            if (!player) return;
            player.wins += won ? 1 : 0;
            player.losses += won ? 0 : 1;
            player.pointDifference += pointDifference;
        });
    });
    standings = [...byPlayerId.values()].sort(compareStandings);
}

function filterAndSort() {
    const filtered = [...standings];
    filtered.sort(compareStandings);
    document.getElementById('playersList').replaceChildren(...filtered.map(createPlayerRow));
}

function renderPlayDays() {
    const rows = playDays.map(day => {
        const row = document.createElement('div');
        row.className = `play-day-item ${day.id === selectedPlayDayId ? 'active' : ''}`;
        const select = document.createElement('button');
        select.type = 'button';
        select.className = 'play-day-select';
        select.textContent = `${day.name} · ${day.playDate}`;
        select.addEventListener('click', () => selectPlayDay(day.id));
        row.append(select);
        if (window.adminAuthenticated) {
            row.append(actionButton('Sửa', 'btn-outline-primary', () => beginPlayDayEdit(day)));
        }
        return row;
    });
    document.getElementById('playDaysList').replaceChildren(...rows);
}

function renderSelectedDay() {
    const day = selectedPlayDay();
    if (!day) {
        text('playDayTitle', 'Chưa có ngày chơi');
        text('playDayDateLabel', '');
        text('playDayMemberCount', 'Hãy tạo ngày chơi đầu tiên.');
        text('ladderPlayDayText', '');
        standings = [];
    } else {
        text('playDayTitle', day.name);
        text('playDayDateLabel', day.playDate);
        text('playDayMemberCount', `${selectedDayPlayers().length} người tham gia`);
        calculateStandings();
        const dateParts = day.playDate.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : day.playDate;
        text('ladderPlayDayText', `Ngày chơi: ${day.name} (${formattedDate})`);
    }
    renderPlayDays();
    populatePlayerSelects();
    renderMatchHistory();
    updateStats();
    filterAndSort();
}

function selectPlayDay(id) {
    selectedPlayDayId = id;
    resetMatchForm();
    renderSelectedDay();
}

function renderPlayDayPlayerChoices(selectedIds = []) {
    const selected = new Set(selectedIds);
    const choices = players.map(player => {
        const label = document.createElement('label');
        label.className = 'player-checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'playDayPlayer';
        checkbox.value = player.id;
        checkbox.checked = selected.has(player.id);
        label.append(checkbox, document.createTextNode(player.name));
        return label;
    });
    document.getElementById('playDayPlayerChoices').replaceChildren(...choices);
}

function showNewPlayDayForm() {
    editingPlayDayId = null;
    document.getElementById('playDayForm').reset();
    text('playDayEditorTitle', 'Tạo ngày chơi');
    document.getElementById('playDayDate').value = new Date().toISOString().slice(0, 10);
    renderPlayDayPlayerChoices();
    document.getElementById('playDayEditor').classList.remove('d-none');
}

function beginPlayDayEdit(day) {
    editingPlayDayId = day.id;
    text('playDayEditorTitle', 'Sửa ngày chơi');
    document.getElementById('playDayName').value = day.name;
    document.getElementById('playDayDate').value = day.playDate;
    renderPlayDayPlayerChoices(day.playerIds);
    document.getElementById('playDayEditor').classList.remove('d-none');
}

function closePlayDayEditor() {
    editingPlayDayId = null;
    document.getElementById('playDayEditor').classList.add('d-none');
}

async function submitPlayDay(event) {
    event.preventDefault();
    const playerIds = [...document.querySelectorAll('input[name="playDayPlayer"]:checked')]
        .map(input => Number(input.value));
    const payload = {
        name: document.getElementById('playDayName').value.trim(),
        playDate: document.getElementById('playDayDate').value,
        playerIds
    };
    const response = await window.secureFetch(
        editingPlayDayId ? `/api/play-days/${editingPlayDayId}` : '/api/play-days',
        {
            method: editingPlayDayId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }
    );
    if (!response.ok) {
        alert('Không thể lưu ngày chơi.');
        return;
    }
    const saved = await response.json();
    selectedPlayDayId = saved.id;
    closePlayDayEditor();
    await loadApplication();
}

function updateStats() {
    text('totalPlayers', selectedDayPlayers().length);
    text('totalMatches', selectedDayMatches().length);
    text('topWins', standings.length ? standings[0].wins : 0);
    text('activePlayers', standings.filter(player => player.wins + player.losses > 0).length);
}

function populatePlayerSelects() {
    const availablePlayers = selectedDayPlayers();
    document.querySelectorAll('.player-select').forEach(select => {
        const currentValue = select.value;
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Chọn người chơi --';
        const options = availablePlayers.map(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            return option;
        });
        select.replaceChildren(placeholder, ...options);
        select.value = currentValue;
    });
}

function renderMatchHistory() {
    const history = document.getElementById('matchHistory');
    const dayMatches = selectedDayMatches();
    if (!dayMatches.length) {
        history.innerHTML = '<div class="loading">Chưa có trận đấu nào trong ngày này.</div>';
        return;
    }
    const totalMatches = dayMatches.length;
    const rows = dayMatches.map((match, index) => {
        const row = document.createElement('div');
        row.className = 'match-result';
        
        const matchIndex = document.createElement('div');
        matchIndex.className = 'match-index';
        matchIndex.textContent = `#${totalMatches - index}`;
        
        const team1 = document.createElement('div');
        team1.className = `match-team ${match.winningTeam === 1 ? 'winner' : ''}`;
        team1.textContent = `${match.team1Player1Name} & ${match.team1Player2Name}`;
        const score = document.createElement('div');
        score.className = 'match-score';
        score.textContent = `${match.team1Score} - ${match.team2Score}`;
        const team2 = document.createElement('div');
        team2.className = `match-team ${match.winningTeam === 2 ? 'winner' : ''}`;
        team2.textContent = `${match.team2Player1Name} & ${match.team2Player2Name}`;
        
        row.append(matchIndex, team1, score, team2);
        if (window.adminAuthenticated) {
            const actions = document.createElement('div');
            actions.className = 'match-actions';
            actions.append(
                actionButton('Sửa', 'btn-outline-primary', () => beginMatchEdit(match)),
                actionButton('Xoá', 'btn-outline-danger', () => deleteMatch(match))
            );
            row.append(actions);
        } else {
            row.append(document.createElement('div'));
        }
        return row;
    });
    history.replaceChildren(...rows);
}

async function loadApplication() {
    const [playersResponse, playDaysResponse, matchesResponse, configResponse] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/play-days'),
        fetch('/api/matches'),
        fetch('/api/config')
    ]);
    if (!playersResponse.ok || !playDaysResponse.ok || !matchesResponse.ok) {
        throw new Error('API returned an unsuccessful response');
    }
    players = await playersResponse.json();
    playDays = await playDaysResponse.json();
    matches = await matchesResponse.json();
    if (configResponse.ok) {
        appConfig = await configResponse.json();
        const ladderTable = document.getElementById('ladderTable');
        if (ladderTable) {
            if (appConfig.showMaxColumn) {
                ladderTable.classList.remove('hide-max');
            } else {
                ladderTable.classList.add('hide-max');
            }
        }
    }
    if (!playDays.some(day => day.id === selectedPlayDayId)) {
        selectedPlayDayId = playDays[0]?.id ?? null;
    }
    renderSelectedDay();
}

function beginMatchEdit(match) {
    editingMatchId = match.id;
    const values = [
        match.team1Player1Id,
        match.team1Player2Id,
        match.team2Player1Id,
        match.team2Player2Id
    ];
    ['team1Player1', 'team1Player2', 'team2Player1', 'team2Player2'].forEach((id, index) => {
        document.getElementById(id).value = values[index];
    });
    document.getElementById('team1Score').value = match.team1Score;
    document.getElementById('team2Score').value = match.team2Score;
    text('saveMatchLabel', 'Lưu thay đổi');
    document.getElementById('cancelMatchEdit').classList.remove('d-none');
}

function resetMatchForm() {
    editingMatchId = null;
    document.getElementById('doublesMatchForm').reset();
    text('saveMatchLabel', 'Lưu kết quả');
    document.getElementById('cancelMatchEdit').classList.add('d-none');
}

async function deleteMatch(match) {
    if (!confirm(`Xoá kết quả ${match.team1Score} - ${match.team2Score}?`)) return;
    const response = await window.secureFetch(`/api/matches/${match.id}`, { method: 'DELETE' });
    if (!response.ok) {
        text('matchMessage', 'Không thể xoá trận đấu.');
        return;
    }
    if (editingMatchId === match.id) resetMatchForm();
    await loadApplication();
}

async function submitDoublesMatch(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById('matchMessage');
    if (!selectedPlayDayId) {
        message.textContent = 'Hãy tạo và chọn một ngày chơi trước.';
        return;
    }
    const playerIds = ['team1Player1', 'team1Player2', 'team2Player1', 'team2Player2']
        .map(id => Number(document.getElementById(id).value));
    const team1Score = Number(document.getElementById('team1Score').value);
    const team2Score = Number(document.getElementById('team2Score').value);
    message.className = 'match-message text-danger';
    if (new Set(playerIds).size !== 4 || playerIds.some(id => !id)) {
        message.textContent = 'Mỗi người chơi chỉ được chọn một lần.';
        return;
    }
    if (team1Score === team2Score) {
        message.textContent = 'Trận đấu phải có một đội thắng.';
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    const response = await window.secureFetch(
        editingMatchId ? `/api/matches/${editingMatchId}/doubles` : '/api/matches/doubles',
        {
            method: editingMatchId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playDayId: selectedPlayDayId,
                team1Player1Id: playerIds[0],
                team1Player2Id: playerIds[1],
                team2Player1Id: playerIds[2],
                team2Player2Id: playerIds[3],
                team1Score,
                team2Score
            })
        }
    );
    submitButton.disabled = false;
    if (!response.ok) {
        message.textContent = 'Không thể lưu kết quả. Kiểm tra người chơi thuộc ngày đã chọn.';
        return;
    }
    resetMatchForm();
    await loadApplication();
    message.className = 'match-message text-success';
    message.textContent = 'Đã lưu kết quả cho ngày chơi này.';
}


document.getElementById('newPlayDayButton').addEventListener('click', showNewPlayDayForm);
document.getElementById('editPlayDayButton').addEventListener('click', () => {
    const day = selectedPlayDay();
    if (day) beginPlayDayEdit(day);
});
document.getElementById('playDayForm').addEventListener('submit', submitPlayDay);
document.getElementById('cancelPlayDayEdit').addEventListener('click', closePlayDayEditor);
document.getElementById('doublesMatchForm').addEventListener('submit', submitDoublesMatch);
document.getElementById('cancelMatchEdit').addEventListener('click', resetMatchForm);
document.addEventListener('admin-auth-changed', () => {
    closePlayDayEditor();
    resetMatchForm();
    renderSelectedDay();
});
window.authReady
    .then(loadApplication)
    .catch(error => console.error('Unable to load application:', error));
