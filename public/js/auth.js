window.adminAuthenticated = false;
window.csrfHeader = null;
window.csrfToken = null;

function updateAdminUi(status) {
    window.adminAuthenticated = status.authenticated;
    window.csrfHeader = status.csrfHeader;
    window.csrfToken = status.csrfToken;
    document.querySelectorAll('.admin-only').forEach(element => {
        element.classList.toggle('d-none', !status.authenticated);
    });

    const authButton = document.getElementById('authButton');
    authButton.innerHTML = status.authenticated
        ? `<i class="fas fa-right-from-bracket"></i> Đăng xuất (${status.username})`
        : '<i class="fas fa-right-to-bracket"></i> Đăng nhập Admin';
}

async function refreshAuthStatus() {
    const response = await fetch('/api/auth/status');
    if (!response.ok) throw new Error('Unable to load authentication status');
    const status = await response.json();
    updateAdminUi(status);
    return status;
}

window.secureFetch = async function secureFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (window.csrfHeader && window.csrfToken) {
        headers.set(window.csrfHeader, window.csrfToken);
    }
    return fetch(url, { ...options, headers });
};

function createLoginDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'login-overlay d-none';
    overlay.id = 'loginOverlay';
    overlay.innerHTML = `
        <div class="login-card">
            <h2>Đăng nhập Admin</h2>
            <p>Đăng nhập để thêm, sửa hoặc xoá dữ liệu.</p>
            <form id="adminLoginForm">
                <input class="filter-input mb-2" id="adminUsername" autocomplete="username"
                       placeholder="Tên đăng nhập" required>
                <input class="filter-input mb-2" id="adminPassword" type="password"
                       autocomplete="current-password" placeholder="Mật khẩu" required>
                <div class="login-error" id="loginError"></div>
                <div class="d-flex gap-2 justify-content-end">
                    <button type="button" class="btn btn-light" id="cancelLogin">Huỷ</button>
                    <button type="submit" class="btn btn-primary">Đăng nhập</button>
                </div>
            </form>
        </div>
    `;
    document.body.append(overlay);
    document.getElementById('cancelLogin').addEventListener('click', closeLoginDialog);
    document.getElementById('adminLoginForm').addEventListener('submit', login);
}

function openLoginDialog() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginOverlay').classList.remove('d-none');
    document.getElementById('adminUsername').focus();
}

function closeLoginDialog() {
    document.getElementById('loginOverlay').classList.add('d-none');
    document.getElementById('adminLoginForm').reset();
}

async function login(event) {
    event.preventDefault();
    const response = await window.secureFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('adminUsername').value,
            password: document.getElementById('adminPassword').value
        })
    });
    if (!response.ok) {
        document.getElementById('loginError').textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        return;
    }
    updateAdminUi(await response.json());
    closeLoginDialog();
    document.dispatchEvent(new CustomEvent('admin-auth-changed'));
}

async function logout() {
    const response = await window.secureFetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Unable to log out');
    await refreshAuthStatus();
    document.dispatchEvent(new CustomEvent('admin-auth-changed'));
}

async function initializeAuth() {
    createLoginDialog();
    document.getElementById('authButton').addEventListener('click', () => {
        if (window.adminAuthenticated) {
            logout().catch(error => console.error(error));
        } else {
            openLoginDialog();
        }
    });
    return refreshAuthStatus();
}

window.authReady = initializeAuth();
