async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const appConfig = await response.json();
            document.getElementById('configMaxLosses').value = appConfig.maxLosses;
            document.getElementById('configShowMax').checked = appConfig.showMaxColumn;
        }
    } catch (e) {
        console.error('Không thể tải cấu hình', e);
    }
}

async function submitConfig(event) {
    event.preventDefault();
    const payload = {
        maxLosses: Number(document.getElementById('configMaxLosses').value),
        showMaxColumn: document.getElementById('configShowMax').checked
    };
    try {
        const response = await window.secureFetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const msg = document.getElementById('configMessage');
        if (!response.ok) {
            msg.textContent = 'Lỗi lưu cấu hình';
            msg.className = 'text-danger fw-bold';
            return;
        }
        msg.textContent = 'Đã lưu cấu hình thành công!';
        msg.className = 'text-success fw-bold';
        setTimeout(() => {
            msg.textContent = '';
        }, 3000);
    } catch (e) {
        console.error(e);
    }
}

document.getElementById('configForm').addEventListener('submit', submitConfig);
document.addEventListener('admin-auth-changed', () => {
    if (window.isAdmin) {
        document.querySelector('.non-admin-only').classList.add('d-none');
        loadConfig();
    } else {
        document.querySelector('.non-admin-only').classList.remove('d-none');
    }
});

// Initial load check
window.authReady.then(() => {
    if (window.isAdmin) {
        document.querySelector('.non-admin-only').classList.add('d-none');
        loadConfig();
    } else {
        document.querySelector('.non-admin-only').classList.remove('d-none');
    }
});
