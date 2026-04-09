export async function renderDashboard() {
  document.getElementById("content").innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <h3>Total DTs</h3>
        <div class="value">120</div>
      </div>

      <div class="kpi-card">
        <h3>Em Separação</h3>
        <div class="value">30</div>
      </div>

      <div class="kpi-card">
        <h3>No Pátio</h3>
        <div class="value">15</div>
      </div>

      <div class="kpi-card">
        <h3>Expedidos</h3>
        <div class="value">75</div>
      </div>
    </div>
  `;
}
