function renderApp() {
  document.getElementById("app").innerHTML = `
    <div class="app">

      <aside class="sidebar">
        <div class="brand">
          <h2>🚛 YMS</h2>
          <span>Sistema Logístico</span>
        </div>

        <nav class="menu">
          <button onclick="window.loadPage('dashboard')">📊 Dashboard</button>
          <button onclick="window.loadPage('agenda')">📅 Agenda</button>
          <button onclick="window.loadPage('separacao')">📦 Separação</button>
          <button onclick="window.loadPage('expedicao')">🚚 Expedição</button>
          <button onclick="window.loadPage('patio')">🏢 Pátio</button>
          <button onclick="window.loadPage('docas')">🚪 Docas</button>
          <button onclick="window.loadPage('checkin')">📝 Check-in</button>
          <button onclick="window.loadPage('relatorios')">📈 Relatórios</button>
          <button onclick="window.loadPage('admin')">⚙️ Admin</button>
        </nav>
      </aside>

      <main class="main">
        <div class="topbar">
          <h1 id="pageTitle">Dashboard</h1>
        </div>

        <div id="content"></div>
      </main>

    </div>
  `;

  // controle de páginas
  window.loadPage = (page) => {
    const map = {
      dashboard: renderDashboard,
      agenda: renderAgenda,
      separacao: renderSeparacao,
      expedicao: renderExpedicao,
      patio: renderPatio,
      docas: renderDocas,
      checkin: renderCheckin,
      relatorios: renderRelatorios,
      admin: renderAdmin
    };

    document.getElementById("pageTitle").textContent =
      page.charAt(0).toUpperCase() + page.slice(1);

    map[page]();
  };

  window.loadPage("dashboard");
}
