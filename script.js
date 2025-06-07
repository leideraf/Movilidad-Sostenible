// Variables globales
let currentUser = null;
let routes = JSON.parse(localStorage.getItem('routes')) || [];
let currentRoute = null;
let routeTimer = null;
let routeStartTime = null;

// Funciones de navegación
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    if (currentUser && (sectionId === 'dashboard' || sectionId === 'reportes')) {
        updateNavbar(true);
    } else {
        updateNavbar(false);
    }
}

function updateNavbar(loggedIn) {
    const navbarItems = document.getElementById('navbarItems');
    if (loggedIn) {
        navbarItems.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showSection('dashboard')">Dashboard</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReports()">Reportes</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="logout()">Cerrar Sesión</a>
            </li>
        `;
    } else {
        navbarItems.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showSection('login')">Iniciar Sesión</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showSection('registro')">Registrarse</a>
            </li>
        `;
    }
}

// Iniciar sesion
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('users')) || {};
    const user = users[email];

    if (!user) {
        showAlert('Usuario no registrado', 'danger');
        return;
    }

    if (user.password !== password) {
        showAlert('Contraseña incorrecta', 'danger');
        return;
    }

    currentUser = {
        email: user.email,
        name: user.name,
        company: user.company
    };

    document.getElementById('welcomeUser').textContent = currentUser.name;
    updateStats();
    showSection('dashboard');
    showAlert('¡Inicio de sesión exitoso!', 'success');
});

//Registrarse como nuevo usuario
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const company = document.getElementById('company').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'danger');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[email]) {
        showAlert('El usuario ya está registrado', 'warning');
        return;
    }

    users[email] = {
        email,
        name: `${firstName} ${lastName}`,
        company,
        password
    };

    localStorage.setItem('users', JSON.stringify(users));

    currentUser = {
        email,
        name: `${firstName} ${lastName}`,
        company
    };

    document.getElementById('welcomeUser').textContent = currentUser.name;
    updateStats();
    showSection('dashboard');
    showAlert('¡Registro exitoso! Bienvenido a Movilidad Sostenible', 'success');
});

//Salir de la sesion
function logout() {
    currentUser = null;
    showSection('inicio');
    updateNavbar(false);
    showAlert('Sesión cerrada correctamente', 'info');
}

// Rutas
function startRoute() {
    const transportType = document.getElementById('transportType').value;
    const distance = parseFloat(document.getElementById('routeDistance').value);
    if (!transportType || !distance) {
        showAlert('Por favor selecciona el tipo de transporte y la distancia', 'warning');
        return;
    }

    currentRoute = {
        id: Date.now(),
        transportType,
        distance,
        startTime: new Date(),
        status: 'active'
    };

    saveCurrentRoute();
    routeStartTime = Date.now();
    startTimer();

    document.getElementById('startRouteBtn').style.display = 'none';
    document.getElementById('endRouteBtn').style.display = 'inline-block';
    document.getElementById('routeProgress').style.display = 'block';
    document.getElementById('routeTracker').classList.add('active-route');

    showAlert('¡Ruta iniciada! Disfruta tu viaje sostenible', 'success');
}

function endRoute() {
    if (!currentRoute) return;

    const endTime = new Date();
    const duration = Math.round((endTime - new Date(currentRoute.startTime)) / 60000);

    currentRoute.endTime = endTime;
    currentRoute.duration = duration;
    currentRoute.status = 'completed';

    const co2Factor = currentRoute.transportType === 'cycling' ? 0.21 : 0.18;
    const co2Saved = Math.round(currentRoute.distance * co2Factor * 100) / 100;
    currentRoute.co2Saved = co2Saved;

    routes.push(currentRoute);
    localStorage.setItem('routes', JSON.stringify(routes));
    localStorage.removeItem('currentRoute');

    stopTimer();
    updateStats();
    updateRecentRoutes();

    document.getElementById('startRouteBtn').style.display = 'inline-block';
    document.getElementById('endRouteBtn').style.display = 'none';
    document.getElementById('routeProgress').style.display = 'none';
    document.getElementById('routeTracker').classList.remove('active-route');
    document.getElementById('transportType').value = '';
    document.getElementById('routeDistance').value = '';

    showAlert(`¡Ruta completada! Duración: ${duration} minutos. CO₂ ahorrado: ${co2Saved} kg`, 'success');
    currentRoute = null;
}

function startTimer() {
    routeTimer = setInterval(() => {
        const elapsed = Date.now() - routeStartTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('routeTimer').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (routeTimer) {
        clearInterval(routeTimer);
        routeTimer = null;
    }
}

function updateStats() {
    const totalRoutes = routes.length;
    const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);
    const totalTime = routes.reduce((sum, route) => sum + (route.duration || 0), 0);
    const totalCO2 = routes.reduce((sum, route) => sum + (route.co2Saved || 0), 0);

    document.getElementById('totalRoutes').textContent = totalRoutes;
    document.getElementById('totalDistance').textContent = totalDistance.toFixed(1);
    document.getElementById('totalTime').textContent = totalTime;
    document.getElementById('co2Saved').textContent = totalCO2.toFixed(2);
}

function updateRecentRoutes() {
    const recentRoutesDiv = document.getElementById('recentRoutes');
    const recentRoutes = routes.slice(-5).reverse();

    if (recentRoutes.length === 0) {
        recentRoutesDiv.innerHTML = '<p class="text-muted">No hay rutas registradas aún.</p>';
        return;
    }

    const routesHTML = recentRoutes.map(route => {
        const icon = route.transportType === 'cycling' ? '🚴‍♂️' : '🚶‍♂️';
        const transportName = route.transportType === 'cycling' ? 'Bicicleta' : 'Caminar';
        const date = new Date(route.startTime).toLocaleDateString();
        return `
            <div class="border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="me-2">${icon}</span>
                        <strong>${transportName}</strong>
                        <small class="text-muted d-block">${date}</small>
                    </div>
                    <div class="text-end">
                        <div>${route.distance} km</div>
                        <small class="text-success">${route.co2Saved} kg CO₂</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    recentRoutesDiv.innerHTML = routesHTML;
}

function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.alert.position-fixed');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 90px; right: 20px; z-index: 1050; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showReports() {
    showSection('reportes');
    setTimeout(() => {
        createSimpleChart();
    }, 100);
}

function createSimpleChart() {
    const canvas = document.getElementById('routeChart');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [12, 19, 15, 25, 22, 30];
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const maxValue = Math.max(...data);

    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / data.length;

    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * barWidth + barWidth * 0.1;
        const y = canvas.height - padding - barHeight;

        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);

        ctx.fillStyle = '#333';
        ctx.font = '12px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth * 0.4, canvas.height - padding + 15);
        ctx.fillText(value, x + barWidth * 0.4, y - 5);
    });

    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('Rutas por Mes', canvas.width / 2, 25);
}

function saveCurrentRoute() {
    if (currentRoute) {
        localStorage.setItem('currentRoute', JSON.stringify(currentRoute));
    } else {
        localStorage.removeItem('currentRoute');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const carousel = new bootstrap.Carousel(document.getElementById('carouselExample'), {
        interval: 5000,
        wrap: true
    });

    if (routes.length > 0) {
        updateStats();
        updateRecentRoutes();
    }

    const savedRoute = localStorage.getItem('currentRoute');
    if (savedRoute) {
        currentRoute = JSON.parse(savedRoute);
        if (currentRoute.status === 'active') {
            routeStartTime = new Date(currentRoute.startTime).getTime();
            startTimer();
            document.getElementById('startRouteBtn').style.display = 'none';
            document.getElementById('endRouteBtn').style.display = 'inline-block';
            document.getElementById('routeProgress').style.display = 'block';
            document.getElementById('routeTracker').classList.add('active-route');
        }
    }

    const requiredInputs = document.querySelectorAll('input[required], select[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function () {
            if (!this.value.trim()) this.classList.add('is-invalid');
            else this.classList.remove('is-invalid');
        });
        input.addEventListener('input', function () {
            if (this.classList.contains('is-invalid') && this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    });
});
