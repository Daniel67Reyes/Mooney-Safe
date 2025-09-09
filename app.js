// =============================
// Firebase Init (opcional)
// =============================
const firebaseConfig = {
  // ⚠️ Pega aquí tu configuración de Firebase si la usas
};
let app, auth, db;
try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
} catch (e) {
  console.log("Firebase no inicializado (modo local).");
}

// =============================
// Variables globales
// =============================
let userId = "Usuario_000";
let userName = "Usuario Demo";
let userAge = 30;
let userStatus = "Soltero";
let transactions = [];
let categories = [
  { name: "Comida", color: "#EF4444" },
  { name: "Transporte", color: "#60A5FA" },
  { name: "Salario", color: "#34D399" },
  { name: "Otros", color: "#A78BFA" }
];

// Notificaciones
let notificationTime = "";
let alertAEnabled = false, alertAPercentage = 50;
let alertBEnabled = false, alertBPercentage = 50;
let alertCEnabled = false, alertCPercentage = 50;

// Dashboard filtros
let selectedPeriod = "month"; // month | year
let currentChart = "expense"; // expense | income
let filterMonth = new Date().getMonth();
let filterYear = new Date().getFullYear();

// =============================
// Elementos UI
// =============================
const appContainer = document.getElementById("app");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const closeSidebar = document.getElementById("closeSidebar");
const messageBox = document.getElementById("messageBox");

// =============================
// Funciones utilitarias
// =============================
function showMessage(msg) {
  messageBox.textContent = msg;
  messageBox.classList.remove("hidden");
  setTimeout(() => messageBox.classList.add("hidden"), 3000);
}

function calculateBalance() {
  return transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
}

function getSummary(transactionsToSummarize = transactions) {
  const totalIncome = transactionsToSummarize.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactionsToSummarize.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  return { totalIncome, totalExpense };
}

function filterByPeriod(dateStr) {
  const date = new Date(dateStr);

  if (selectedPeriod === "month") {
    return date.getMonth() === filterMonth && date.getFullYear() === filterYear;
  }
  if (selectedPeriod === "year") {
    return date.getFullYear() === filterYear;
  }
  return true;
}

// =============================
// Navegación entre vistas
// =============================
let currentView = "dashboard";

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const view = e.target.dataset.view;
    if (view) {
      currentView = view;
      renderView();
      sidebar.classList.add("-translate-x-full");
    }
  });
});

menuBtn.addEventListener("click", () => sidebar.classList.remove("-translate-x-full"));
closeSidebar.addEventListener("click", () => sidebar.classList.add("-translate-x-full"));

// =============================
// Renderizador principal
// =============================
function renderView() {
  switch (currentView) {
    case "dashboard": renderDashboard(); break;
    case "add": renderAddTransaction(); break;
    case "profile": renderProfile(); break;
    case "notifications": renderNotifications(); break;
    case "settings": renderSettings(); break;
    case "modifyHistory": renderModifyHistory(); break;
    case "extendedCharts": renderExtendedCharts(); break;
    case "exportCsv": renderExportView(); break;
    default: appContainer.innerHTML = "<p>Error: vista no encontrada</p>";
  }
}

// =============================
// 1. Dashboard (con cambios)
// =============================
function renderDashboard() {
    const balance = calculateBalance();
    const { totalIncome, totalExpense } = getSummary();
    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    appContainer.innerHTML = `
        <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Resumen Financiero</h1>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-md text-center">
                    <p class="text-sm text-gray-500">Balance Total</p>
                    <p class="text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}">$${balance.toFixed(2)}</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-md text-center">
                    <p class="text-sm text-gray-500">Ingresos</p>
                    <p class="text-2xl font-bold text-green-500">$${totalIncome.toFixed(2)}</p>
                </div>
                <div class="bg-white p-6 rounded-xl shadow-md text-center">
                    <p class="text-sm text-gray-500">Gastos</p>
                    <p class="text-2xl font-bold text-red-500">$${totalExpense.toFixed(2)}</p>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-md mb-8 text-center">
                <h2 class="text-xl font-semibold mb-4">Análisis por Categoría</h2>

                <div class="flex justify-center space-x-2 mb-4">
                    <button id="monthBtn" class="period-btn px-3 py-1 rounded-lg border ${selectedPeriod === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100'}">${monthNames[filterMonth]}</button>
                    <button id="yearBtn" class="period-btn px-3 py-1 rounded-lg border ${selectedPeriod === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-100'}">${filterYear}</button>
                </div>
                <div id="periodSelector" class="flex justify-center mt-2 hidden"></div>

                <div class="flex flex-col items-center">
                    <div class="w-40 h-40">
                        <canvas id="donutChart"></canvas>
                    </div>
                    <p class="mt-2 font-medium">${currentChart === "expense" ? "Gastos por Categoría" : "Ingresos por Categoría"}</p>

                    <div class="flex justify-center space-x-2 mt-2">
                        <span id="dot-expenses" class="text-lg cursor-pointer ${currentChart === "expense" ? "text-gray-800" : "text-gray-400"}">●</span>
                        <span id="dot-incomes" class="text-lg cursor-pointer ${currentChart === "income" ? "text-gray-800" : "text-gray-400"}">●</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Datos filtrados
    const ctx = document.getElementById("donutChart").getContext("2d");
    const dataByCategory = categories.map(cat => {
        const total = transactions
            .filter(t => t.type === currentChart && filterByPeriod(t.date))
            .filter(t => t.category === cat.name)
            .reduce((sum, t) => sum + t.amount, 0);
        return { label: cat.name, value: total, color: cat.color };
    });

    if (window.donutChartInstance) window.donutChartInstance.destroy();

    window.donutChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: dataByCategory.map(e => e.label),
            datasets: [{
                data: dataByCategory.map(e => e.value),
                backgroundColor: dataByCategory.map(e => e.color),
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            cutout: "70%"
        }
    });

    // Manejar selección de periodo (Mes/Año)
    document.getElementById("monthBtn").addEventListener("click", () => {
        selectedPeriod = "month";
        renderPeriodSelector();
    });

    document.getElementById("yearBtn").addEventListener("click", () => {
        selectedPeriod = "year";
        renderPeriodSelector();
    });

    function renderPeriodSelector() {
        const selectorContainer = document.getElementById("periodSelector");
        selectorContainer.innerHTML = "";
        selectorContainer.classList.remove("hidden");

        if (selectedPeriod === "month") {
            monthNames.forEach((m, i) => {
                const btn = document.createElement("button");
                btn.className = "px-2 py-1 rounded-lg border bg-gray-100 hover:bg-gray-200";
                btn.textContent = m;
                btn.addEventListener("click", () => {
                    filterMonth = i;
                    renderDashboard(); // Re-renderizar para aplicar el cambio
                });
                selectorContainer.appendChild(btn);
            });
        }

        if (selectedPeriod === "year") {
            for (let y = 2025; y <= 2035; y++) {
                const btn = document.createElement("button");
                btn.className = "px-2 py-1 rounded-lg border bg-gray-100 hover:bg-gray-200";
                btn.textContent = y;
                btn.addEventListener("click", () => {
                    filterYear = y;
                    renderDashboard(); // Re-renderizar para aplicar el cambio
                });
                selectorContainer.appendChild(btn);
            }
        }
    }

    // Eventos indicadores
    document.getElementById("dot-expenses").addEventListener("click", () => { currentChart = "expense"; renderDashboard(); });
    document.getElementById("dot-incomes").addEventListener("click", () => { currentChart = "income"; renderDashboard(); });
}

// =============================
// 2. Nueva Transacción (con cambios)
// =============================
function renderAddTransaction() {
  appContainer.innerHTML = `
    <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Nueva Transacción</h1>
      <div class="bg-white p-6 rounded-xl shadow-md">
        <input id="titleInput" placeholder="Título" class="w-full p-3 mb-4 border rounded-lg" />
        <input id="amountInput" type="number" placeholder="Monto" class="w-full p-3 mb-4 border rounded-lg" />
        <select id="categorySelect" class="w-full p-3 mb-4 border rounded-lg">
          <option value="" disabled selected>Selecciona categoría</option>
          ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("")}
        </select>
        <div class="flex space-x-4 mb-6">
          <button id="incomeBtn" class="flex-1 py-2 rounded-lg transition-colors duration-200">Ingreso</button>
          <button id="expenseBtn" class="flex-1 py-2 rounded-lg transition-colors duration-200">Gasto</button>
        </div>
        <button id="addTransactionBtn" class="w-full py-3 bg-blue-500 text-white rounded-lg">Agregar</button>
      </div>
    </div>
  `;
  let type = "expense";
  const incomeBtn = document.getElementById("incomeBtn");
  const expenseBtn = document.getElementById("expenseBtn");

  function updateButtonStyles() {
    if (type === "income") {
      incomeBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-[#00DB07] text-white";
      expenseBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-gray-200 text-gray-800";
    } else {
      incomeBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-gray-200 text-gray-800";
      expenseBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-red-500 text-white";
    }
  }

  // Inicializar los estilos
  updateButtonStyles();

  incomeBtn.onclick = () => {
    type = "income";
    updateButtonStyles();
  };

  expenseBtn.onclick = () => {
    type = "expense";
    updateButtonStyles();
  };

  document.getElementById("addTransactionBtn").onclick = () => {
    const title = document.getElementById("titleInput").value.trim();
    const amount = parseFloat(document.getElementById("amountInput").value);
    const category = document.getElementById("categorySelect").value;
    if (!title || isNaN(amount) || !category) return showMessage("Datos inválidos");

    // Agrega la nueva transacción
    transactions.push({ title, amount, type, category, date: new Date().toISOString() });
    showMessage("Transacción agregada");

    // Verificar si la alerta A debe activarse
    if (alertAEnabled) {
      const filteredTransactions = transactions.filter(t => filterByPeriod(t.date));
      const { totalIncome, totalExpense } = getSummary(filteredTransactions);

      // Asegúrate de no dividir por cero
      if (totalIncome > 0) {
        const percentageSpent = (totalExpense / totalIncome) * 100;
        if (percentageSpent >= alertAPercentage) {
          setTimeout(() => {
            showMessage(`¡Alerta! Has gastado el ${percentageSpent.toFixed(2)}% de tus ingresos. ¡Has rebasado el ${alertAPercentage}%!`);
          }, 500);
        }
      }
    }

    renderAddTransaction();
  };
}

// =============================
// 3. Perfil (con cambios)
// =============================
function renderProfile() {
    appContainer.innerHTML = `
        <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Mi Perfil</h1>
            <div class="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
                <p class="mb-2 text-gray-500">Tu ID de usuario es:</p>
                <p class="font-mono bg-gray-100 p-3 rounded-lg mb-6">${userId}</p>

                <div class="space-y-4">
                    <div>
                        <label for="userName" class="block text-sm font-medium text-gray-700">Nombre</label>
                        <input id="userName" type="text" value="${userName}" class="w-full p-3 border rounded-lg" />
                    </div>
                    <div>
                        <label for="userAge" class="block text-sm font-medium text-gray-700">Edad</label>
                        <input id="userAge" type="number" value="${userAge}" class="w-full p-3 border rounded-lg" />
                    </div>
                    <div>
                        <label for="userStatus" class="block text-sm font-medium text-gray-700">Estado</label>
                        <select id="userStatus" class="w-full p-3 border rounded-lg">
                            <option value="Soltero" ${userStatus === 'Soltero' ? 'selected' : ''}>Soltero</option>
                            <option value="Casado" ${userStatus === 'Casado' ? 'selected' : ''}>Casado</option>
                            <option value="Ligando" ${userStatus === 'Ligando' ? 'selected' : ''}>Ligando</option>
                        </select>
                    </div>
                    <button id="saveProfileBtn" class="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById("saveProfileBtn").addEventListener("click", () => {
        userName = document.getElementById("userName").value;
        userAge = document.getElementById("userAge").value;
        userStatus = document.getElementById("userStatus").value;
        showMessage("Perfil actualizado.");
    });
}

// =============================
// 4. Notificaciones (con cambios)
// =============================
function renderNotifications() {
    appContainer.innerHTML = `
        <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Notificaciones</h1>
            <div class="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto space-y-6">

                <div>
                    <h2 class="text-lg font-semibold mb-2">Hora de notificación (Hora local)</h2>
                    <div class="relative">
                        <input id="notificationTimeInput" type="time" value="${notificationTime}" class="w-full p-3 border rounded-lg" />
                        <p class="mt-2 text-sm text-gray-500">Esto mostrará un mensaje en la aplicación a la hora seleccionada. No es una notificación del sistema.</p>
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-lg font-semibold">Alerta</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="alertA-toggle" class="sr-only peer" ${alertAEnabled ? "checked" : ""}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <p class="text-sm text-gray-700 mb-4" id="alertA-text">Gastar el ${alertAPercentage}% de ingresos</p>
                    <input type="range" id="alertA-slider" min="0" max="100" value="${alertAPercentage}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm text-gray-700">Gastar el <span id="alertB-text">${alertBPercentage}%</span> de ingresos en un día</p>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="alertB-toggle" class="sr-only peer" ${alertBEnabled ? "checked" : ""}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <input type="range" id="alertB-slider" min="0" max="100" value="${alertBPercentage}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>

                <div>
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm text-gray-700">Que una categoría rebase el <span id="alertC-text">${alertCPercentage}%</span> de gastos</p>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="alertC-toggle" class="sr-only peer" ${alertCEnabled ? "checked" : ""}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <input type="range" id="alertC-slider" min="0" max="100" value="${alertCPercentage}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>

            </div>
        </div>
    `;

    // Lógica para el campo de hora
    const timeInput = document.getElementById("notificationTimeInput");
    timeInput.addEventListener("change", (e) => {
        notificationTime = e.target.value;
        showMessage("Hora de notificación guardada.");
    });

    // Lógica para la Alerta A
    const alertAToggle = document.getElementById("alertA-toggle");
    const alertASlider = document.getElementById("alertA-slider");
    const alertAText = document.getElementById("alertA-text");
    alertAToggle.addEventListener("change", (e) => {
        alertAEnabled = e.target.checked;
        showMessage(`Alerta A ${alertAEnabled ? 'activada' : 'desactivada'}.`);
    });
    alertASlider.addEventListener("input", (e) => {
        alertAPercentage = e.target.value;
        alertAText.textContent = `Gastar el ${alertAPercentage}% de ingresos`;
    });

    // Lógica para la Alerta B
    const alertBToggle = document.getElementById("alertB-toggle");
    const alertBSlider = document.getElementById("alertB-slider");
    const alertBText = document.getElementById("alertB-text");
    alertBToggle.addEventListener("change", (e) => {
        alertBEnabled = e.target.checked;
        showMessage(`Alerta B ${alertBEnabled ? 'activada' : 'desactivada'}.`);
    });
    alertBSlider.addEventListener("input", (e) => {
        alertBPercentage = e.target.value;
        alertBText.textContent = `${alertBPercentage}%`;
    });


    // Lógica para la Alerta C
    const alertCToggle = document.getElementById("alertC-toggle");
    const alertCSlider = document.getElementById("alertC-slider");
    const alertCText = document.getElementById("alertC-text");
    alertCToggle.addEventListener("change", (e) => {
        alertCEnabled = e.target.checked;
        showMessage(`Alerta C ${alertCEnabled ? 'activada' : 'desactivada'}.`);
    });
    alertCSlider.addEventListener("input", (e) => {
        alertCPercentage = e.target.value;
        alertCText.textContent = `${alertCPercentage}%`;
    });
}

// =============================
// 5. Configuración (con cambios)
// =============================
function renderSettings() {
    appContainer.innerHTML = `
        <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Configuración</h1>
            <div class="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
                <h2 class="text-xl font-semibold mb-4">Categorías</h2>
                <ul id="categoriesList" class="space-y-2 mb-6">
                    ${categories.map(cat => `
                        <li class="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <span class="w-3 h-3 rounded-full" style="background-color: ${cat.color};"></span>
                                <span>${cat.name} (${cat.type === "income" ? "Ingreso" : "Gasto"})</span>
                            </div>
                            <button class="delete-category-btn text-red-500 hover:text-red-700" data-name="${cat.name}">
                                &times;
                            </button>
                        </li>
                    `).join('')}
                </ul>

                <h2 class="text-xl font-semibold mb-4">Añadir nueva categoría</h2>
                <div class="space-y-4">
                    <input id="newCategoryName" type="text" placeholder="Nombre de la categoría" class="w-full p-3 border rounded-lg">

                    <select id="newCategoryType" class="w-full p-3 border rounded-lg">
                        <option value="income">Ingreso</option>
                        <option value="expense">Gasto</option>
                    </select>

                    <div class="grid grid-cols-6 gap-2">
                        ${[
                            "#e71a1aff", "#1866c5ff", "#16aa3bff", "#9248a5ff", "#f5900bff", "#f04f9fff",
                            "#69a8dbff", "#74e774ff", "#000000ff", "#f2fd5cff", "#00ffd5ff", "#868686ff"
                        ].map(color => `
                            <button class="color-picker-btn w-full h-8 rounded-full border-2 border-transparent focus:border-blue-500" style="background-color: ${color};" data-color="${color}"></button>
                        `).join('')}
                    </div>

                    <button id="addCategoryBtn" class="w-full py-3 bg-blue-500 text-white rounded-lg">Añadir categoría</button>
                </div>
            </div>
        </div>
    `;

    let selectedColor = "#EF4444"; // Color por defecto

    // Manejar selección de color
    document.querySelectorAll(".color-picker-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".color-picker-btn").forEach(b => b.classList.remove("border-blue-500", "scale-110"));
            btn.classList.add("border-blue-500", "scale-110");
            selectedColor = btn.dataset.color;
        });
    });

    // Manejar adición de categoría
    document.getElementById("addCategoryBtn").addEventListener("click", () => {
        const name = document.getElementById("newCategoryName").value.trim();
        const type = document.getElementById("newCategoryType").value;

        if (!name) return showMessage("El nombre no puede estar vacío.");
        if (categories.some(cat => cat.name === name)) return showMessage("Esta categoría ya existe.");

        categories.push({ name, color: selectedColor, type });
        showMessage("Categoría agregada.");
        renderSettings();
    });

    // Manejar eliminación de categoría
    document.querySelectorAll(".delete-category-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const nameToDelete = e.target.dataset.name;
            categories = categories.filter(cat => cat.name !== nameToDelete);
            showMessage("Categoría eliminada.");
            renderSettings();
        });
    });
}


// =============================
// 6. Modificar Historial (con cambios)
// =============================
function renderModifyHistory() {
    appContainer.innerHTML = `
        <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Modificar Historial</h1>
            <div class="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TÍTULO</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MONTO</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORÍA</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHA</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody id="transactionTableBody" class="bg-white divide-y divide-gray-200">
                        ${transactions.map((t, index) => {
                            const sign = t.type === "income" ? "+" : "-";
                            const color = t.type === "income" ? "text-green-500" : "text-red-500";
                            const date = new Date(t.date).toLocaleDateString();
                            return `
                                <tr data-index="${index}">
                                    <td class="px-4 py-4 whitespace-nowrap">${t.title}</td>
                                    <td class="px-4 py-4 whitespace-nowrap ${color}">$${sign}${t.amount.toFixed(2)}</td>
                                    <td class="px-4 py-4 whitespace-nowrap">${t.category}</td>
                                    <td class="px-4 py-4 whitespace-nowrap">${date}</td>
                                    <td class="px-4 py-4 whitespace-nowrap">
                                        <button class="edit-btn text-blue-500 hover:text-blue-700" data-index="${index}">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                        <button class="delete-btn text-red-500 hover:text-red-700" data-index="${index}">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            const transactionToEdit = transactions[index];
            renderEditForm(transactionToEdit, index);
        });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            transactions.splice(index, 1);
            showMessage("Transacción eliminada.");
            renderModifyHistory();
        });
    });
}

// Función para renderizar el formulario de edición (corregida)
function renderEditForm(transaction, index) {
    appContainer.innerHTML = `
        <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Editar Transacción</h1>
            <div class="bg-white p-6 rounded-xl shadow-md">
                <input id="editTitle" value="${transaction.title}" placeholder="Título" class="w-full p-3 mb-4 border rounded-lg" />
                <input id="editAmount" type="number" value="${transaction.amount}" placeholder="Monto" class="w-full p-3 mb-4 border rounded-lg" />
                <input id="editDate" type="date" value="${transaction.date.substring(0, 10)}" class="w-full p-3 mb-4 border rounded-lg" />
                <select id="editCategory" class="w-full p-3 mb-4 border rounded-lg">
                    ${categories.map(cat => `<option value="${cat.name}" ${cat.name === transaction.category ? 'selected' : ''}>${cat.name}</option>`).join("")}
                </select>
                <div class="flex space-x-4 mb-6">
                    <button id="editIncomeBtn" class="flex-1 py-2 rounded-lg transition-colors duration-200">Ingreso</button>
                    <button id="editExpenseBtn" class="flex-1 py-2 rounded-lg transition-colors duration-200">Gasto</button>
                </div>
                <div class="flex space-x-4">
                    <button id="saveEditBtn" class="flex-1 py-3 bg-blue-500 text-white rounded-lg">Guardar Cambios</button>
                    <button id="cancelEditBtn" class="flex-1 py-3 bg-gray-300 text-gray-800 rounded-lg">Cancelar</button>
                </div>
            </div>
        </div>
    `;

    let type = transaction.type;
    const incomeBtn = document.getElementById("editIncomeBtn");
    const expenseBtn = document.getElementById("editExpenseBtn");
    const saveBtn = document.getElementById("saveEditBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");

    function updateButtonStyles() {
        if (type === "income") {
            incomeBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-[#00DB07] text-white";
            expenseBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-gray-200 text-gray-800";
        } else {
            incomeBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-gray-200 text-gray-800";
            expenseBtn.className = "flex-1 py-2 rounded-lg transition-colors duration-200 bg-red-500 text-white";
        }
    }
    updateButtonStyles();

    incomeBtn.onclick = () => {
        type = "income";
        updateButtonStyles();
    };
    expenseBtn.onclick = () => {
        type = "expense";
        updateButtonStyles();
    };

    saveBtn.onclick = () => {
        const title = document.getElementById("editTitle").value.trim();
        const amount = parseFloat(document.getElementById("editAmount").value);
        const date = document.getElementById("editDate").value;
        const category = document.getElementById("editCategory").value;

        if (!title || isNaN(amount) || !category) {
            return showMessage("Datos inválidos. Por favor, completa todos los campos.");
        }

        // Actualizar la transacción en el array
        transactions[index] = { ...transactions[index], title, amount, type, category, date: new Date(date).toISOString() };
        showMessage("Transacción actualizada con éxito.");
        renderModifyHistory();
    };

    cancelBtn.onclick = () => {
        renderModifyHistory();
    };
}

// =============================
// 7. Gráficas Extendidas (con correcciones en botones y visualización)
// =============================
function renderExtendedCharts() {
  appContainer.innerHTML = `
    <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Gráficas Extendidas</h1>
      <div id="chart-options" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button id="totalEvolutionBtn" class="font-bold py-8 px-4 rounded-xl shadow-md text-center transition-colors duration-200">
          Evolución temporal total
        </button>
        <button id="desglosadaBtn" class="font-bold py-8 px-4 rounded-xl shadow-md text-center transition-colors duration-200">
          Evolución temporal desglosada
        </button>
      </div>
      <div id="chart-container" class="bg-white p-6 rounded-xl shadow-md hidden" style="height: 400px;">
        
        <!-- Sección de gráfica -->
        <div id="chartSection" class="relative h-96 hidden">
          <canvas id="evolutionChart"></canvas>
        </div>
        
        <!-- Sección de categorías -->
        <div id="categoriesSection" class="relative h-96 hidden">
          <canvas id="evolutionChart"></canvas>  
          <!-- Aquí se inyectan los botones dinámicamente -->
        </div>
      </div>
    </div>
  `;

  const totalEvolutionBtn = document.getElementById("totalEvolutionBtn");
  const desglosadaBtn = document.getElementById("desglosadaBtn");
  const chartContainer = document.getElementById("chart-container");
  const chartSection = document.getElementById("chartSection");
  const categoriesSection = document.getElementById("categoriesSection");

  function updateButtonStyles(activeBtn) {
    totalEvolutionBtn.className = "font-bold py-8 px-4 rounded-xl shadow-md text-center transition-colors duration-200";
    desglosadaBtn.className = "font-bold py-8 px-4 rounded-xl shadow-md text-center transition-colors duration-200";

    if (activeBtn === 'total') {
      totalEvolutionBtn.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
      desglosadaBtn.classList.add('bg-gray-300', 'text-gray-800', 'hover:bg-gray-400');
    } else if (activeBtn === 'desglosada') {
      totalEvolutionBtn.classList.add('bg-gray-300', 'text-gray-800', 'hover:bg-gray-400');
      desglosadaBtn.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    }
  }

  totalEvolutionBtn.addEventListener("click", () => {
    updateButtonStyles('total');
    chartContainer.classList.remove("hidden");
    chartSection.classList.remove("hidden");
    categoriesSection.classList.add("hidden");
    renderTotalEvolutionChart();
  });

  desglosadaBtn.addEventListener("click", () => {
    updateButtonStyles('desglosada');
    chartContainer.classList.remove("hidden");
    chartSection.classList.add("hidden");
    categoriesSection.classList.remove("hidden");
    renderCategoryButtons();
  });

  // Renderizar por defecto
  if (currentView === 'extendedCharts') {
    updateButtonStyles('total');
    if (transactions.length > 0) {
      chartContainer.classList.remove("hidden");
      chartSection.classList.remove("hidden");
      renderTotalEvolutionChart();
    }
  }
}

function renderCategoryButtons() {
  const categoriesSection = document.getElementById("categoriesSection");
  const chartSection = document.getElementById("chartSection");

  if (categories.length === 0) {
    categoriesSection.innerHTML = `<p class="text-center text-gray-500">No hay categorías para desglosar.</p>`;
    return;
  }

  categoriesSection.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
      ${categories.map(cat => `
          <button id="catBtn-${cat.name}" class="bg-gray-200 text-gray-800 font-bold py-4 px-2 rounded-xl shadow-md text-center hover:bg-gray-300 transition-colors duration-200">
              ${cat.name}
          </button>
      `).join('')}
    </div>
    <p class="text-sm text-gray-500 text-center mb-2">Selecciona una categoría para ver su evolución</p>
  `;

  categories.forEach(cat => {
    const button = document.getElementById(`catBtn-${cat.name}`);
    if (button) {
      button.addEventListener('click', () => {
        chartSection.classList.remove("hidden"); // mostramos la gráfica
        const sampleTransaction = transactions.find(t => t.category === cat.name);
        const isIncome = sampleTransaction && sampleTransaction.type === 'income';
        renderCategoryEvolution(cat.name, isIncome);
      });
    }
  });
}

function renderCategoryEvolution(categoryName, isIncome) {
  const categoryData = {};

  transactions
    .filter(t => t.category === categoryName)
    .forEach(t => {
      const dateOnly = new Date(t.date);
      dateOnly.setHours(0, 0, 0, 0);
      const key = dateOnly.toISOString().split("T")[0];

      if (!categoryData[key]) {
        categoryData[key] = 0;
      }
      categoryData[key] += t.amount;
    });

  const labels = Object.keys(categoryData).sort((a, b) => new Date(a) - new Date(b));
  const data = labels.map(date => categoryData[date]);

  if (window.evolutionChart) {
    window.evolutionChart.destroy();
  }

  const ctx = document.getElementById("evolutionChart").getContext("2d");
  window.evolutionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${categoryName}`,
        data,
        borderColor: isIncome ? "green" : "red",
        backgroundColor: isIncome ? "rgba(28, 204, 28, 0.32)" : "rgba(255, 0, 0, 0.42)",
        tension: 0,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "day" },
          title: {
            display: true,
            text: 'Fecha'
          },
          min: labels.length > 0 ? labels[0] : undefined,
          max: labels.length > 0 ? labels[labels.length - 1] : undefined
        },
        y: {
          title: {
            display: true,
            text: 'Monto ($)'
          },
          beginAtZero: true,
          max: data.length > 0 ? Math.max(...data) * 1.5 : 100
        }
      }
    }
  });
}

function renderTotalEvolutionChart() {
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortedTransactions.length === 0) {
    document.getElementById("chart-container").classList.add("hidden");
    return showMessage("No hay suficientes datos para generar la gráfica.");
  }

  // Agrupar transacciones por día y tipo
  const dailyData = {};
  sortedTransactions.forEach(t => {
    const date = new Date(t.date);
    // Normalizar a fecha sin hora (00:00:00)
    const key = date.toISOString().split("T")[0];

    if (!dailyData[key]) {
      dailyData[key] = { income: 0, expense: 0, date: new Date(key) };
    }

    if (t.type === 'income') {
      dailyData[key].income += t.amount;
    } else if (t.type === 'expense') {
      dailyData[key].expense += t.amount;
    }
  });

  // Construir datasets
  const incomeData = Object.values(dailyData).map(d => ({ x: d.date, y: d.income }));
  const expenseData = Object.values(dailyData).map(d => ({ x: d.date, y: d.expense }));

  // Calcular el monto máximo
  const maxAmount = Math.max(
    ...incomeData.map(d => d.y),
    ...expenseData.map(d => d.y),
    1
  );
  const yAxisMax = maxAmount * 1.5;

  const firstDate = new Date(sortedTransactions[0].date);
  const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);

  const ctx = document.getElementById("evolutionChart").getContext("2d");

  // Si ya existe una instancia previa, destruirla
  if (Chart.getChart("evolutionChart")) {
    Chart.getChart("evolutionChart").destroy();
  }

  window.evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Ingresos',
          data: incomeData,
          borderColor: '#34D399',
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          tension: 0,
          fill: false,
          parsing: false
        },
        {
          label: 'Gastos',
          data: expenseData,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0,
          fill: false,
          parsing: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end'
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day', // un punto por día
            tooltipFormat: 'dd/MM/yyyy',
            displayFormats: {
              day: 'dd MMM yyyy' // Ejemplo: 07 sep 2025
            }
          },
          title: {
            display: true,
            text: 'Fecha'
          },
          min: firstDate,
          max: lastDate
        },
        y: {
          title: {
            display: true,
            text: 'Monto ($)'
          },
          min: 0,
          max: yAxisMax
        }
      }
    }
  });
}

// =============================
// 8. Exportar
// =============================
function renderExportView() {
  appContainer.innerHTML = `
    <div class="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Exportar Datos</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button id="exportCsvBtn" class="bg-green-500 text-white font-bold py-8 px-4 rounded-xl shadow-md text-center hover:bg-green-600 transition-colors duration-200">
          Exportar a CSV
        </button>
        <div class="bg-gray-300 text-gray-800 font-bold py-8 px-4 rounded-xl shadow-md text-center">
          <label for="automaticExportSwitch" class="flex justify-between items-center cursor-pointer">
            <span class="text-lg">Exportado automático</span>
            <div class="relative">
              <input type="checkbox" id="automaticExportSwitch" class="sr-only" />
              <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
              <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform"></div>
            </div>
          </label>
          <div id="frequencyOptions" class="mt-4 hidden">
            <select id="frequencySelect" class="w-full p-2 rounded-lg text-gray-800">
              <option value="daily">Diario</option>
              <option value="weekly">Semanalmente</option>
              <option value="biweekly">Quincenalmente</option>
              <option value="monthly">Mensualmente</option>
            </select>
          </div>
          <div id="subFrequencyOptions" class="mt-4 hidden">
            <select id="subFrequencySelect" class="w-full p-2 rounded-lg text-gray-800"></select>
          </div>
        </div>
      </div>
    </div>
  `;

  // Añadir la lógica de CSS para el interruptor
  const style = document.createElement('style');
  style.innerHTML = `
    #automaticExportSwitch:checked + div.block {
      background-color: #22c55e;
    }
    #automaticExportSwitch:checked + div.block + div.dot {
      transform: translateX(100%);
    }
  `;
  document.head.appendChild(style);

  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    exportToCsv();
  });

  const automaticExportSwitch = document.getElementById("automaticExportSwitch");
  const frequencyOptions = document.getElementById("frequencyOptions");
  const frequencySelect = document.getElementById("frequencySelect");
  const subFrequencyOptions = document.getElementById("subFrequencyOptions");
  const subFrequencySelect = document.getElementById("subFrequencySelect");

  // Función para poblar la segunda lista desplegable
  function populateSubFrequency() {
    const selectedFrequency = frequencySelect.value;
    subFrequencySelect.innerHTML = '';
    
    let options = [];
    if (selectedFrequency === 'daily' || selectedFrequency === 'weekly') {
      options = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    } else if (selectedFrequency === 'biweekly') {
      options = ["Primera y tercera semana", "Segunda y cuarta semana"];
    } else if (selectedFrequency === 'monthly') {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        options.push(i);
      }
    }

    options.forEach(option => {
      const newOption = document.createElement('option');
      newOption.value = option;
      newOption.textContent = option;
      subFrequencySelect.appendChild(newOption);
    });

    if (selectedFrequency !== '') {
      subFrequencyOptions.classList.remove("hidden");
    } else {
      subFrequencyOptions.classList.add("hidden");
    }
  }

  // Cargar la configuración guardada
  const savedExportConfig = JSON.parse(localStorage.getItem('automaticExportConfig')) || {};
  if (savedExportConfig.enabled) {
    automaticExportSwitch.checked = true;
    frequencyOptions.classList.remove("hidden");
    frequencySelect.value = savedExportConfig.frequency || 'daily';
    populateSubFrequency();
    if (savedExportConfig.subFrequency) {
      subFrequencySelect.value = savedExportConfig.subFrequency;
    }
  }

  // Lógica del interruptor
  automaticExportSwitch.addEventListener("change", () => {
    if (automaticExportSwitch.checked) {
      frequencyOptions.classList.remove("hidden");
      populateSubFrequency();
      showMessage("Exportado automático activado.");
    } else {
      frequencyOptions.classList.add("hidden");
      subFrequencyOptions.classList.add("hidden");
      showMessage("Exportado automático desactivado.");
    }
    const config = {
      enabled: automaticExportSwitch.checked,
      frequency: frequencySelect.value,
      subFrequency: frequencySelect.value ? subFrequencySelect.value : null
    };
    localStorage.setItem('automaticExportConfig', JSON.stringify(config));
  });

  // Lógica de la lista desplegable de frecuencia
  frequencySelect.addEventListener("change", () => {
    populateSubFrequency();
    const config = {
      enabled: automaticExportSwitch.checked,
      frequency: frequencySelect.value,
      subFrequency: subFrequencySelect.value
    };
    localStorage.setItem('automaticExportConfig', JSON.stringify(config));
  });

  // Lógica de la segunda lista desplegable
  subFrequencySelect.addEventListener("change", () => {
    const config = {
      enabled: automaticExportSwitch.checked,
      frequency: frequencySelect.value,
      subFrequency: subFrequencySelect.value
    };
    localStorage.setItem('automaticExportConfig', JSON.stringify(config));
  });
}

function exportToCsv() {
  const headers = ["Titulo", "Monto", "Categoria", "Tipo", "Fecha"];
  const rows = transactions.map(t => [t.title, t.amount, t.category, t.type, t.date]);

  let csvContent = headers.join(",") + "\n";
  csvContent += rows.map(e => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "MooneySafe_transacciones.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showMessage("Historial exportado a CSV");
}

// Funcionalidad de Exportado Automático
function scheduleAutomaticExport() {
  const automaticExportConfig = JSON.parse(localStorage.getItem('automaticExportConfig'));
  const lastExportTimestamp = localStorage.getItem('lastExportTimestamp');
  const now = new Date();
  const lastExportDate = lastExportTimestamp ? new Date(parseInt(lastExportTimestamp)) : null;

  // Si no hay configuración o no está habilitada, no hacemos nada
  if (!automaticExportConfig || !automaticExportConfig.enabled) {
    return;
  }

  const { frequency, subFrequency } = automaticExportConfig;

  // Lógica para exportar una vez al día a la medianoche
  const shouldExport = () => {
    if (lastExportDate && now.getFullYear() === lastExportDate.getFullYear() && now.getMonth() === lastExportDate.getMonth() && now.getDate() === lastExportDate.getDate()) {
      return false; // Ya se exportó hoy
    }
    if (now.getHours() !== 0 || now.getMinutes() !== 0 || now.getSeconds() !== 0) {
      return false; // No es medianoche
    }
    return true;
  };

  if (!shouldExport()) {
    return;
  }

  // Lógica para verificar la frecuencia
  let isTimeForExport = false;
  const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const currentDayOfWeek = daysOfWeek[now.getDay()];

  switch (frequency) {
    case 'daily':
    case 'weekly':
      if (currentDayOfWeek === subFrequency) {
        isTimeForExport = true;
      }
      break;
    case 'biweekly':
      const currentWeekNumber = Math.ceil(now.getDate() / 7);
      if (currentDayOfWeek === 'Sábado') {
        if (subFrequency === 'Primera y tercera semana' && (currentWeekNumber === 1 || currentWeekNumber === 3)) {
          isTimeForExport = true;
        } else if (subFrequency === 'Segunda y cuarta semana' && (currentWeekNumber === 2 || currentWeekNumber === 4)) {
          isTimeForExport = true;
        }
      }
      break;
    case 'monthly':
      if (now.getDate() == parseInt(subFrequency)) {
        isTimeForExport = true;
      }
      break;
  }

  if (isTimeForExport) {
    exportToCsv();
    localStorage.setItem('lastExportTimestamp', now.getTime());
  }
}

// =============================
// Inicializar
// =============================
document.addEventListener('DOMContentLoaded', () => {
    // ... (el resto de tu código de inicialización) ...
    scheduleAutomaticExport();
    renderView();
});
