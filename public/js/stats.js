let players = [];
let playDays = [];
let matches = [];
let appConfig = { maxLosses: 3, showMaxColumn: true };

async function loadData() {
    try {
        const [pRes, pdRes, mRes, cRes] = await Promise.all([
            fetch('/api/players'),
            fetch('/api/play-days'),
            fetch('/api/matches'),
            fetch('/api/config')
        ]);
        
        if (pRes.ok) players = await pRes.json();
        if (pdRes.ok) playDays = await pdRes.json();
        if (mRes.ok) matches = await mRes.json();
        if (cRes.ok) appConfig = await cRes.json();

        // Default to current month
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('statsMonth').value = monthStr;

        renderPlayerCheckboxes();
        calculateStats();

    } catch (e) {
        console.error("Lỗi tải dữ liệu", e);
    }
}

function renderPlayerCheckboxes() {
    const container = document.getElementById('playerCheckboxes');
    players.sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach(p => {
        const div = document.createElement('div');
        div.className = 'form-check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'form-check-input player-cb';
        input.value = p.id;
        input.id = `cb_player_${p.id}`;
        input.checked = true; // Default to all selected
        
        input.addEventListener('change', calculateStats);

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = p.name;

        div.append(input, label);
        container.append(div);
    });
}

function getPlayerLossesForDay(dayId) {
    const dayMatches = matches.filter(m => m.playDayId === dayId);
    const losses = {};
    dayMatches.forEach(match => {
        const team1Won = match.winningTeam === 1;
        if (!team1Won) {
            losses[match.team1Player1Id] = (losses[match.team1Player1Id] || 0) + 1;
            losses[match.team1Player2Id] = (losses[match.team1Player2Id] || 0) + 1;
        } else {
            losses[match.team2Player1Id] = (losses[match.team2Player1Id] || 0) + 1;
            losses[match.team2Player2Id] = (losses[match.team2Player2Id] || 0) + 1;
        }
    });
    return losses;
}

function calculateStats() {
    const month = document.getElementById('statsMonth').value; // YYYY-MM
    if (!month) return;

    // Get selected players
    const selectedPlayerIds = new Set(
        Array.from(document.querySelectorAll('.player-cb:checked')).map(cb => Number(cb.value))
    );

    // Get play days in the selected month
    const monthDays = playDays.filter(d => d.playDate && d.playDate.startsWith(month));

    const totalMax = {};
    selectedPlayerIds.forEach(id => totalMax[id] = 0);

    monthDays.forEach(day => {
        const dayLosses = getPlayerLossesForDay(day.id);
        for (const [pIdStr, lossCount] of Object.entries(dayLosses)) {
            const pId = Number(pIdStr);
            if (selectedPlayerIds.has(pId)) {
                const maxForDay = Math.min(lossCount, appConfig.maxLosses);
                totalMax[pId] += maxForDay;
            }
        }
    });

    const results = Array.from(selectedPlayerIds).map(id => {
        return {
            player: players.find(p => p.id === id),
            total: totalMax[id]
        };
    }).filter(r => r.player);

    // Sort by total max descending
    results.sort((a, b) => b.total - a.total || a.player.name.localeCompare(b.player.name, 'vi'));

    const list = document.getElementById('statsList');
    list.innerHTML = '';
    
    const statsMonthText = document.getElementById('statsMonthText');
    if (statsMonthText) {
        const [yyyy, mm] = month.split('-');
        statsMonthText.textContent = `Thống kê MAX cho tháng: ${mm}/${yyyy}`;
    }

    if (results.length === 0) {
        list.innerHTML = '<div class="loading">Không có dữ liệu cho các lựa chọn này.</div>';
        return;
    }

    results.forEach((res, index) => {
        const row = document.createElement('div');
        row.className = 'stats-table-row';

        const rank = document.createElement('div');
        rank.className = 'rank-badge';
        rank.textContent = index + 1;
        rank.style.width = '30px';
        rank.style.height = '30px';
        rank.style.fontSize = '12px';

        const name = document.createElement('div');
        name.style.fontWeight = '600';
        name.textContent = res.player.name;

        const total = document.createElement('div');
        total.className = 'text-center';
        total.style.fontWeight = 'bold';
        total.style.color = res.total > 0 ? 'red' : 'black';
        total.textContent = res.total;

        row.append(rank, name, total);
        list.append(row);
    });
}

document.getElementById('statsMonth').addEventListener('change', calculateStats);

window.addEventListener('DOMContentLoaded', loadData);
