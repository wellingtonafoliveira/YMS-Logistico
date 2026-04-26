const ADMIN_CREATE_USER_ENDPOINT = "https://jwprwgptefhvqzdewnfr.supabase.co/functions/v1/admin-create-user";
const ADMIN_DISABLE_USER_ENDPOINT = "https://jwprwgptefhvqzdewnfr.supabase.co/functions/v1/admin-disable-user";
const ADMIN_RESET_PASSWORD_ENDPOINT = "https://jwprwgptefhvqzdewnfr.supabase.co/functions/v1/admin-reset-password";
    let usuariosAdmin = [];


    let registros = [];
    let realtimeChannel = null;
    let usuarioPerfil = null;
    let conferentes = [];
    let docas = [];
    const DOCA_TOTAL_PADRAO = 39;

    function extrairNumeroDoca(valor){
      if(valor === null || valor === undefined) return null;
      const match = String(valor).match(/\d+/);
      if(!match) return null;
      const numero = Number(match[0]);
      return Number.isFinite(numero) ? numero : null;
    }

    function compararDocas(a, b){
      const na = extrairNumeroDoca(a);
      const nb = extrairNumeroDoca(b);

      if(na !== null && nb !== null) return na - nb;
      if(na !== null) return -1;
      if(nb !== null) return 1;

      return String(a || "").localeCompare(String(b || ""), "pt-BR", { numeric:true, sensitivity:"base" });
    }

    function getDocasOrdenadas(){
      const mapa = new Map();

      (docas || []).forEach(d => {
        const nomeOriginal = String(d?.nome || "").trim();
        const numero = extrairNumeroDoca(nomeOriginal);

        if(numero !== null && numero >= 1 && numero <= DOCA_TOTAL_PADRAO && !mapa.has(numero)){
          mapa.set(numero, {
            ...d,
            numero,
            nome_original: nomeOriginal,
            nome_exibicao: `Doca ${numero}`
          });
        }
      });

      const lista = [];
      for(let i = 1; i <= DOCA_TOTAL_PADRAO; i++){
        if(mapa.has(i)){
          lista.push(mapa.get(i));
        }else{
          lista.push({
            id: `virtual-${i}`,
            nome: String(i),
            numero: i,
            nome_original: String(i),
            nome_exibicao: `Doca ${i}`,
            ativo: true,
            virtual: true
          });
        }
      }

      return lista;
    }

    let dtAtual = null;
    let viewAtualGlobal = "dashboard";
    let chartHE = null;
    let chartHO = null;
    let chartCarrosTurno = null;
    let chartTonelagemTurno = null;
    let chartResultadoSepHE = null;
    let chartResultadoSepHO = null;
    let chartPassagemQuadro = null;
    let chartPassagemFerias = null;
    let chartPassagemAusencias = null;
    let chartPassagemBancoHoras = null;
    let chartPassagemFeriasIndicador = null;
    let chartPassagemAusenciasIndicador = null;
    let chartPassagemBancoHorasIndicador = null;
    let passagemSubViewAtual = 'lancamento';
    let agendaFiltroKpi = "";
    let patioFilaRegistros = [];
    let docaAuditorias = [];
    let auditoriaDocaAtual = null;
    let docaEdicaoAtual = null;
    const TEMPO_MEDIO_FILA_MIN = 20;

    function getKpiIcon(name){
      const icons = {
        calendar:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M3 10h18"></path><path d="M8 3v4"></path><path d="M16 3v4"></path></svg>`,
        package:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7.5 12 12 4 7.5 12 3Z"></path><path d="M20 7.5V16.5L12 21"></path><path d="M4 7.5V16.5L12 21"></path><path d="M12 12v9"></path></svg>`,
        checkSquare:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"></rect><path d="m9 12 2 2 4-5"></path></svg>`,
        yard:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18V8l8-4 8 4v10"></path><path d="M8 18v-4h8v4"></path><path d="M7.5 12h.01"></path><path d="M12 12h.01"></path><path d="M16.5 12h.01"></path></svg>`,
        dock:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="16" rx="2"></rect><rect x="14" y="4" width="6" height="16" rx="2"></rect><path d="M10 8h4"></path><path d="M10 16h4"></path></svg>`,
        truck:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h10v8H3z"></path><path d="M13 10h4l3 3v3h-7z"></path><circle cx="8" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>`,
        outbound:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>`,
        time:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v5l3 2"></path></svg>`,
        pin:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"></path><circle cx="12" cy="10" r="2.3"></circle></svg>`,
        weight:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10l2 11H5L7 8Z"></path><path d="M10 8a2 2 0 1 1 4 0"></path></svg>`,
        chart:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"></path><path d="M7 16V9"></path><path d="M12 16V5"></path><path d="M17 16v-7"></path></svg>`,
        driver:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M5 20c1.5-3 4-5 7-5s5.5 2 7 5"></path></svg>`,
        warning:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 21 20H3L12 4Z"></path><path d="M12 9v5"></path><path d="M12 17h.01"></path></svg>`
      };
      return icons[name] || icons.chart;
    }

    const STATUS_RULES = {
      "Agendado":["Em Separação","Pronto Expedição","No Pátio"],
      "Em Separação":["Separado","Agendado"],
      "Separado":["Pronto Expedição","Em Separação"],
      "Pronto Expedição":["No Pátio","Separado"],
      "No Pátio":["Em Doca","Pronto Expedição"],
      "Em Doca":["Em Carregamento","No Pátio"],
      "Em Carregamento":["Expedido","Em Doca"],
      "Expedido":[]
    };

    
    function getPremiumChartOptions(){
      return {
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{
            labels:{
              color:'#eef4ff',
              usePointStyle:true,
              pointStyle:'circle',
              boxWidth:10,
              boxHeight:10,
              padding:16,
              font:{ weight:'700', size:12 }
            }
          },
          tooltip:{
            backgroundColor:'rgba(7,12,22,.96)',
            borderColor:'rgba(148,163,184,.20)',
            borderWidth:1,
            titleColor:'#ffffff',
            bodyColor:'#dbe7ff',
            displayColors:true,
            padding:12,
            cornerRadius:14
          }
        },
        scales:{
          x:{
            ticks:{ color:'#9fb0ca', font:{ weight:'700', size:11 } },
            grid:{ color:'rgba(255,255,255,.04)', drawBorder:false },
            border:{ display:false }
          },
          y:{
            ticks:{ color:'#9fb0ca', font:{ weight:'700', size:11 } },
            grid:{ color:'rgba(255,255,255,.05)', drawBorder:false },
            border:{ display:false }
          }
        }
      };
    }

    function mergeChartOptions(base, extra){
      const cloned = JSON.parse(JSON.stringify(base));
      if(extra && extra.scales){
        cloned.scales = { ...(cloned.scales||{}), ...(extra.scales||{}) };
        if(extra.scales.x) cloned.scales.x = { ...(cloned.scales.x||{}), ...(extra.scales.x||{}) };
        if(extra.scales.y) cloned.scales.y = { ...(cloned.scales.y||{}), ...(extra.scales.y||{}) };
      }
      if(extra && extra.plugins){
        cloned.plugins = { ...(cloned.plugins||{}), ...(extra.plugins||{}) };
      }
      for(const k in (extra||{})){
        if(!['scales','plugins'].includes(k)) cloned[k] = extra[k];
      }
      return cloned;
    }

    function fmtBoolAtivo(v){
      return v ? "Sim" : "Não";
    }

    async function carregarUsuariosAdmin(){
      if(usuarioPerfil !== "admin") return;
      const status = document.getElementById("statusUsuarioAdmin");
      if(status) status.textContent = "Carregando usuários...";
      const { data, error } = await sb
        .from("usuarios")
        .select("id,nome,email,perfil,ativo,created_at")
        .order("created_at", { ascending:false });

      if(error){
        console.error(error);
        if(status) status.textContent = "Erro ao carregar usuários.";
        return;
      }

      usuariosAdmin = data || [];
      document.getElementById("adminUsuariosRef").textContent = usuariosAdmin.length;
      document.getElementById("usuariosSoftStat").textContent = `${usuariosAdmin.length} usuários`;
      document.getElementById("listaUsuariosAdmin").innerHTML = usuariosAdmin.map(u => {
        const isSelf = u.email === document.getElementById("userEmail").textContent;
        const acaoAtivo = u.ativo ? "Desativar" : "Reativar";
        const classeAtivo = u.ativo ? "red" : "green";
        return `
        <tr>
          <td>${esc(u.nome)}</td>
          <td>${esc(u.email)}</td>
          <td>${esc(u.perfil)}</td>
          <td>${esc(fmtBoolAtivo(u.ativo))}</td>
          <td>${fmtDateTime(u.created_at)}</td>
          <td>
            <div class="mini-actions">
              <button class="mini ${classeAtivo}" onclick="toggleUsuarioAtivoAdmin('${u.id}', ${u.ativo ? "false" : "true"}, '${esc(u.email)}')" ${isSelf ? "disabled title='Não é permitido desativar seu próprio usuário'" : ""}>${acaoAtivo}</button>
              <button class="mini blue" onclick="redefinirSenhaAdmin('${u.id}', '${esc(u.email)}')">Redefinir senha</button>
            </div>
          </td>
        </tr>`;
      }).join("");

      if(status) status.textContent = "Lista atualizada.";
    }

    async function criarUsuarioAdmin(){
      if(!requirePermission("admin", "Apenas admin pode cadastrar usuários.")) return;

      const nome = document.getElementById("u_nome").value.trim();
      const email = document.getElementById("u_email").value.trim().toLowerCase();
      const senha = document.getElementById("u_senha").value;
      const perfil = document.getElementById("u_perfil").value;
      const ativo = document.getElementById("u_ativo").value === "true";
      const status = document.getElementById("statusUsuarioAdmin");

      if(!nome || !email || !senha){
        if(status) status.textContent = "Preencha nome, email e senha inicial.";
        return alert("Preencha nome, email e senha inicial.");
      }

      await carregarUsuariosAdmin();
      const usuarioExistenteTela = (usuariosAdmin || []).find(u => String(u.email || "").toLowerCase() === email);
      if(usuarioExistenteTela){
        const msg = usuarioExistenteTela.ativo
          ? "Este e-mail já está cadastrado no sistema. Use redefinição de senha."
          : "Este e-mail já existe e está inativo. Reative o usuário existente.";
        if(status) status.textContent = msg;
        return alert(msg);
      }

      if(!ADMIN_CREATE_USER_ENDPOINT){
        if(status) status.textContent = "Defina o endpoint seguro de criação de usuário no arquivo.";
        return alert("Configure o endpoint seguro de criação de usuário antes de usar esta função.");
      }

      try{
        if(status) status.textContent = "Cadastrando usuário...";

        const { data: sessao } = await sb.auth.getSession();
        const token = sessao?.session?.access_token || "";
        if(!token){
          if(status) status.textContent = "Sessão inválida. Faça login novamente.";
          return alert("Sessão inválida. Faça login novamente.");
        }

        const resp = await fetch(ADMIN_CREATE_USER_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ nome, email, senha, perfil, ativo })
        });

        const result = await resp.json().catch(() => ({}));

        if(!resp.ok){
          console.error(result);
          const erro = String(result?.error || result?.message || "");
          if(
            erro.toLowerCase().includes("already been registered") ||
            erro.toLowerCase().includes("already registered") ||
            erro.toLowerCase().includes("already exists")
          ){
            const msg = "Este e-mail já existe no Auth. Reative o usuário existente ou use redefinição de senha.";
            if(status) status.textContent = msg;
            await carregarUsuariosAdmin();
            return alert(msg);
          }
          if(status) status.textContent = erro || "Erro ao cadastrar usuário.";
          return alert(erro || "Erro ao cadastrar usuário.");
        }

        document.getElementById("u_nome").value = "";
        document.getElementById("u_email").value = "";
        document.getElementById("u_senha").value = "";
        document.getElementById("u_perfil").value = "operacao";
        document.getElementById("u_ativo").value = "true";

        registrarLogSistema("usuario_criado", `Usuário ${email} criado com perfil ${perfil}`);
        if(status) status.textContent = "Usuário cadastrado com sucesso.";
        showToast("Usuário cadastrado com sucesso");
        await carregarUsuariosAdmin();
      }catch(err){
        console.error(err);
        if(status) status.textContent = "Erro ao chamar endpoint de criação.";
        alert("Erro ao criar usuário.");
      }
    }



    async function toggleUsuarioAtivoAdmin(userId, novoStatus, email){
      if(!requirePermission("admin", "Apenas admin pode alterar usuários.")) return;
      const status = document.getElementById("statusUsuarioAdmin");
      const acao = novoStatus ? "reativar" : "desativar";

      if(!confirm(`Confirma ${acao} o usuário ${email}?`)) return;

      try{
        if(status) status.textContent = `${acao.charAt(0).toUpperCase() + acao.slice(1)}ndo usuário...`;
        const { data: sessao } = await sb.auth.getSession();
        const token = sessao?.session?.access_token || "";

        const resp = await fetch(ADMIN_DISABLE_USER_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, ativo: novoStatus })
        });

        const result = await resp.json().catch(() => ({}));

        if(!resp.ok){
          console.error(result);
          if(status) status.textContent = result.error || `Erro ao ${acao} usuário.`;
          return alert(result.error || `Erro ao ${acao} usuário.`);
        }

        if(status) status.textContent = `Usuário ${novoStatus ? "reativado" : "desativado"} com sucesso.`;
        showToast(`Usuário ${novoStatus ? "reativado" : "desativado"} com sucesso`);
        await carregarUsuariosAdmin();
      }catch(err){
        console.error(err);
        if(status) status.textContent = "Erro ao chamar endpoint de atualização de usuário.";
        alert("Erro ao atualizar usuário.");
      }
    }

    async function redefinirSenhaAdmin(userId, email){
      if(!requirePermission("admin", "Apenas admin pode redefinir senha.")) return;
      const status = document.getElementById("statusUsuarioAdmin");
      const novaSenha = prompt(`Informe a nova senha para ${email}:`);

      if(novaSenha === null) return;
      if(!novaSenha || novaSenha.length < 6){
        return alert("A nova senha deve ter pelo menos 6 caracteres.");
      }

      try{
        if(status) status.textContent = "Redefinindo senha...";
        const { data: sessao } = await sb.auth.getSession();
        const token = sessao?.session?.access_token || "";

        const resp = await fetch(ADMIN_RESET_PASSWORD_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, nova_senha: novaSenha })
        });

        const result = await resp.json().catch(() => ({}));

        if(!resp.ok){
          console.error(result);
          if(status) status.textContent = result.error || "Erro ao redefinir senha.";
          return alert(result.error || "Erro ao redefinir senha.");
        }

        if(status) status.textContent = "Senha redefinida com sucesso.";
        showToast("Senha redefinida com sucesso");
      }catch(err){
        console.error(err);
        if(status) status.textContent = "Erro ao chamar endpoint de redefinição de senha.";
        alert("Erro ao redefinir senha.");
      }
    }

    try{
      const savedSidebar = localStorage.getItem("glp_sidebar_collapsed");
      const appEl = document.getElementById("app");
      if(appEl){
        if(window.innerWidth <= 900){
          appEl.classList.add("sidebar-collapsed");
        }else if(savedSidebar === "1"){
          appEl.classList.add("sidebar-collapsed");
        }else{
          appEl.classList.remove("sidebar-collapsed");
        }
      }
    }catch(_){}


    function atualizarVisibilidadeStatusConexao(){
      const card = document.getElementById("statusConexaoCard");
      if(!card) return;
      card.classList.toggle("hidden", viewAtualGlobal !== "admin");
    }

    function atualizarIconesSidebar(){
      const app = document.getElementById("app");
      const recolhido = !!app?.classList.contains("sidebar-collapsed");
      const sidebarBtn = document.getElementById("sidebarToggle");
      const topbarBtn = document.getElementById("topbarMenuToggle");
      const sidebarIcon = document.getElementById("sidebarToggleIcon");
      const topbarIcon = document.getElementById("topbarMenuToggleIcon");
      const backdrop = document.getElementById("sidebarBackdrop");
      const mobile = window.matchMedia("(max-width: 900px)").matches;

      if(sidebarBtn){
        sidebarBtn.title = recolhido ? "Expandir menu lateral" : "Recolher menu lateral";
        sidebarBtn.setAttribute("aria-label", sidebarBtn.title);
      }
      if(topbarBtn){
        topbarBtn.title = recolhido ? "Abrir menu lateral" : "Fechar menu lateral";
        topbarBtn.setAttribute("aria-label", topbarBtn.title);
      }

      if(sidebarIcon) sidebarIcon.textContent = recolhido ? "❯" : "❮";
      if(topbarIcon) topbarIcon.textContent = mobile ? (recolhido ? "☰" : "✕") : (recolhido ? "❯" : "❮");

      if(backdrop){
        backdrop.classList.toggle("show", mobile && !recolhido);
        backdrop.classList.toggle("hidden", !(mobile && !recolhido));
      }
    }

    function alternarSidebar(forceState){
      const app = document.getElementById("app");
      if(!app) return;

      const mobile = window.matchMedia("(max-width: 900px)").matches;
      if(typeof forceState === "boolean"){
        app.classList.toggle("sidebar-collapsed", forceState);
      }else{
        app.classList.toggle("sidebar-collapsed");
      }

      const recolhido = app.classList.contains("sidebar-collapsed");
      try{
        localStorage.setItem("glp_sidebar_collapsed", recolhido ? "1" : "0");
      }catch(_){}

      if(mobile){
        const backdrop = document.getElementById("sidebarBackdrop");
        if(backdrop){
          backdrop.classList.toggle("hidden", recolhido);
          backdrop.classList.toggle("show", !recolhido);
        }
      }

      atualizarIconesSidebar();
    }

    const STAGES = ["Agendado","Em Separação","Separado","Pronto Expedição","No Pátio","Em Doca","Em Carregamento","Expedido"];
    const STAGE_COLOR_CLASS = {
      "Agendado":"stage-gray",
      "Em Separação":"stage-orange",
      "Separado":"stage-green",
      "Pronto Expedição":"stage-cyan",
      "No Pátio":"stage-blue",
      "Em Doca":"stage-purple",
      "Em Carregamento":"stage-cyan",
      "Expedido":"stage-green"
    };

    const ROLE_PERMISSIONS = {
      admin: {
        label: "Admin",
        admin: true,
        agenda_edit: true,
        patio_operate: true,
        checkin_operate: true,
        dt_edit: true,
        relatorios_view: true,
        cadastros_edit: true,
        import_excel: true,
        read_only: false
      },
      gestao: {
        label: "Gestão",
        admin: false,
        agenda_edit: false,
        patio_operate: false,
        checkin_operate: false,
        dt_edit: false,
        relatorios_view: true,
        cadastros_edit: false,
        import_excel: false,
        read_only: true
      },
      assistente: {
        label: "Assistente",
        admin: false,
        agenda_edit: true,
        patio_operate: true,
        checkin_operate: true,
        dt_edit: true,
        relatorios_view: true,
        cadastros_edit: true,
        import_excel: false,
        read_only: false
      },
      operacao: {
        label: "Assistente",
        admin: false,
        agenda_edit: true,
        patio_operate: true,
        checkin_operate: true,
        dt_edit: true,
        relatorios_view: true,
        cadastros_edit: true,
        import_excel: false,
        read_only: false
      },
      portaria: {
        label: "Assistente",
        admin: false,
        agenda_edit: true,
        patio_operate: true,
        checkin_operate: true,
        dt_edit: true,
        relatorios_view: true,
        cadastros_edit: true,
        import_excel: false,
        read_only: false
      }
    };

    function getRolePermissions(){
      return ROLE_PERMISSIONS[usuarioPerfil] || ROLE_PERMISSIONS.assistente;
    }

    function can(permission){
      const perms = getRolePermissions();
      return !!perms[permission];
    }

    function requirePermission(permission, mensagem){
      if(can(permission)) return true;
      alert(mensagem || "Seu perfil não possui permissão para esta ação.");
      return false;
    }

    function actionDisabledAttr(row, status){
      const perms = getRolePermissions();
      const disabled = perms.read_only || !podeTransicionar(row?.status_global || "Agendado", status);
      return disabled ? "disabled" : "";
    }

    function getActionHint(row, status){
      if((getRolePermissions() || {}).read_only) return "Somente leitura";
      const atual = row?.status_global || "Agendado";
      if(!podeTransicionar(atual, status)) return `Fluxo: ${atual} não avança direto para ${status}`;
      return "";
    }

    function renderTransitionButton(row, status, label, klass){
      const hint = getActionHint(row, status);
      const disabled = actionDisabledAttr(row, status);
      return `<button class="mini ${klass}" onclick="mudarStatus('${esc(row.id)}','${esc(status)}')" ${disabled} title="${esc(hint || '')}">${label}</button>`;
    }

    function getFilaPriorityLabel(item){
      const pr = Number(item?.prioridade || 0);
      if(pr >= 8) return "Prioridade crítica";
      if(pr >= 5) return "Prioridade alta";
      if(pr >= 2) return "Prioridade média";
      return "Fluxo normal";
    }

    function getDockPlannedState(nome, rows){
      const ocupada = rows.find(r => (r.doca_carregamento || r.doca_agenda || r.doca_planejada) === nome && ["Em Doca","Em Carregamento"].includes(r.status_global));
      if(ocupada) return { kind:"busy", label:"Ocupada", row:ocupada };
      const finalizando = rows.find(r => (r.doca_carregamento || r.doca_agenda || r.doca_planejada) === nome && r.status_global === "Expedido");
      if(finalizando) return { kind:"finishing", label:"Finalizando", row:finalizando };
      const reservada = rows.find(r => (r.doca_agenda || r.doca_planejada) === nome && ["Agendado","Em Separação","Separado","Pronto Expedição","No Pátio"].includes(r.status_global));
      if(reservada) return { kind:"reserved", label:"Reservada", row:reservada };
      return { kind:"free", label:"Livre", row:null };
    }

    function clsStatus(s){
      return {
        "Agendado":"st-agendado",
        "Em Separação":"st-separacao",
        "Separado":"st-separado",
        "Pronto Expedição":"st-pronto",
        "No Pátio":"st-patio",
        "Em Doca":"st-doca",
        "Em Carregamento":"st-carregando",
        "Expedido":"st-expedido"
      }[s] || "st-agendado";
    }

    function num(v){
      if(v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    function esc(v){
      return String(v ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }


    function valorTempoCarregamento(row){
      return row?.TEMPODECARREGAMENTO ?? row?.tempodecarregamento ?? null;
    }

    function valorTerminoPrevisto(row){
      return row?.["TÉRMINOPREVISTO"] ?? row?.TERMINOPREVISTO ?? row?.terminoprevisto ?? null;
    }

    function formatTerminoPrevistoAgenda(valor){
      if(!valor) return "-";
      const texto = String(valor).trim();
      if(!texto) return "-";
      const d = new Date(texto.replace(" ", "T"));
      if(!isNaN(d) && /\d{4}-\d{2}-\d{2}/.test(texto)){
        return d.toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" });
      }
      return texto;
    }

    function formatPlacas(row){
      return [row?.placa_cavalo, row?.placa_carreta, row?.placa_reboque_1, row?.placa_reboque_2]
        .filter(Boolean)
        .join(" / ");
    }

    function normalizarTelefone(v){
      return String(v || "").replace(/\D/g, "");
    }

    function formatarTelefoneVisual(valor){
      const numeros = normalizarTelefone(valor).slice(0, 11);
      if(numeros.length <= 2) return numeros;
      if(numeros.length <= 7) return `(${numeros.slice(0,2)}) ${numeros.slice(2)}`;
      const parte1 = numeros.slice(2, numeros.length === 10 ? 6 : 7);
      const parte2 = numeros.slice(numeros.length === 10 ? 6 : 7);
      return `(${numeros.slice(0,2)}) ${parte1}-${parte2}`;
    }

    function aplicarMascaraTelefone(id){
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener("input", () => {
        el.value = formatarTelefoneVisual(el.value);
      });
    }

    function applyMascaraTelefone(id){
      return aplicarMascaraTelefone(id);
    }

    function getTelefoneMotorista(row){
      return row?.telefone_motorista || row?.telefone || "";
    }

    function abrirWhatsApp(telefone, mensagem){
      const tel = normalizarTelefone(telefone);
      if(!tel){
        alert("Telefone do motorista não disponível para envio de mensagem.");
        return;
      }
      const texto = encodeURIComponent(mensagem || "Favor seguir para a próxima etapa operacional.");
      window.open(`https://wa.me/55${tel}?text=${texto}`, "_blank");
    }

    function fmtDate(v){
      if(!v) return "";
      const d = new Date(v);
      return isNaN(d) ? v : d.toLocaleDateString("pt-BR");
    }

    function fmtDateTime(v){
      if(!v) return "";
      const d = new Date(v);
      return isNaN(d) ? v : d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
    }

    function toInputDateTime(v){
      if(!v) return "";
      const d = new Date(v);
      if(isNaN(d)) return "";
      const p = n => String(n).padStart(2,"0");
      return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }

    function dataFiltrada(){ return document.getElementById("filtroData").value; }

function getFiltroDataValue(){
  return document.getElementById('filtroData')?.value || '';
}

function syncFiltroDataAcrossViews(value = ''){
  const data = value || getFiltroDataValue() || '';
  const passagemData = document.getElementById('passagemData');
  if(passagemData && !passagemData.dataset.userLocked){
    passagemData.value = data || passagemData.value || '';
  }
  const agendaDataRef = document.getElementById('agendaDataRef');
  if(agendaDataRef){
    agendaDataRef.textContent = data ? fmtDate(data) : 'Todos';
  }
}


    function linhasFiltradas(){ const d = dataFiltrada(); return d ? registros.filter(r => r.data_agenda === d) : registros; }

    function currentUserLabel(){
      return document.getElementById("userEmail")?.textContent || document.getElementById("userNome")?.textContent || "sistema";
    }

    function registrarLogSistema(acao, detalhes){
      try{
        const logs = JSON.parse(localStorage.getItem("glp_logs") || "[]");
        logs.unshift({
          data: new Date().toISOString(),
          acao,
          usuario: currentUserLabel(),
          detalhes
        });
        localStorage.setItem("glp_logs", JSON.stringify(logs.slice(0, 300)));
      }catch(_){}
    }

    function getAgendaRows(){
      let rows = linhasFiltradas().slice();
      const busca = (document.getElementById("agendaFiltroBusca")?.value || "").trim().toLowerCase();
      const status = document.getElementById("agendaFiltroStatus")?.value || "";
      const transportadora = (document.getElementById("agendaFiltroTransportadora")?.value || "").trim().toLowerCase();
      const doca = (document.getElementById("agendaFiltroDoca")?.value || "").trim().toLowerCase();
      const risco = document.getElementById("agendaFiltroRisco")?.value || "";

      if(busca){
        rows = rows.filter(r => [r.dt, r.cliente, r.transportadora].some(v => String(v || "").toLowerCase().includes(busca)));
      }
      if(status){
        rows = rows.filter(r => r.status_global === status);
      }
      if(agendaFiltroKpi){
        if(agendaFiltroKpi === "Atrasado"){
          rows = rows.filter(r => calcSla(r).label === "Atrasado");
        }else if(agendaFiltroKpi === "Sem doca"){
          rows = rows.filter(r => !(r.doca_agenda || r.doca_planejada || r.doca_carregamento));
        }else{
          rows = rows.filter(r => r.status_global === agendaFiltroKpi);
        }
      }
      if(transportadora){
        rows = rows.filter(r => String(r.transportadora || "").toLowerCase().includes(transportadora));
      }
      if(doca){
        rows = rows.filter(r => [r.doca_agenda, r.doca_planejada, r.doca_carregamento].some(v => String(v || "").toLowerCase().includes(doca)));
      }
      if(risco === "atraso"){
        rows = rows.filter(r => calcSla(r).label === "Atrasado");
      }else if(risco === "sem_doca"){
        rows = rows.filter(r => !(r.doca_agenda || r.doca_planejada || r.doca_carregamento));
      }else if(risco === "conflito"){
        const conflitos = detectarConflitosAgenda(rows);
        const ids = new Set(conflitos.map(x => x.id));
        rows = rows.filter(r => ids.has(r.id));
      }
      return rows;
    }

    function detectarConflitosAgenda(baseRows = linhasFiltradas()){
      const conflitos = [];
      const mapa = new Map();
      baseRows.forEach(r => {
        const doca = r.doca_agenda || r.doca_planejada || "";
        const data = r.data_agenda || "";
        const hora = r.hora_agenda || "";
        if(!doca || !data || !hora) return;
        const key = `${doca}__${data}__${hora}`;
        if(mapa.has(key)){
          conflitos.push(r, mapa.get(key));
        }else{
          mapa.set(key, r);
        }
      });
      const dedup = new Map();
      conflitos.forEach(c => dedup.set(c.id, c));
      return [...dedup.values()];
    }

    function validarNovaAgenda(payload){
      const erros = [];
      if(!payload.dt) erros.push("Informe a DT.");
      if(!payload.data_agenda) erros.push("Informe a data da agenda.");
      if(!payload.hora_agenda) erros.push("Informe a hora da agenda.");
      if(!payload.transportadora) erros.push("Informe a transportadora.");
      if(!payload.cliente) erros.push("Informe o cliente.");
      const duplicada = registros.find(r => String(r.dt||"") === String(payload.dt||"") && (r.data_agenda || "") === (payload.data_agenda || ""));
      if(duplicada) erros.push(`Já existe uma DT ${payload.dt} para a data ${fmtDate(payload.data_agenda)}.`);
      if(payload.doca_agenda && payload.data_agenda && payload.hora_agenda){
        const conflito = registros.find(r =>
          (r.doca_agenda || r.doca_planejada || "") === payload.doca_agenda &&
          (r.data_agenda || "") === payload.data_agenda &&
          (r.hora_agenda || "") === payload.hora_agenda
        );
        if(conflito) erros.push(`Conflito de doca: ${payload.doca_agenda} já está reservada para a DT ${conflito.dt} nesse horário.`);
      }
      return erros;
    }

    function podeTransicionar(atual, proximo){
      if(atual === proximo) return true;
      return (STATUS_RULES[atual] || []).includes(proximo);
    }

    function automacoesStatus(row, status){
      const payload = { status_global: status };
      if(status === "Em Separação" && !row.inicio_separacao) payload.inicio_separacao = new Date().toISOString();
      if(status === "Separado" && !row.fim_separacao) payload.fim_separacao = new Date().toISOString();
      if(status === "Pronto Expedição" && !row.fim_separacao) payload.fim_separacao = row.fim_separacao || new Date().toISOString();
      if(status === "No Pátio" && !row.chegada_motorista) payload.chegada_motorista = new Date().toISOString();
      if(status === "Em Doca" && !row.data_em_doca) payload.data_em_doca = new Date().toISOString();
      if(status === "Em Carregamento" && !row.inicio_carregamento) payload.inicio_carregamento = new Date().toISOString();
      if(status === "Expedido" && !row.fim_carregamento) payload.fim_carregamento = new Date().toISOString();
      if(status === "Expedido" && !row.turno_expedido){
        const baseHora = payload.fim_carregamento ? new Date(payload.fim_carregamento) : new Date();
        const hh = String(baseHora.getHours()).padStart(2,'0');
        const mm = String(baseHora.getMinutes()).padStart(2,'0');
        payload.turno_expedido = definirTurno(`${hh}:${mm}`);
      }
      return payload;
    }

    function detectarConflitosAgenda(rows){
      const mapa = new Map();
      const conflitos = [];
      (rows || []).forEach(r => {
        const docaRef = r.doca_agenda || r.doca_planejada || r.doca_carregamento;
        if(!r.data_agenda || !r.hora_agenda || !docaRef) return;
        const chave = `${r.data_agenda}|${r.hora_agenda}|${docaRef}`;
        if(!mapa.has(chave)) mapa.set(chave, []);
        mapa.get(chave).push(r);
      });
      mapa.forEach(lista => {
        if(lista.length > 1) conflitos.push(...lista);
      });
      return conflitos;
    }

    function getDashboardExceptionsData(rows){
      const conflitos = detectarConflitosAgenda(rows);
      const conflitoIds = new Set(conflitos.map(r => r.id));
      return [
        {
          label:"Atrasadas",
          value: rows.filter(r => calcSla(r).label === "Atrasado").length,
          detail:"fora do SLA",
          cls:"status-red",
          icon:getKpiIcon("time"),
          filter:() => { agendaFiltroKpi = "Atrasado"; setView('agenda', document.getElementById('menu-agenda')); renderAgenda(); renderDashboard(); }
        },
        {
          label:"Sem doca",
          value: rows.filter(r => !(r.doca_agenda || r.doca_planejada || r.doca_carregamento)).length,
          detail:"pendência operacional",
          cls:"status-orange",
          icon:getKpiIcon("dock"),
          filter:() => { const el = document.getElementById('agendaFiltroRisco'); if(el) el.value = 'sem_doca'; setView('agenda', document.getElementById('menu-agenda')); renderAgenda(); renderDashboard(); }
        },
        {
          label:"Sem motorista",
          value: rows.filter(r => ['No Pátio','Em Doca','Em Carregamento'].includes(r.status_global) && !String(r.motorista || '').trim()).length,
          detail:"cadastro incompleto",
          cls:"status-purple",
          icon:getKpiIcon("driver"),
          filter:() => { setView('patio', document.getElementById('menu-patio')); }
        },
        {
          label:"Conflito doca",
          value: conflitoIds.size,
          detail:"janela duplicada",
          cls:"status-cyan",
          icon:getKpiIcon("warning"),
          filter:() => { const el = document.getElementById('agendaFiltroRisco'); if(el) el.value = 'conflito'; setView('agenda', document.getElementById('menu-agenda')); renderAgenda(); renderDashboard(); }
        }
      ];
    }

    function atualizarSaudacaoSistema(){
      const agora = new Date();
      const h = agora.getHours();
      let saudacao = "Boa noite";
      let mensagem = "Acompanhe a operação com mais tranquilidade e visão em tempo real.";
      if(h >= 5 && h < 12){ saudacao = "Bom dia"; mensagem = "Aqui está um resumo da operação para apoiar as decisões do turno."; }
      else if(h >= 12 && h < 18){ saudacao = "Boa tarde"; mensagem = "Monitore as etapas do dia com mais clareza, ritmo e previsibilidade."; }
      const nome = (document.getElementById("userNome")?.textContent || "").split(" ")[0] || "";
      const greetingEl = document.getElementById("welcomeGreeting");
      const msgEl = document.getElementById("welcomeMessage");
      const timeEl = document.getElementById("welcomeTime");
      const dateEl = document.getElementById("welcomeDate");
      if(greetingEl) greetingEl.textContent = nome ? `${saudacao}, ${nome}` : saudacao;
      if(msgEl) msgEl.textContent = mensagem;
      if(timeEl) timeEl.textContent = agora.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
      if(dateEl) dateEl.textContent = agora.toLocaleDateString("pt-BR");
    }

    async function carregarTemperaturaSistema(){
      const tempEl = document.getElementById("welcomeTemp");
      if(tempEl) tempEl.textContent = "22°C";
      try{
        const resp = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current=temperature_2m");
        const data = await resp.json();
        const temp = data?.current?.temperature_2m;
        if(typeof temp === "number" && tempEl) tempEl.textContent = `${Math.round(temp)}°C`;
      }catch(_){}
    }

    function renderFilaPatio(rows){
      const fila = patioFilaRegistros.filter(r => ["aguardando","chamado"].includes(r.status_fila))
        .sort((a,b) => Number(a.posicao_fila || 9999) - Number(b.posicao_fila || 9999));
      const chamadas = fila.reduce((a,b)=>a+(Number(b.call_count)||0),0);
      const tempoMedio = fila.length ? `${fila.length * TEMPO_MEDIO_FILA_MIN} min` : "0 min";
      const proximaDoca = docas.find(d => !rows.some(r => (r.doca_carregamento || r.doca_agenda) === d.nome && ["Em Doca","Em Carregamento"].includes(r.status_global)))?.nome || "-";
      const set = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
      set("filaPatioTotal", fila.length);
      set("filaPatioTempo", tempoMedio);
      set("filaPatioDoca", proximaDoca);
      set("filaPatioChamadas", chamadas);
    }

    async function chamarMotorista(id){
      if(!requirePermission("patio_operate", "Seu perfil não pode chamar motoristas.")) return;
      const fila = patioFilaRegistros.find(r => r.id === id || r.agenda_id === id);
      if(!fila){
        alert("Registro da fila não encontrado.");
        return;
      }
      try{
        const result = await rpcChamarMotoristaFila(fila.id);
        registrarLogSistema("chamada_motorista", `DT ${fila.dt || "-"} chamado(a) (${result?.call_count || 0}x)`);
        showToast(result?.mensagem || `Motorista da DT ${fila.dt || "-"} chamado`);
        await carregarTudo();
      }catch(err){
        console.error(err);
        alert("Erro ao chamar o motorista pela RPC.");
      }
    }

    async function enviarFilaParaDocaPrompt(id){
      if(!requirePermission("patio_operate", "Seu perfil não pode enviar para doca.")) return;
      const fila = patioFilaRegistros.find(r => r.id === id || r.agenda_id === id);
      if(!fila) return alert("Registro da fila não encontrado.");
      const sugestao = fila.doca_destino || docas.find(d => d.ativo !== false)?.nome || "";
      const doca = prompt(`Informe a doca para a DT ${fila.dt || "-"}`, sugestao);
      if(doca === null) return;
      if(!String(doca).trim()) return alert("Informe a doca.");
      try{
        await rpcEnviarParaDocaFila(fila.id, String(doca).trim());
        registrarLogSistema("envio_doca", `DT ${fila.dt || "-"} enviada para ${String(doca).trim()}`);
        showToast(`DT enviada para ${String(doca).trim()}`);
        await carregarTudo();
      }catch(err){
        console.error(err);
        alert("Erro ao enviar a fila para a doca.");
      }
    }

    function showToast(msg){
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.style.display = "block";
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => el.style.display = "none", 2500);
    }

    
    
    function getAuditoriaReferenceDate(){
      const filtro = document.getElementById("filtroData")?.value;
      if(filtro) return filtro;
      return new Date().toISOString().slice(0,10);
    }

    function diffDaysISO(dateA, dateB){
      if(!dateA || !dateB) return 0;
      const a = new Date(`${dateA}T00:00:00`);
      const b = new Date(`${dateB}T00:00:00`);
      return Math.round((b - a) / 86400000);
    }

    function isCargaParadaAuditoria(row){
      if(!row) return false;
      const status = String(row.status_global || "").trim();
      const dataAgenda = String(row.data_agenda || "").slice(0,10);
      const ref = getAuditoriaReferenceDate();
      if(!dataAgenda || !ref) return false;
      if(status === "Expedido") return false;
      if(!getDocaNome(row)) return false;
      return dataAgenda < ref;
    }

    function getDiasEmAbertoAuditoria(row){
      const dataAgenda = String(row?.data_agenda || "").slice(0,10);
      const ref = getAuditoriaReferenceDate();
      if(!dataAgenda || !ref) return 0;
      return Math.max(0, diffDaysISO(dataAgenda, ref));
    }

const AUDITORIA_DOCA_STATUSES = ["Aguardando","Carregando","Disponível","Devolução","Reagendado","Solto"];

    function getLocalStorageJson(key, fallback){
      try{
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      }catch(_){
        return fallback;
      }
    }

    function setLocalStorageJson(key, value){
      try{
        localStorage.setItem(key, JSON.stringify(value));
      }catch(_){}
    }

    function getDocaNome(row){
      return String(row?.doca_carregamento || row?.doca_planejada || row?.doca_agenda || "").trim();
    }

    function isAuditoriaStatusAgenda(status){
      return ["Separado","Pronto Expedição","No Pátio","Em Doca","Em Carregamento","Expedido"].includes(String(status || ""));
    }

    function getAuditStatusClass(status){
      const mapa = {
        "Aguardando":"audit-aguardando",
        "Carregando":"audit-carregando",
        "Disponível":"audit-disponivel",
        "Devolução":"audit-devolucao",
        "Reagendado":"audit-reagendado",
        "Solto":"audit-solto"
      };
      return mapa[String(status || "").trim()] || "audit-aguardando";
    }

    
    
    function isDocaInterditadaValue(valorDoca){
      const alvo = String(valorDoca || "").trim();
      if(!alvo) return false;
      return (docas || []).some(d => {
        const chave = String(d?.nome_original || d?.nome || d?.numero || "").trim();
        const local = getDocaInterdicaoByKey(d);
        return chave === alvo && !!(d?.interditada || local?.interditada);
      });
    }

    function getMotivoInterdicaoByValor(valorDoca){
      const alvo = String(valorDoca || "").trim();
      if(!alvo) return "";
      const found = (docas || []).find(d => String(d?.nome_original || d?.nome || d?.numero || "").trim() === alvo);
      if(!found) return "";
      const local = getDocaInterdicaoByKey(found);
      return found?.motivo_interdicao || local?.motivo || "";
    }

    function validarDocaNaoInterditada(valorDoca, contexto){
      if(!valorDoca) return true;
      if(!isDocaInterditadaValue(valorDoca)) return true;
      const motivo = getMotivoInterdicaoByValor(valorDoca);
      alert(`${contexto || "Esta doca"} está interditada.${motivo ? "\nMotivo: " + motivo : ""}`);
      return false;
    }

    function sinalizarSelectDocasInterditadas(ids){
      (ids || []).forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        Array.from(el.options || []).forEach(opt => {
          const interd = isDocaInterditadaValue(opt.value);
          opt.textContent = opt.textContent.replace(/\s+\[INTERDITADA\]$/,'');
          if(interd){
            opt.textContent = `${opt.textContent} [INTERDITADA]`;
          }
        });
      });
    }

function getInterdicoesDocasLocal(){
      return getLocalStorageJson("glp_doca_interdicoes", {});
    }

    function getDocaInterdicao(id){
      const mapa = getInterdicoesDocasLocal();
      return mapa[String(id || "")] || { interditada:false, motivo:"" };
    }

    function getDocaInterdicaoByKey(doca){
      const chave = String(doca?.id || doca?.numero || doca?.nome || "");
      return getDocaInterdicao(chave);
    }

    async function abrirModalInterdicaoDoca(idDoca){
      const doca = (docas || []).find(d => String(d.id || d.numero || d.nome) === String(idDoca));
      if(!doca) return;
      docaEdicaoAtual = doca;
      const atual = getDocaInterdicaoByKey(doca);
      document.getElementById("docaInterdicaoNome").value = doca.nome_exibicao || doca.nome || `Doca ${doca.numero || ""}`;
      document.getElementById("docaInterdicaoStatus").value = atual?.interditada ? "true" : "false";
      document.getElementById("docaInterdicaoMotivo").value = atual?.motivo || "";
      document.getElementById("docaInterdicaoModalSub").textContent = `Atualize o status operacional da ${doca.nome_exibicao || doca.nome || "doca"}.`;
      document.getElementById("docaInterdicaoModal").classList.remove("hidden");
    }

    function fecharModalInterdicaoDoca(){
      document.getElementById("docaInterdicaoModal")?.classList.add("hidden");
      docaEdicaoAtual = null;
    }

    async function salvarInterdicaoDoca(){
      if(!docaEdicaoAtual) return;
      const interditada = (document.getElementById("docaInterdicaoStatus")?.value || "false") === "true";
      const motivo = (document.getElementById("docaInterdicaoMotivo")?.value || "").trim();
      const chave = String(docaEdicaoAtual.id || docaEdicaoAtual.numero || docaEdicaoAtual.nome || "");
      const locais = getInterdicoesDocasLocal();
      locais[chave] = {
        interditada,
        motivo,
        updated_at: new Date().toISOString(),
        usuario: currentUserLabel ? currentUserLabel() : ""
      };
      setLocalStorageJson("glp_doca_interdicoes", locais);

      try{
        if(!docaEdicaoAtual.virtual){
          const payload = { interditada, motivo_interdicao: motivo || null };
          const { error } = await sb.from("docas").update(payload).eq("id", docaEdicaoAtual.id);
          if(error){
            console.warn("Não foi possível salvar interdição na tabela docas. Mantido no armazenamento local.", error.message || error);
          }
        }
      }catch(err){
        console.warn("Falha ao salvar interdição da doca no banco.", err);
      }

      docas = (docas || []).map(d => String(d.id || d.numero || d.nome || "") === chave ? {
        ...d,
        interditada,
        motivo_interdicao: motivo
      } : d);

      fecharModalInterdicaoDoca();
      renderDocas();
      renderAuditoriaDoca();
      showToast(interditada ? "Doca interditada com sucesso" : "Interdição removida com sucesso");
    }

function getDocaObservacao(id){
      const local = getLocalStorageJson("glp_doca_observacoes", {});
      return local[String(id || "")] || "";
    }

    function getAuditoriaDocaRows(){
      let rows = (registros || []).filter(r => isCargaParadaAuditoria(r));
      const busca = (document.getElementById("auditoriaFiltroBusca")?.value || "").trim().toLowerCase();
      const doca = (document.getElementById("auditoriaDocaFiltroDoca")?.value || "").trim().toLowerCase();
      const statusAud = document.getElementById("auditoriaFiltroStatus")?.value || "";

      if(busca){
        rows = rows.filter(r => [r.dt, r.cliente, r.transportadora, r.status_global].some(v => String(v || "").toLowerCase().includes(busca)));
      }
      if(doca){
        rows = rows.filter(r => getDocaNome(r).toLowerCase() === doca);
      }
      if(statusAud){
        rows = rows.filter(r => (getAuditoriaByAgendaId(r.id)?.status_auditoria || "Aguardando") === statusAud);
      }

      return rows.sort((a,b) => {
        const da = String(a.data_agenda || "");
        const db = String(b.data_agenda || "");
        if(da !== db) return da.localeCompare(db);
        return String(a.dt || "").localeCompare(String(b.dt || ""), "pt-BR", { numeric:true, sensitivity:"base" });
      });
    }

    function getAuditoriaByAgendaId(agendaId){
      return (docaAuditorias || []).find(a => String(a.agenda_id || a.id_agenda || "") === String(agendaId || ""));
    }

    function getAuditoriaStatusDerivado(row){
      const auditoria = getAuditoriaByAgendaId(row?.id);
      if(auditoria?.status_auditoria) return auditoria.status_auditoria;
      if(row?.status_global === "Em Carregamento") return "Carregando";
      if(["Separado","Pronto Expedição","No Pátio","Em Doca"].includes(String(row?.status_global || ""))) return "Aguardando";
      return "Aguardando";
    }

    async function carregarDocaAuditorias(){
      try{
        const { data, error } = await sb.from("doca_auditorias").select("*").order("updated_at", { ascending:false });
        if(error){
          console.warn("Tabela doca_auditorias indisponível, usando armazenamento local.", error.message || error);
          docaAuditorias = getLocalStorageJson("glp_doca_auditorias", []);
          return;
        }
        docaAuditorias = data || [];
      }catch(err){
        console.warn("Falha ao carregar doca_auditorias, usando armazenamento local.", err);
        docaAuditorias = getLocalStorageJson("glp_doca_auditorias", []);
      }
    }

    function syncObservacoesDocasLocais(){
      const locais = getLocalStorageJson("glp_doca_observacoes", {});
      docas = (docas || []).map(d => ({
        ...d,
        observacao: d?.observacao || locais[String(d.id || d.numero || d.nome || "")] || ""
      }));
    }

    async function abrirModalObservacaoDoca(idDoca){
      const doca = (docas || []).find(d => String(d.id || d.numero || d.nome) === String(idDoca));
      if(!doca) return;
      docaEdicaoAtual = doca;
      document.getElementById("docaObsNome").value = doca.nome_exibicao || doca.nome || `Doca ${doca.numero || ""}`;
      document.getElementById("docaObsTexto").value = doca.observacao || getDocaObservacao(doca.id || doca.numero || doca.nome) || "";
      document.getElementById("docaObsModalSub").textContent = `Atualize a observação operacional da ${doca.nome_exibicao || doca.nome || "doca"}.`;
      document.getElementById("docaObsModal").classList.remove("hidden");
    }

    function fecharModalObservacaoDoca(){
      document.getElementById("docaObsModal")?.classList.add("hidden");
      docaEdicaoAtual = null;
    }

    async function salvarObservacaoDoca(){
      if(!docaEdicaoAtual) return;
      const texto = (document.getElementById("docaObsTexto")?.value || "").trim();
      const chave = String(docaEdicaoAtual.id || docaEdicaoAtual.numero || docaEdicaoAtual.nome || "");
      const locais = getLocalStorageJson("glp_doca_observacoes", {});
      locais[chave] = texto;
      setLocalStorageJson("glp_doca_observacoes", locais);

      try{
        if(!docaEdicaoAtual.virtual){
          const { error } = await sb.from("docas").update({ observacao: texto }).eq("id", docaEdicaoAtual.id);
          if(error){
            console.warn("Não foi possível salvar observação na tabela docas. Mantido no armazenamento local.", error.message || error);
          }
        }
      }catch(err){
        console.warn("Falha ao salvar observação da doca no banco.", err);
      }

      docas = (docas || []).map(d => String(d.id || d.numero || d.nome || "") === chave ? { ...d, observacao:texto } : d);
      fecharModalObservacaoDoca();
      renderDocas();
      renderAuditoriaDoca();
      showToast("Observação da doca salva");
    }

    function abrirAuditoriaDocaPorAgenda(idAgenda){
      const row = registros.find(r => String(r.id) === String(idAgenda));
      if(!row) return alert("Carga não encontrada para auditoria.");
      auditoriaDocaAtual = row;
      const auditoria = getAuditoriaByAgendaId(row.id);
      document.getElementById("auditoriaModalDoca").value = getDocaNome(row) || "-";
      document.getElementById("auditoriaModalDt").value = row.dt || "-";
      document.getElementById("auditoriaModalCliente").value = row.cliente || "-";
      document.getElementById("auditoriaModalTransportadora").value = row.transportadora || "-";
      document.getElementById("auditoriaModalStatus").value = auditoria?.status_auditoria || getAuditoriaStatusDerivado(row);
      document.getElementById("auditoriaModalLegenda").value = auditoria?.legenda || "";
      document.getElementById("auditoriaModalObs").value = auditoria?.observacao || "";
      document.getElementById("auditoriaDocaModalSub").textContent = `Registro da DT ${row.dt || "-"} • ${getDocaNome(row) || "Sem doca"}.`;
      document.getElementById("auditoriaDocaModal").classList.remove("hidden");
    }

    function fecharAuditoriaDocaModal(){
      document.getElementById("auditoriaDocaModal")?.classList.add("hidden");
      auditoriaDocaAtual = null;
    }

    async function salvarAuditoriaDocaModal(){
      if(!auditoriaDocaAtual) return;
      const payload = {
        agenda_id: auditoriaDocaAtual.id,
        dt: auditoriaDocaAtual.dt || null,
        doca: getDocaNome(auditoriaDocaAtual) || null,
        status_auditoria: document.getElementById("auditoriaModalStatus").value || "Aguardando",
        legenda: (document.getElementById("auditoriaModalLegenda").value || "").trim() || null,
        observacao: (document.getElementById("auditoriaModalObs").value || "").trim() || null,
        data_agenda: auditoriaDocaAtual.data_agenda || null,
        updated_at: new Date().toISOString(),
        usuario: currentUserLabel()
      };

      const existentes = getLocalStorageJson("glp_doca_auditorias", []);
      const idx = existentes.findIndex(a => String(a.agenda_id || a.id_agenda || "") === String(payload.agenda_id));
      if(idx >= 0){
        existentes[idx] = { ...existentes[idx], ...payload };
      }else{
        existentes.unshift({ id:`local-${Date.now()}`, created_at:new Date().toISOString(), ...payload });
      }
      setLocalStorageJson("glp_doca_auditorias", existentes);

      try{
        const atual = getAuditoriaByAgendaId(payload.agenda_id);
        if(atual?.id && !String(atual.id).startsWith("local-")){
          const { error } = await sb.from("doca_auditorias").update(payload).eq("id", atual.id);
          if(error) console.warn("Não foi possível atualizar auditoria no banco.", error.message || error);
        }else{
          const { error } = await sb.from("doca_auditorias").insert([payload]);
          if(error) console.warn("Não foi possível inserir auditoria no banco.", error.message || error);
        }
      }catch(err){
        console.warn("Falha ao salvar auditoria no banco. Mantido no armazenamento local.", err);
      }

      await carregarDocaAuditorias();
      fecharAuditoriaDocaModal();
      renderAuditoriaDoca();
      renderDocas();
      showToast("Auditoria de doca salva");
    }

    function abrirAuditoriaDocaComFiltro(docaNome){
      const el = document.getElementById("auditoriaDocaFiltroDoca");
      if(el) el.value = String(docaNome || "");
      setView("auditoria-doca", document.getElementById("menu-auditoria-doca"));
      renderAuditoriaDoca();
    }

    function renderAuditoriaDoca(){
      const rows = getAuditoriaDocaRows();
      const listaDocas = getDocasOrdenadas();
      const usadas = new Set(rows.map(r => getDocaNome(r)).filter(Boolean));
      const qtdEmAberto = rows.filter(r => getAuditoriaStatusDerivado(r) !== "Solto").length;
      const qtdCarregando = rows.filter(r => getAuditoriaStatusDerivado(r) === "Carregando").length;
      document.getElementById("auditoriaTotalRef").textContent = rows.length;
      document.getElementById("auditoriaDocasRef").textContent = usadas.size;
      const elDisp = document.getElementById("auditoriaDisponiveisRef"); if(elDisp) elDisp.textContent = qtdEmAberto;
      const elCarr = document.getElementById("auditoriaCarregandoRef"); if(elCarr) elCarr.textContent = qtdCarregando;
      document.getElementById("auditoriaSoftStat").textContent = `${listaDocas.length} docas`;
      document.getElementById("auditoriaTabelaSoftStat").textContent = `${rows.length} cargas`;

      const selectDoca = document.getElementById("auditoriaDocaFiltroDoca");
      if(selectDoca){
        const atual = selectDoca.value;
        selectDoca.innerHTML = `<option value="">Todas</option>` + listaDocas.map(d => {
          const valor = d.nome_original || d.nome || d.numero;
          const label = d.nome_exibicao || d.nome || `Doca ${d.numero}`;
          return `<option value="${esc(valor)}">${esc(label)}</option>`;
        }).join("");
        if(atual) selectDoca.value = atual;
      }

      document.getElementById("auditoriaDocaGrid").innerHTML = listaDocas.map(d => {
        const valor = d.nome_original || d.nome || String(d.numero || "");
        const label = d.nome_exibicao || d.nome || `Doca ${d.numero || ""}`;
        const row = rows.find(r => getDocaNome(r) === valor) || linhasFiltradas().find(r => getDocaNome(r) === valor && isAuditoriaStatusAgenda(r.status_global));
        const auditoria = row ? getAuditoriaByAgendaId(row.id) : null;
        const status = row ? getAuditoriaStatusDerivado(row) : "Disponível";
        const legenda = auditoria?.legenda || (row ? `Parada desde ${fmtDate(row.data_agenda)}` : "Sem carga parada vinculada");
        const obs = auditoria?.observacao || d?.observacao || "";
        return `<div class="auditoria-doca-card status-${String(status || 'Aguardando').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}">
          <div class="dock-head">
            <strong>${esc(label)}</strong>
            <span class="auditoria-badge ${getAuditStatusClass(status)}">${esc(status)}</span>
          </div>
          <div class="meta">
            <strong>DT:</strong> ${esc(row?.dt || "-")}<br>
            <strong>Cliente:</strong> ${esc(row?.cliente || "-")}<br>
            <strong>Transportadora:</strong> ${esc(row?.transportadora || "-")}<br>
            <strong>Legenda:</strong> ${esc(legenda || "-")}<br>
            <strong>Dias em aberto:</strong> ${getDiasEmAbertoAuditoria(row)}
          </div>
          ${obs ? `<div class="dock-note"><strong>Obs.:</strong> ${esc(obs)}</div>` : ``}
          <div class="dock-actions">
            <button class="mini blue" onclick="abrirAuditoriaDocaComFiltro('${esc(valor)}')">Filtrar</button>
            <button class="mini orange" onclick="abrirModalObservacaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Observação</button>
            ${row ? `<button class="mini green" onclick="abrirAuditoriaDocaPorAgenda('${esc(row.id)}')">Registrar</button>` : ``}
          </div>
        </div>`;
      }).join("");

      document.getElementById("auditoriaDocaTabela").innerHTML = rows.map(r => {
        const auditoria = getAuditoriaByAgendaId(r.id);
        const status = auditoria?.status_auditoria || getAuditoriaStatusDerivado(r);
        const legenda = auditoria?.legenda || r.status_global || "-";
        const obs = auditoria?.observacao || "";
        return `<tr>
          <td>${fmtDate(r.data_agenda)}</td>
          <td>${esc(getDocaNome(r) || "-")}${isDocaInterditadaValue(getDocaNome(r)) ? `<span class="doca-chip-interditada">Interditada</span>${getMotivoInterdicaoByValor(getDocaNome(r)) ? `<span class="doca-motivo-inline">${esc(getMotivoInterdicaoByValor(getDocaNome(r)))}</span>` : ``}` : ``}</td>
          <td>${esc(r.dt)}</td>
          <td><span class="chip ${clsStatus(r.status_global)}">${esc(r.status_global)}</span></td>
          <td>${getDiasEmAbertoAuditoria(r)}</td>
          <td>${esc(r.cliente || "-")}</td>
          <td>${esc(r.transportadora || "-")}</td>
          <td><span class="auditoria-badge ${getAuditStatusClass(status)}">${esc(status)}</span><div style="margin-top:6px;color:var(--muted);font-size:11px">${esc(legenda)}</div></td>
          <td>${esc(obs || "-")}</td>
          <td>
            <div class="audit-action-row">
              <button class="mini blue" onclick="abrirDTPorId('${esc(r.id)}')">Abrir DT</button>
              <button class="mini green" onclick="abrirAuditoriaDocaPorAgenda('${esc(r.id)}')">Registrar</button>
            </div>
          </td>
        </tr>`;
      }).join("");
    }

function ymsCanOpenView(view){
  const reqs = window.YMS_VIEW_PERMISSIONS || {};
  const required = reqs[view];
  if(!required) return true;
  return can(required);
}

function setView(view, btn){
  if(!ymsCanOpenView(view)){
    alert("Seu perfil não possui permissão para abrir esta área.");
    view = "dashboard";
    btn = document.getElementById("menu-dashboard");
  }
  viewAtualGlobal = view;
  const targetBtn = btn || document.getElementById(`menu-${view}`);
  const titulo = (targetBtn?.querySelector(".menu-text")?.textContent || targetBtn?.textContent || view).trim();
  document.getElementById("pageTitle").textContent = titulo;

  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".menu-group").forEach(g => g.classList.remove("active"));

  if(view === 'passagem-turno'){
    const group = document.getElementById('menu-group-passagem-turno');
    if(group) group.classList.add('open','active');
    const menuBtn = document.getElementById('menu-passagem-turno');
    if(menuBtn) menuBtn.classList.add('active');
    if(typeof syncPassagemMenuState === 'function') syncPassagemMenuState();
    if(typeof setPassagemSubView === 'function') setPassagemSubView(passagemSubViewAtual || 'lancamento');
  }else if(targetBtn){
    targetBtn.classList.add("active");
  }

  ["dashboard","agenda","separacao","expedicao","patio","motoristas","transportadoras","docas","auditoria-doca","checkin","relatorios","resultado-separacao","passagem-turno","admin"].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if(el) el.classList.add("hidden");
  });
  const viewEl = document.getElementById(`view-${view}`);
  if(viewEl) viewEl.classList.remove("hidden");

  atualizarVisibilidadeStatusConexao();
  atualizarIconesSidebar();

  if(view === "admin" && usuarioPerfil === "admin"){
    carregarUsuariosAdmin();
  }
  if(window.innerWidth <= 900){
    alternarSidebar(true);
  }
}

    function calcSla(row){
      const baseData = row.data_agenda;
      const baseHora = row.hora_agenda;
      if(!baseData) return {label:"Sem agenda", cls:"sla-alerta"};
      const dtAgenda = new Date(`${baseData}T${baseHora || "00:00"}:00`);
      if(isNaN(dtAgenda)) return {label:"Sem agenda", cls:"sla-alerta"};
      if(row.status_global === "Expedido") return {label:"Concluído", cls:"sla-ok"};
      const diffMin = Math.round((new Date() - dtAgenda) / 60000);
      if(diffMin <= 30) return {label:"No prazo", cls:"sla-ok"};
      if(diffMin <= 120) return {label:"Alerta", cls:"sla-alerta"};
      return {label:"Atrasado", cls:"sla-atraso"};
    }

    function definirTurno(hora){
      if(!hora) return "Sem turno";
      const h = parseInt(String(hora).split(":")[0], 10);
      if(Number.isNaN(h)) return "Sem turno";
      if(h >= 6 && h < 14) return "T1";
      if(h >= 14 && h < 22) return "T2";
      return "T3";
    }

    function parseNumeroBR(valor){
      if(valor === null || valor === undefined || valor === "") return 0;
      if(typeof valor === "number" && Number.isFinite(valor)) return valor;

      const texto = String(valor).trim();
      if(!texto) return 0;

      const normalizado = texto.includes(",")
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto;

      const n = Number(normalizado);
      return Number.isFinite(n) ? n : 0;
    }

    function getTonelagemPassagem(row){
      return parseNumeroBR(
        row?.tonelagem ??
        row?.TONELAGEM ??
        row?.TON ??
        row?.peso ??
        row?.PESO ??
        0
      );
    }

    function formatPassagemTonelagem(valor){
      return Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
    }

    function bindPassagemLiveInputs(){
      const ids = ['passagemData','passagemTurno','passagemResponsavel','passagemOperador','passagemConferente','passagemExclusiva','passagemRecebidoPor','passagemHorario','passagemOcorrencias'];
      ['operador','conferente','exclusiva'].forEach(ch => {
        ids.push(`passagemFerias_${ch}`, `passagemAusencias_${ch}`, `passagemBancoHoras_${ch}`);
      });
      (typeof PASSAGEM_AREAS !== 'undefined' ? PASSAGEM_AREAS : []).forEach(area => {
        const slug = area.replace(/[^a-zA-Z0-9]/g,'_');
        ids.push(`passagemAreaMo_${slug}`, `passagemAreaHoras_${slug}`);
      });
      ids.forEach(id => {
        const el = document.getElementById(id);
        if(!el || el.dataset.passagemBound === '1') return;
        const handler = () => {
          if(id === 'passagemData'){
            el.dataset.userLocked = el.value ? '1' : '';
          }
          const turnoFiltro = document.getElementById('passagemTurno')?.value || 'T1';
          const op = Number(document.getElementById('passagemOperador')?.value || 0);
          const conf = Number(document.getElementById('passagemConferente')?.value || 0);
          const exc = Number(document.getElementById('passagemExclusiva')?.value || 0);
          const turnoRef = document.getElementById('passagemTurnoRef');
          const totalRef = document.getElementById('passagemTotalQuadroRef');
          if(turnoRef) turnoRef.textContent = turnoFiltro;
          if(totalRef) totalRef.textContent = String(op + conf + exc);
          savePassagemTurnoState(collectPassagemTurnoState());
          markPassagemAsDirty();
          renderPassagemTurno();
        };
        const evt = (el.tagName === 'SELECT' || el.type === 'date' || el.type === 'time') ? 'change' : 'input';
        el.addEventListener(evt, handler);
        if(id === 'passagemTurno') el.addEventListener('input', handler);
        el.dataset.passagemBound = '1';
      });
    }

        function aplicarPermissoes(){
      const perms = getRolePermissions();
      const ocultar = (id, hidden) => {
        const el = document.getElementById(id);
        if(el) el.style.display = hidden ? "none" : "";
      };

      ocultar("menu-admin", !perms.admin);

      // Gestão: visualização total, sem edição/admin.
      // Assistente/Operação/Portaria: mesma lógica operacional.
      const adminArea = document.getElementById("areaAdmin");
      if(adminArea) adminArea.style.display = perms.admin ? "grid" : "none";

      // Cadastro auxiliar fica disponível só para perfis operacionais e admin.
      ["menu-motoristas","menu-transportadoras"].forEach(id => ocultar(id, !perms.cadastros_edit));

      // Relatórios e visualização seguem liberados.
      ocultar("menu-relatorios", !perms.relatorios_view);

      aplicarEstadoPermissoesUI();
    }

    function aplicarEstadoPermissoesUI(){
      const perms = getRolePermissions();
      const toggleDisabled = (selector, disabled) => {
        document.querySelectorAll(selector).forEach(el => {
          el.disabled = disabled;
          el.classList.toggle("is-disabled-by-role", disabled);
        });
      };

      // Agenda
      toggleDisabled('#view-agenda input, #view-agenda select, #view-agenda textarea', !perms.agenda_edit);
      toggleDisabled('#view-agenda .btn', !perms.agenda_edit);
      const agendaBtn = document.querySelector('#view-agenda .btn.btn-success');
      if(agendaBtn) agendaBtn.style.display = perms.agenda_edit ? "" : "none";

      // Pátio
      toggleDisabled('#view-patio input, #view-patio select, #view-patio textarea', !perms.patio_operate);
      document.querySelectorAll('#view-patio .btn').forEach(el => {
        el.disabled = !perms.patio_operate;
      });

      // Check-in
      toggleDisabled('#view-checkin input, #view-checkin select, #view-checkin textarea', !perms.checkin_operate);
      document.querySelectorAll('#view-checkin .btn').forEach(el => {
        el.disabled = !perms.checkin_operate;
      });

      // Cadastros auxiliares
      toggleDisabled('#view-motoristas input, #view-motoristas select, #view-motoristas textarea', !perms.cadastros_edit);
      toggleDisabled('#view-transportadoras input, #view-transportadoras select, #view-transportadoras textarea', !perms.cadastros_edit);
      document.querySelectorAll('#view-motoristas .btn, #view-transportadoras .btn').forEach(el => {
        el.disabled = !perms.cadastros_edit;
      });

      // Admin/importação
      toggleDisabled('#view-admin input, #view-admin select, #view-admin textarea', !perms.admin);
      document.querySelectorAll('#view-admin .btn').forEach(el => {
        el.disabled = !perms.admin;
      });
      const fileInput = document.getElementById("fileInput");
      if(fileInput) fileInput.disabled = !perms.import_excel;

      // Gestão = visualização total, então impede botões inline
      document.querySelectorAll('.mini').forEach(el => {
        if(el.closest('#view-agenda') || el.closest('#view-separacao') || el.closest('#view-expedicao')){
          const isOpen = /Abrir DT/i.test(el.textContent || "");
          el.disabled = perms.read_only ? !isOpen : el.disabled;
        }
      });
    }

    async function carregarCadastros(){
      const [confRes, docaRes, motRes, transRes] = await Promise.all([
        sb.from("conferentes").select("*").eq("ativo", true).order("nome"),
        sb.from("docas").select("*").eq("ativo", true).order("nome"),
        sb.from("motoristas").select("*").order("nome"),
        sb.from("transportadoras").select("*").order("nome")
      ]);

      conferentes = confRes.data || [];
      docas = (docaRes.data || []).slice().sort((a, b) => compararDocas(a?.nome, b?.nome));
      syncObservacoesDocasLocais();
      const interdicoesLocais = getInterdicoesDocasLocal();
      docas = (docas || []).map(d => {
        const chave = String(d.id || d.numero || d.nome || "");
        const local = interdicoesLocais[chave] || {};
        return {
          ...d,
          interditada: typeof d?.interditada === "boolean" ? d.interditada : !!local.interditada,
          motivo_interdicao: d?.motivo_interdicao || local.motivo || ""
        };
      });
      window._motoristas = motRes.data || [];
      window._transportadoras = transRes.data || [];

      ["a_doca_agenda","p_doca","m_doca_agenda","m_doca_planejada","m_doca_carregamento","auditoriaDocaFiltroDoca"].forEach(preencherSelectDocas);
      sinalizarSelectDocasInterditadas(["a_doca_agenda","p_doca","m_doca_agenda","m_doca_planejada","m_doca_carregamento"]);
      ["m_conf_recebimento","m_conf_expedicao"].forEach(preencherSelectConferentes);
      carregarMotoristas();
      carregarTransportadoras();
    }

    function preencherSelectDocas(id){
      const el = document.getElementById(id);
      if(!el) return;

      const atual = el.value;
      const listaDocas = getDocasOrdenadas();

      el.innerHTML = `<option value="">Selecione</option>` + listaDocas.map(d => {
        const valor = d.nome_original || d.nome || d.numero;
        const label = d.nome_exibicao || d.nome || `Doca ${d.numero}`;
        return `<option value="${esc(valor)}">${esc(label)}</option>`;
      }).join("");

      if(atual) el.value = atual;
    }

    function preencherSelectConferentes(id){
      const el = document.getElementById(id);
      if(!el) return;
      const atual = el.value;
      el.innerHTML = `<option value="">Selecione</option>` + conferentes.map(c => `<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join("");
      if(atual) el.value = atual;
    }

    async function carregarPatioFila(){
      try{
        let query = sb.from("v_patio_fila_operacional").select("*");
        const { data, error } = await query;
        if(error){
          console.warn("Fila do pátio indisponível:", error.message || error);
          patioFilaRegistros = [];
          return;
        }
        patioFilaRegistros = data || [];
      }catch(err){
        console.warn("Falha ao carregar fila do pátio:", err);
        patioFilaRegistros = [];
      }
    }

    async function carregarTudo(){
      let query = sb.from("agendas").select("*").order("data_agenda", {ascending:true}).order("hora_agenda", {ascending:true});
      const df = dataFiltrada();
      if(df) query = query.eq("data_agenda", df);
      const { data, error } = await query;
      if(error){
        console.error(error);
        registros = [];
        await carregarPatioFila();
        renderTudo();
        const status = document.getElementById("statusConexao");
        if(status){
          status.textContent = "Sem permissão para ler a agenda. Verifique GRANT e RLS da tabela public.agendas.";
          status.style.color = "#ef4444";
        }
        showToast("Sem permissão para carregar a agenda.");
        return;
      }
      registros = data || [];
      await carregarPatioFila();
      await carregarDocaAuditorias();
      renderTudo();
    }

    async function carregarTudoSilencioso(){
      let query = sb.from("agendas").select("*").order("data_agenda", {ascending:true}).order("hora_agenda", {ascending:true});
      const df = dataFiltrada();
      if(df) query = query.eq("data_agenda", df);
      const { data, error } = await query;
      if(error){
        console.error(error);
        registros = [];
        renderTudo();
        return;
      }
      registros = data || [];
      await carregarPatioFila();
      await carregarDocaAuditorias();
      renderTudo();
    }

    function renderTudo(){
      syncFiltroDataAcrossViews(getFiltroDataValue());
      renderDashboard();
      renderAgenda();
      renderSeparacao();
      renderExpedicao();
      renderPatio();
      renderDocas();
      renderAuditoriaDoca();
      renderCheckin();
      renderRelatorios();
      renderResultadoSeparacao();
      renderPassagemTurno();
      carregarSelectPatio();
      carregarSelectCheckin();
      aplicarEstadoPermissoesUI();
    }

    async function iniciarRealtime(){
      if(realtimeChannel){ try{ await sb.removeChannel(realtimeChannel); }catch(_){} }
      realtimeChannel = sb.channel("realtime-agendas")
        .on("postgres_changes", { event:"*", schema:"public", table:"agendas" }, async (payload) => {
          const tipo = payload.eventType || "UPDATE";
          if(tipo === "INSERT") showToast("Nova DT recebida em tempo real");
          if(tipo === "UPDATE") showToast("DT atualizada em tempo real");
          if(tipo === "DELETE") showToast("DT removida em tempo real");
          await carregarTudoSilencioso();
        })
        .subscribe((status) => {
          if(status === "SUBSCRIBED"){
            const el = document.getElementById("statusConexao");
            el.textContent = "Conectado ao Supabase • tempo real ativo";
            el.style.color = "#22c55e";
          }
        });
    }

    async function criarDT(){
      if(!requirePermission("agenda_edit", "Seu perfil não pode criar DTs.")) return;
      const payload = {
        dt: document.getElementById("a_dt").value.trim() || null,
        ordem: document.getElementById("a_ordem").value.trim() || null,
        remessa: document.getElementById("a_remessa").value.trim() || null,
        data_agenda: document.getElementById("a_data_agenda").value || null,
        hora_agenda: document.getElementById("a_hora_agenda").value || null,
        transportadora: document.getElementById("a_transportadora").value.trim() || null,
        cliente: document.getElementById("a_cliente").value.trim() || null,
        tipo_carga: document.getElementById("a_tipo_carga").value.trim() || null,
        tipo_veiculo: document.getElementById("a_tipo_veiculo").value.trim() || null,
        tipo_frete: document.getElementById("a_tipo_frete").value.trim() || null,
        perfil_carga: document.getElementById("a_perfil_carga").value.trim() || null,
        doca_agenda: document.getElementById("a_doca_agenda").value || null,
        peso: num(document.getElementById("a_peso").value),
        cubagem: num(document.getElementById("a_cubagem").value),
        tonelagem: num(document.getElementById("a_tonelagem").value),
        he: num(document.getElementById("a_he").value),
        ho: num(document.getElementById("a_ho").value),
        total_caixas: num(document.getElementById("a_total_caixas").value),
        observacao_geral: document.getElementById("a_observacao").value.trim() || null,
        status_global: "Agendado"
      };
      const erros = validarNovaAgenda(payload);
      if(erros.length) return alert(erros.join("\n"));
      const { error } = await sb.from("agendas").insert([payload]);
      if(error){ console.error(error); return alert("Erro ao criar DT."); }
      document.querySelectorAll('#view-agenda input, #view-agenda textarea').forEach(el => el.value = "");
      document.getElementById("a_doca_agenda").value = "";
      registrarLogSistema("criar_dt", `DT ${payload.dt} criada para ${fmtDate(payload.data_agenda)} às ${payload.hora_agenda || "-"}`);
      await carregarTudo();
      showToast("DT criada com sucesso");
    }

    function renderDashboard(){
      const rows = getAgendaRows();
      const cards = [
        { label:"Agendado", value: rows.filter(x=>x.status_global==="Agendado").length, sub:"planejamento", cls:"status-gray", icon:getKpiIcon("calendar") },
        { label:"Em Separação", value: rows.filter(x=>x.status_global==="Em Separação").length, sub:"andamento", cls:"status-orange", icon:getKpiIcon("package") },
        { label:"Separado", value: rows.filter(x=>x.status_global==="Separado").length, sub:"prontas", cls:"status-green", icon:getKpiIcon("checkSquare") },
        { label:"No Pátio", value: rows.filter(x=>x.status_global==="No Pátio").length, sub:"chegadas", cls:"status-blue", icon:getKpiIcon("yard") },
        { label:"Em Doca", value: rows.filter(x=>x.status_global==="Em Doca").length, sub:"ocupação", cls:"status-purple", icon:getKpiIcon("dock") },
        { label:"Em Carregamento", value: rows.filter(x=>x.status_global==="Em Carregamento").length, sub:"execução", cls:"status-cyan", icon:getKpiIcon("truck") },
        { label:"Expedido", value: rows.filter(x=>x.status_global==="Expedido").length, sub:"concluídas", cls:"status-green", icon:getKpiIcon("outbound") },
        { label:"Atrasado", value: rows.filter(x=>calcSla(x).label==="Atrasado").length, sub:"exceção", cls:"status-red", icon:getKpiIcon("time") }
      ];
      document.getElementById("dashboardKpis").innerHTML = cards.map(k => `
        <div class="kpi ${k.cls} clickable" onclick="filtrarPorKpi('${esc(k.label)}')">
          <div class="kpi-icon">${k.icon}</div>
          <div class="label">${k.label}</div>
          <div class="value">${k.value}</div>
          <div class="sub">${k.sub}</div>
        </div>`).join("");

      const exceptionTarget = document.getElementById("dashboardExceptions");
      if(exceptionTarget){
        const exceptions = getDashboardExceptionsData(rows);
        exceptionTarget.innerHTML = exceptions.map((x, i) => `
          <div class="kpi ${x.cls} clickable" onclick="window.__dashboardExceptionFilters[${i}]()">
            <div class="kpi-icon">${x.icon}</div>
            <div class="label">${x.label}</div>
            <div class="value">${x.value}</div>
            <div class="sub">${x.detail}</div>
          </div>
        `).join("");
        window.__dashboardExceptionFilters = exceptions.map(x => x.filter);
      }

      document.getElementById("dashboardBoard").innerHTML = STAGES.map(st => {
        const itens = rows.filter(r => r.status_global === st);
        const laneClass = STAGE_COLOR_CLASS[st] || "";
        return `<div class="lane ${laneClass}" data-status="${esc(st)}">
          <div class="lane-head"><h3 onclick="filtrarPorKpi('${esc(st)}')" style="cursor:pointer">${esc(st)}</h3><span class="count">${itens.length}</span></div>
          ${itens.map(r => `<div class="item" draggable="true" data-id="${esc(r.id)}" onclick="abrirDTPorId('${esc(r.id)}')"><strong>DT ${esc(r.dt || "-")}</strong><div class="meta">${esc(r.transportadora || "-")}<br>${esc(r.cliente || "-")}</div></div>`).join("") || `<div class="meta">Sem registros.</div>`}
        </div>`;
      }).join("");
      initDragDrop();
    }

    function renderAgenda(){
      const rows = getAgendaRows();
      const baseRows = linhasFiltradas();
      const conflitos = detectarConflitosAgenda(baseRows);
      const semDoca = baseRows.filter(r => !(r.doca_agenda || r.doca_planejada || r.doca_carregamento)).length;
      const atrasos = baseRows.filter(r => calcSla(r).label === "Atrasado").length;
      const riskBanner = document.getElementById("agendaRiskBanner");
      if(riskBanner){
        riskBanner.textContent = `Validações do dia • Conflitos: ${conflitos.length} • Sem doca: ${semDoca} • Atrasadas: ${atrasos}.`;
      }

      const filtroAtivo = getFiltroDataValue();
      const dataRef = filtroAtivo ? fmtDate(filtroAtivo) : "Todos";
      const cards = [
        { label:"DTs do dia", value: rows.length, sub:"cadastros filtrados", cls:"status-blue", icon:getKpiIcon("calendar") },
        { label:"Agendado", value: rows.filter(x=>x.status_global==="Agendado").length, sub:"planejamento", cls:"status-gray", icon:getKpiIcon("pin") },
        { label:"Sem doca", value: rows.filter(x=>!(x.doca_agenda || x.doca_planejada || x.doca_carregamento)).length, sub:"pendência", cls:"status-orange", icon:getKpiIcon("dock") },
        { label:"Atrasadas", value: rows.filter(x=>calcSla(x).label==="Atrasado").length, sub:"exceção", cls:"status-red", icon:getKpiIcon("time") }
      ];
      document.getElementById("agendaKpis").innerHTML = cards.map(k => `
        <div class="kpi ${k.cls} clickable" onclick="filtrarPorKpi('${esc(k.label)}')">
          <div class="kpi-icon">${k.icon}</div>
          <div class="label">${k.label}</div>
          <div class="value">${k.value}</div>
          <div class="sub">${k.sub}</div>
        </div>`).join("");
      document.getElementById("agendaDataRef").textContent = dataRef;
      document.getElementById("agendaTotalRef").textContent = rows.length;
      document.getElementById("agendaSoftStat").textContent = `${rows.length} registros`;
      const conflitoIds = new Set(conflitos.map(c => c.id));
      document.getElementById("agendaTabela").innerHTML = rows.map(r => {
        const sla = calcSla(r);
        const hasConflict = conflitoIds.has(r.id);
        const acoes = [];
        acoes.push(`<button class="mini blue" onclick="abrirDTPorId('${esc(r.id)}')">Abrir DT</button>`);
        if(isAuditoriaStatusAgenda(r.status_global) && getDocaNome(r)) acoes.push(`<button class="mini green" onclick="abrirAuditoriaDocaPorAgenda('${esc(r.id)}')">Auditoria</button>`);
        if(podeTransicionar(r.status_global || "Agendado", "Em Separação")) acoes.push(`<button class="mini orange" onclick="mudarStatus('${esc(r.id)}','Em Separação')">Separação</button>`);
        return `<tr>
          <td>${esc(r.dt)}</td>
          <td>${fmtDate(r.data_agenda)}</td>
          <td>${esc(r.hora_agenda)}</td>
          <td>${esc(r.cliente)}</td>
          <td>${esc(r.transportadora)}</td>
          <td>${esc(valorTempoCarregamento(r) || "-")}</td>
          <td>${esc(formatTerminoPrevistoAgenda(valorTerminoPrevisto(r)))}</td>
          <td>${esc(r.doca_agenda || r.doca_planejada || "-")}</td>
          <td><span class="chip ${clsStatus(r.status_global)}">${esc(r.status_global)}</span>${hasConflict ? ` <span class="log-badge">Conflito</span>` : ``}</td>
          <td><span class="${sla.cls}">${sla.label}</span></td>
          <td><div class="mini-actions">${acoes.join("")}</div></td>
        </tr>`;
      }).join("");
    }

    function renderSeparacao(){
      const rows = linhasFiltradas().filter(r => ["Agendado","Em Separação","Separado"].includes(r.status_global));
      document.getElementById("sepEmAndamentoRef").textContent = rows.filter(r => r.status_global === "Em Separação").length;
      document.getElementById("sepConcluidoRef").textContent = rows.filter(r => r.status_global === "Separado").length;
      document.getElementById("separacaoSoftStat").textContent = `${rows.length} registros`;
      document.getElementById("separacaoTabela").innerHTML = rows.map(r => {
        const sla = calcSla(r);
        const hint1 = getActionHint(r, "Em Separação");
        const hint2 = getActionHint(r, "Separado");
        return `<tr>
          <td>${esc(r.dt)}</td><td>${esc(r.cliente)}</td><td>${esc(r.transportadora)}</td><td>${esc(r.doca_planejada || r.doca_agenda)}</td><td>${esc(r.status_separacao)}</td><td>${esc(r.conferente_recebimento)}</td><td>${esc(r.turno_separacao)}</td>
          <td><span class="${sla.cls}">${sla.label}</span></td>
          <td>
            <div class="mini-actions">
              <button class="mini blue" onclick="abrirDTPorId('${esc(r.id)}')">Abrir DT</button>
              ${renderTransitionButton(r, "Em Separação", "Em separação", "orange")}
              ${renderTransitionButton(r, "Separado", "Separado", "green")}
            </div>
            ${hint1 && !podeTransicionar(r.status_global || "Agendado", "Em Separação") ? `<div class="action-hint">${esc(hint1)}</div>` : hint2 && !podeTransicionar(r.status_global || "Agendado", "Separado") ? `<div class="action-hint">${esc(hint2)}</div>` : ``}
          </td>
        </tr>`;
      }).join("");
    }

    function renderExpedicao(){
      const rows = linhasFiltradas().filter(r => ["Separado","Pronto Expedição","No Pátio"].includes(r.status_global));
      document.getElementById("expProntoRef").textContent = rows.filter(r => r.status_global === "Pronto Expedição").length;
      document.getElementById("expPatioRef").textContent = rows.filter(r => r.status_global === "No Pátio").length;
      document.getElementById("expedicaoSoftStat").textContent = `${rows.length} registros`;
      document.getElementById("expedicaoTabela").innerHTML = rows.map(r => {
        const sla = calcSla(r);
        const hint1 = getActionHint(r, "Pronto Expedição");
        const hint2 = getActionHint(r, "No Pátio");
        return `<tr>
          <td>${esc(r.dt)}</td><td>${esc(r.cliente)}</td><td>${esc(r.transportadora)}</td><td>${esc(r.doca_agenda)}</td><td>${esc(r.conferente_expedicao)}</td><td>${r.faturado === true ? "Sim" : r.faturado === false ? "Não" : ""}</td>
          <td><span class="chip ${clsStatus(r.status_global)}">${esc(r.status_global)}</span></td>
          <td><span class="${sla.cls}">${sla.label}</span></td>
          <td>
            <div class="mini-actions">
              <button class="mini blue" onclick="abrirDTPorId('${esc(r.id)}')">Abrir DT</button>
              ${renderTransitionButton(r, "Pronto Expedição", "Pronto", "orange")}
              ${renderTransitionButton(r, "No Pátio", "Enviar pátio", "green")}
            </div>
            ${hint1 && !podeTransicionar(r.status_global || "Agendado", "Pronto Expedição") ? `<div class="action-hint">${esc(hint1)}</div>` : hint2 && !podeTransicionar(r.status_global || "Agendado", "No Pátio") ? `<div class="action-hint">${esc(hint2)}</div>` : ``}
          </td>
        </tr>`;
      }).join("");
    }

    function renderPatio(){
      const rows = getAgendaRows();
      const filaRows = patioFilaRegistros.slice().sort((a,b) => {
        const pa = Number(a.posicao_fila || 9999);
        const pb = Number(b.posicao_fila || 9999);
        if(pa !== pb) return pa - pb;
        return Number(b.prioridade || 0) - Number(a.prioridade || 0);
      });
      const boardRows = [
        { titulo:"Fila do Pátio", key:"aguardando", itens:filaRows.filter(r => r.status_fila === "aguardando") },
        { titulo:"Chamados", key:"chamado", itens:filaRows.filter(r => r.status_fila === "chamado") },
        { titulo:"Em Doca", key:"em_doca", itens:filaRows.filter(r => r.status_fila === "em_doca") },
        { titulo:"Expedidos", key:"expedido", itens:rows.filter(r => r.status_global === "Expedido").map(r => ({...r, status_fila:"expedido"})) }
      ];

      document.getElementById("patioNoPatioRef").textContent = filaRows.filter(r => ["aguardando","chamado"].includes(r.status_fila)).length;
      document.getElementById("patioCarregandoRef").textContent = rows.filter(r => r.status_global === "Em Carregamento").length;
      document.getElementById("patioSoftStat").textContent = `${filaRows.length} registros na fila`;
      renderFilaPatio(rows);

      document.getElementById("patioBoard").innerHTML = boardRows.map(g => {
        return `<div class="lane">
          <div class="lane-head"><h3>${g.titulo}</h3><span class="count">${g.itens.length}</span></div>
          ${g.itens.map(r => {
            const agenda = registros.find(a => a.id === (r.agenda_id || r.id)) || r;
            const sla = calcSla(agenda);
            const filaTag = r.posicao_fila ? `<span class="queue-tag">${r.posicao_fila}º na fila</span>` : "";
            const prioridade = g.key !== "expedido" ? `<div class="queue-priority">⚡ ${esc(getFilaPriorityLabel(r))}</div>` : "";
            const phone = getTelefoneMotorista(agenda);
            const actionButtons = g.key === "aguardando" ? `
              <div class="mini-actions" style="margin-top:10px">
                <button class="mini orange" onclick="event.stopPropagation(); chamarMotorista('${esc(r.id)}')">Chamar</button>
                <button class="mini blue" onclick="event.stopPropagation(); enviarMensagemMotoristaDaFila('${esc(r.id)}')" ${phone ? "" : "disabled"}>Mensagem</button>
              </div>` : g.key === "chamado" ? `
              <div class="mini-actions" style="margin-top:10px">
                <button class="mini green" onclick="event.stopPropagation(); enviarFilaParaDocaPrompt('${esc(r.id)}')">Enviar doca</button>
                <button class="mini blue" onclick="event.stopPropagation(); enviarMensagemMotoristaDaFila('${esc(r.id)}')" ${phone ? "" : "disabled"}>Mensagem</button>
              </div>` : ``;
            return `<div class="item" onclick="abrirDTPorId('${esc(r.agenda_id || r.id)}')">
              ${prioridade}
              <strong>DT ${esc(agenda.dt || "-")}</strong>
              <div class="meta">${esc(agenda.transportadora || "-")}<br>Motorista: ${esc(agenda.motorista || "-")}<br>Telefone: ${esc(formatarTelefoneVisual(phone) || "-")}<br>Doca destino: ${esc(r.doca_destino || agenda.doca_carregamento || agenda.doca_agenda || "-")}<br>${filaTag}<br><span class="${sla.cls}">${sla.label}</span></div>
              ${actionButtons}
            </div>`;
          }).join("") || `<div class="meta">Sem registros.</div>`}
        </div>`;
      }).join("");
    }

    
function renderDocas(){
      const rows = getAgendaRows();
      const listaDocas = getDocasOrdenadas();
      let livres = 0;
      let ocupadas = 0;
      let interditadas = 0;

      document.getElementById("docasGrid").innerHTML = listaDocas.map(d => {
        const nome = d.nome_original || d.nome || String(d.numero);
        const estado = getDockPlannedState(nome, rows);
        const filaAtual = patioFilaRegistros.find(r => compararDocas(r.doca_destino || "", nome) === 0 && r.status_fila === "em_doca");
        const atual = filaAtual ? (registros.find(a => a.id === filaAtual.agenda_id) || filaAtual) : estado.row;
        const nomeExibicao = d.nome_exibicao || nome;
        const observacao = d.observacao || getDocaObservacao(d.id || d.numero || d.nome) || "";
        const interdicao = getDocaInterdicaoByKey(d);
        const interditada = !!(d?.interditada || interdicao?.interditada);
        const motivoInterdicao = d?.motivo_interdicao || interdicao?.motivo || "";

        if(interditada){
          interditadas++;
          return `<div class="dock interditada">
            <div class="dock-head"><strong>${esc(nomeExibicao)}</strong><span class="count">Interditada</span></div>
            <div class="meta">Sem uso operacional enquanto a interdição estiver ativa.<br>Doca: ${esc(nomeExibicao)}</div>
            ${motivoInterdicao ? `<div class="dock-interdicao-note"><strong>Motivo:</strong> ${esc(motivoInterdicao)}</div>` : ``}
            ${observacao ? `<div class="dock-note"><strong>Obs.:</strong> ${esc(observacao)}</div>` : ``}
            <div class="dock-actions">
              <button class="mini red" onclick="event.stopPropagation();abrirModalInterdicaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Interditar</button>
              <button class="mini orange" onclick="event.stopPropagation();abrirModalObservacaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Observação</button>
            </div>
            <div class="dock-state interditada">Interditada</div>
          </div>`;
        }

        if(estado.kind === "free"){
          livres++;
          return `<div class="dock free">
            <div class="dock-head"><strong>${esc(nomeExibicao)}</strong><span class="count">Livre</span></div>
            <div class="meta">Sem veículo na doca.</div>
            ${observacao ? `<div class="dock-note"><strong>Obs.:</strong> ${esc(observacao)}</div>` : ``}
            <div class="dock-actions">
              <button class="mini red" onclick="event.stopPropagation();abrirModalInterdicaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Interditar</button>
              <button class="mini orange" onclick="event.stopPropagation();abrirModalObservacaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Observação</button>
              <button class="mini blue" onclick="event.stopPropagation();abrirAuditoriaDocaComFiltro('${esc(nome)}')">Auditoria</button>
            </div>
            <div class="dock-state free">Livre</div>
          </div>`;
        }

        ocupadas++;
        const sla = calcSla(atual || {});
        const phone = getTelefoneMotorista(atual || {});
        const stateClass = estado.kind === "busy" ? "busy" : estado.kind === "reserved" ? "reserved" : "finishing";
        return `<div class="dock ${estado.kind === "reserved" ? "free" : "busy"}" onclick="abrirDTPorId('${esc((atual && (atual.agenda_id || atual.id)) || '')}')">
          <div class="dock-head"><strong>${esc(nomeExibicao)}</strong><span class="count">${esc((atual && (atual.status_global || atual.status_fila)) || estado.label)}</span></div>
          <div class="meta">DT: ${esc((atual && atual.dt) || "-")}<br>Transportadora: ${esc((atual && atual.transportadora) || "-")}<br>Motorista: ${esc((atual && atual.motorista) || "-")}<br>Telefone: ${esc(formatarTelefoneVisual(phone) || "-")}<br>Doca: ${esc(nomeExibicao)}<br><span class="${sla.cls}">${sla.label}</span></div>
          ${observacao ? `<div class="dock-note"><strong>Obs.:</strong> ${esc(observacao)}</div>` : ``}
          <div class="dock-actions">
            <button class="mini red" onclick="event.stopPropagation();abrirModalInterdicaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Interditar</button>
            <button class="mini orange" onclick="event.stopPropagation();abrirModalObservacaoDoca('${esc(String(d.id || d.numero || d.nome || ""))}')">Observação</button>
            <button class="mini blue" onclick="event.stopPropagation();abrirAuditoriaDocaComFiltro('${esc(nome)}')">Auditoria</button>
          </div>
          <div class="dock-state ${stateClass}">${esc(estado.label)}</div>
        </div>`;
      }).join("");

      const elLivre = document.getElementById("docasLivreRef");
      const elOcup = document.getElementById("docasOcupadaRef");
      const elSoft = document.getElementById("docasSoftStat");
      if(elLivre) elLivre.textContent = livres;
      if(elOcup) elOcup.textContent = ocupadas;
      if(elSoft) elSoft.textContent = `${listaDocas.length} docas • ${ocupadas} ocupadas • ${interditadas} interditadas`;
    }

    function renderCheckin(){
      const rows = linhasFiltradas().filter(r => r.motorista || r.chegada_motorista || ["No Pátio","Em Doca","Em Carregamento","Expedido"].includes(r.status_global));
      document.getElementById("checkinHojeRef").textContent = rows.length;
      document.getElementById("checkinPresenteRef").textContent = rows.filter(r => r.presente_ausente === "Presente").length;
      document.getElementById("checkinSoftStat").textContent = `${rows.length} registros`;
      document.getElementById("checkinTabela").innerHTML = rows.map(r => `
        <tr>
          <td>${esc(r.dt)}</td>
          <td>${esc(r.transportadora)}</td>
          <td>${esc(r.motorista)}</td>
          <td>${esc(formatarTelefoneVisual(r.telefone_motorista || "") || "-")}</td>
          <td>${esc(formatPlacas(r) || "-")}</td>
          <td>${esc(r.presente_ausente)}</td>
          <td>${fmtDateTime(r.chegada_motorista)}</td>
          <td><span class="chip ${clsStatus(r.status_global)}">${esc(r.status_global)}</span></td>
          <td>
            <div class="mini-actions">
              <button class="mini blue" onclick="abrirDTPorId('${esc(r.id)}')">Abrir DT</button>
              <button class="mini orange" onclick="enviarMensagemPorAgenda('${esc(r.id)}')" ${getTelefoneMotorista(r) ? "" : "disabled"}>Enviar mensagem</button>
            </div>
          </td>
        </tr>`).join("");
    }

    function renderRelatorios(){
      const rows = getAgendaRows();
      const dataRef = dataFiltrada() ? fmtDate(dataFiltrada()) : "Todos";
      const expedidas = rows.filter(r => r.status_global === "Expedido");

      document.getElementById("relatorioDataRef").textContent = dataRef;
      document.getElementById("relatorioExpedidoRef").textContent = expedidas.length;

      const pesoExpedido = expedidas.reduce((a,b)=>a+(b.tonelagem||0),0);
      document.getElementById("relatorioPesoRef").textContent = `${pesoExpedido.toFixed(1)} t`;

      const mediaFila = rows.filter(r => r.chegada_motorista && r.data_em_doca).reduce((acc, r) => {
        const diff = (new Date(r.data_em_doca) - new Date(r.chegada_motorista)) / 60000;
        return acc + (Number.isFinite(diff) ? diff : 0);
      }, 0);
      const countFila = rows.filter(r => r.chegada_motorista && r.data_em_doca).length || 0;
      const mediaFilaFinal = countFila ? Math.round(mediaFila / countFila) : 0;

      const mediaCarga = rows.filter(r => r.inicio_carregamento && r.fim_carregamento).reduce((acc, r) => {
        const diff = (new Date(r.fim_carregamento) - new Date(r.inicio_carregamento)) / 60000;
        return acc + (Number.isFinite(diff) ? diff : 0);
      }, 0);
      const countCarga = rows.filter(r => r.inicio_carregamento && r.fim_carregamento).length || 0;
      const mediaCargaFinal = countCarga ? Math.round(mediaCarga / countCarga) : 0;

      const filaAtiva = rows.filter(r => r.status_global === "No Pátio").length;
      const atrasadas = rows.filter(r => calcSla(r).label === "Atrasado").length;
      const taxaExpedicao = rows.length ? Math.round((expedidas.length / rows.length) * 100) : 0;

      const cards = [
        { label:"Peso expedido", value: `${pesoExpedido.toFixed(1)} t`, cls:"status-green", icon:getKpiIcon("weight") },
        { label:"Taxa de expedição", value: `${taxaExpedicao}%`, cls:"status-blue", icon:getKpiIcon("chart") },
        { label:"Fila ativa", value: filaAtiva, cls:"status-orange", icon:getKpiIcon("truck") },
        { label:"DTs em atraso", value: atrasadas, cls:"status-red", icon:getKpiIcon("time") }
      ];

      document.getElementById("relatorioResumo").innerHTML = cards.map(k => `
        <div class="kpi ${k.cls}">
          <div class="kpi-icon">${k.icon}</div>
          <div class="label">${k.label}</div>
          <div class="value">${k.value}</div>
          <div class="sub">indicador consolidado</div>
        </div>`).join("");

      const exec = document.getElementById("relatorioExecutivo");
      if(exec){
        exec.innerHTML = `
          <div class="section-mini"><span>Média fila</span><strong>${mediaFilaFinal} min</strong></div>
          <div class="section-mini"><span>Média carregamento</span><strong>${mediaCargaFinal} min</strong></div>
          <div class="section-mini"><span>Expedidas</span><strong>${expedidas.length}</strong></div>
          <div class="section-mini"><span>Peso expedido</span><strong>${pesoExpedido.toFixed(1)} t</strong></div>
        `;
      }

      const turnos = ["T1","T2","T3"];

      const heData = turnos.map(t =>
        rows.filter(r => (r.turno_separacao || definirTurno(r.hora_agenda)) === t)
            .reduce((a,b)=>a+(b.he||0),0)
      );

      const hoData = turnos.map(t =>
        rows.filter(r => (r.turno_separacao || definirTurno(r.hora_agenda)) === t)
            .reduce((a,b)=>a+(b.ho||0),0)
      );

      const carrosData = turnos.map(t =>
        expedidas.filter(r => (r.turno_separacao || definirTurno(r.hora_agenda)) === t).length
      );

      const tonData = turnos.map(t =>
        expedidas
          .filter(r => (r.turno_separacao || definirTurno(r.hora_agenda)) === t)
          .reduce((a,b)=>a+(b.tonelagem||0),0)
      );

      if(chartHE) chartHE.destroy();
      if(chartHO) chartHO.destroy();
      if(chartCarrosTurno) chartCarrosTurno.destroy();
      if(chartTonelagemTurno) chartTonelagemTurno.destroy();

      chartHE = new Chart(document.getElementById("graficoHE"), {
        type:"bar",
        data:{ labels:turnos, datasets:[{ label:"HE", data:heData, borderRadius:12, borderSkipped:false, maxBarThickness:42, backgroundColor:["rgba(59,130,246,.92)","rgba(245,158,11,.92)","rgba(139,92,246,.92)"], hoverBackgroundColor:["rgba(96,165,250,1)","rgba(251,191,36,1)","rgba(167,139,250,1)"] }] },
        options: mergeChartOptions(getPremiumChartOptions(), {})
      });

      chartHO = new Chart(document.getElementById("graficoHO"), {
        type:"bar",
        data:{ labels:turnos, datasets:[{ label:"HO/PL", data:hoData, borderRadius:12, borderSkipped:false, maxBarThickness:42, backgroundColor:["rgba(6,182,212,.92)","rgba(34,197,94,.92)","rgba(239,68,68,.92)"], hoverBackgroundColor:["rgba(34,211,238,1)","rgba(74,222,128,1)","rgba(248,113,113,1)"] }] },
        options: mergeChartOptions(getPremiumChartOptions(), {})
      });

      chartCarrosTurno = new Chart(document.getElementById("graficoCarrosTurno"), {
        type:"bar",
        data:{ labels:turnos, datasets:[{ label:"Carros expedidos", data:carrosData, borderRadius:12, borderSkipped:false, maxBarThickness:42, backgroundColor:["rgba(37,99,235,.92)","rgba(14,165,233,.92)","rgba(124,58,237,.92)"], hoverBackgroundColor:["rgba(96,165,250,1)","rgba(56,189,248,1)","rgba(167,139,250,1)"] }] },
        options: mergeChartOptions(getPremiumChartOptions(), {
          scales:{ y:{ ticks:{ color:'#9fb0ca', precision:0, font:{ weight:'700', size:11 } } } }
        })
      });

      chartTonelagemTurno = new Chart(document.getElementById("graficoTonelagemTurno"), {
        type:"bar",
        data:{ labels:turnos, datasets:[{ label:"Tonelagem expedida", data:tonData, borderRadius:12, borderSkipped:false, maxBarThickness:42, backgroundColor:["rgba(20,184,166,.92)","rgba(34,197,94,.92)","rgba(245,158,11,.92)"], hoverBackgroundColor:["rgba(45,212,191,1)","rgba(74,222,128,1)","rgba(251,191,36,1)"] }] },
        options: mergeChartOptions(getPremiumChartOptions(), {})
      });
    }


    function getResultadoSeparacaoStorageKey(){
      return `glp_resultado_separacao_${dataFiltrada() || "todos"}`;
    }

    function getPassagemTurnoStorageKey(dataRef, turno){
      return `glp_passagem_turno_${dataRef || (dataFiltrada() || "todos")}_${turno || "T1"}`;
    }

    function getResultadoSeparacaoDefaults(){
      return {
        heProdPessoa:1405,
        hoProdPessoa:121,
        heMeta:0,
        hoMeta:0,
        he:{T1:{real:0,plan:0},T2:{real:0,plan:0},T3:{real:0,plan:0}},
        ho:{T1:{real:0,plan:0},T2:{real:0,plan:0},T3:{real:0,plan:0}}
      };
    }

    function getResultadoSeparacaoState(){
      try{
        return { ...getResultadoSeparacaoDefaults(), ...(JSON.parse(localStorage.getItem(getResultadoSeparacaoStorageKey()) || 'null') || {}) };
      }catch(_){
        return getResultadoSeparacaoDefaults();
      }
    }

    function setResultadoSeparacaoState(state){
      localStorage.setItem(getResultadoSeparacaoStorageKey(), JSON.stringify(state));
    }

    function preencherResultadoSeparacaoFormulario(state){
      const turno = getResultadoSeparacaoSelectedTurno();
      const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? 0; };
      setVal('resSepHeProdPessoa', state.heProdPessoa);
      setVal('resSepHoProdPessoa', state.hoProdPessoa);
      setVal('resSepHeMeta', state.heMeta);
      setVal('resSepHoMeta', state.hoMeta);
      setVal('resSepHeTurnoReal', state.he?.[turno]?.real ?? 0);
      setVal('resSepHeTurnoPlan', state.he?.[turno]?.plan ?? 0);
      setVal('resSepHoTurnoReal', state.ho?.[turno]?.real ?? 0);
      setVal('resSepHoTurnoPlan', state.ho?.[turno]?.plan ?? 0);
      const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      setText('resultadoSepFormTurnoBadge', `Turno ${turno}`);
      setText('resultadoSepTituloHe', turno);
      setText('resultadoSepTituloHo', turno);
    }

    function carregarResultadoSeparacaoFormulario(){
      preencherResultadoSeparacaoFormulario(getResultadoSeparacaoState());
      renderResultadoSeparacao();
    }

    function salvarResultadoSeparacaoFormulario(){
      const getNum = id => num(document.getElementById(id)?.value) || 0;
      const turno = getResultadoSeparacaoSelectedTurno();
      const state = getResultadoSeparacaoState();
      state.heProdPessoa = getNum('resSepHeProdPessoa');
      state.hoProdPessoa = getNum('resSepHoProdPessoa');
      state.heMeta = getNum('resSepHeMeta');
      state.hoMeta = getNum('resSepHoMeta');
      state.he = state.he || {T1:{real:0,plan:0},T2:{real:0,plan:0},T3:{real:0,plan:0}};
      state.ho = state.ho || {T1:{real:0,plan:0},T2:{real:0,plan:0},T3:{real:0,plan:0}};
      state.he[turno] = { real:getNum('resSepHeTurnoReal'), plan:getNum('resSepHeTurnoPlan') };
      state.ho[turno] = { real:getNum('resSepHoTurnoReal'), plan:getNum('resSepHoTurnoPlan') };
      setResultadoSeparacaoState(state);
      showToast(`Resultado da separação salvo para ${turno}`);
      renderResultadoSeparacao();
    }

    function renderResultadoSeparacao(){
      const section = document.getElementById('view-resultado-separacao');
      if(!section) return;
      const turnos = ['T1','T2','T3'];
      const dataRaw = getResultadoSeparacaoSelectedDataRaw();
      const turnoSelecionado = getResultadoSeparacaoSelectedTurno();
      const filtroDataEl = document.getElementById('resultadoSepData');
      if(filtroDataEl && filtroDataEl.value !== dataRaw) filtroDataEl.value = dataRaw;
      const rowsBase = getAgendaRows();
      const rows = dataRaw ? rowsBase.filter(r => r.data_agenda === dataRaw) : rowsBase;
      const state = getResultadoSeparacaoState();
      preencherResultadoSeparacaoFormulario(state);
      const dataRef = dataRaw ? fmtDate(dataRaw) : 'Todos';
      const rowsPorTurno = t => rows.filter(r => (r.turno_separacao || definirTurno(r.hora_agenda)) === t);
      const planejadoHe = rows.reduce((a,b)=>a+(b.he||0),0);
      const planejadoHo = rows.reduce((a,b)=>a+(b.ho||0),0);
      const realizadoHeT = Object.fromEntries(turnos.map(t => [t, rowsPorTurno(t).filter(r => ['Separado','Pronto Expedição','No Pátio','Em Doca','Em Carregamento','Expedido'].includes(r.status_global)).reduce((a,b)=>a+(b.he||0),0)]));
      const realizadoHoT = Object.fromEntries(turnos.map(t => [t, rowsPorTurno(t).filter(r => ['Separado','Pronto Expedição','No Pátio','Em Doca','Em Carregamento','Expedido'].includes(r.status_global)).reduce((a,b)=>a+(b.ho||0),0)]));
      const realizadoHe = turnos.reduce((a,t)=>a+realizadoHeT[t],0);
      const realizadoHo = turnos.reduce((a,t)=>a+realizadoHoT[t],0);
      const pendHe = Math.max(planejadoHe - realizadoHe, 0);
      const pendHo = Math.max(planejadoHo - realizadoHo, 0);
      const capHeT = Object.fromEntries(turnos.map(t => [t, (state.he?.[t]?.real || 0) * (state.heProdPessoa || 0)]));
      const capHoT = Object.fromEntries(turnos.map(t => [t, (state.ho?.[t]?.real || 0) * (state.hoProdPessoa || 0)]));
      const capHeSelecionado = capHeT[turnoSelecionado] || 0;
      const capHoSelecionado = capHoT[turnoSelecionado] || 0;
      const efHe = capHeSelecionado ? Math.round((realizadoHeT[turnoSelecionado] / capHeSelecionado) * 100) : 0;
      const efHo = capHoSelecionado ? Math.round((realizadoHoT[turnoSelecionado] / capHoSelecionado) * 100) : 0;
      const setText = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
      setText('resultadoSepDataRef', dataRef);
      setText('resultadoSepTurnoRef', turnoSelecionado);
      setText('resultadoSepEfHeRef', `${efHe}%`);
      setText('resultadoSepEfHoRef', `${efHo}%`);
      setText('resultadoSepHeadHe', turnoSelecionado);
      setText('resultadoSepHeadHo', turnoSelecionado);
      setText('resultadoSepBadgeHe', `HE • ${turnoSelecionado}`);
      setText('resultadoSepBadgeHo', `HO • ${turnoSelecionado}`);
      setText('resSepProgramadoHe', planejadoHe.toLocaleString('pt-BR'));
      setText('resSepProgramadoHo', planejadoHo.toLocaleString('pt-BR'));
      setText('resSepRealizadoHe', realizadoHeT[turnoSelecionado].toLocaleString('pt-BR'));
      setText('resSepRealizadoHo', realizadoHoT[turnoSelecionado].toLocaleString('pt-BR'));
      setText('resSepPendenteHe', Math.max(planejadoHe - realizadoHeT[turnoSelecionado], 0).toLocaleString('pt-BR'));
      setText('resSepPendenteHo', Math.max(planejadoHo - realizadoHoT[turnoSelecionado], 0).toLocaleString('pt-BR'));
      const renderTable = (id, tipo, realizadoT, capT) => {
        const tbody = document.getElementById(id); if(!tbody) return;
        const src = state[tipo] || {};
        const turnoData = src[turnoSelecionado] || { real:0, plan:0 };
        const eficiencia = capT[turnoSelecionado] ? `${Math.round((realizadoT[turnoSelecionado]/capT[turnoSelecionado])*100)}%` : '0%';
        const linhas = [
          ['M/O Real', turnoData.real],
          ['M/O Planejada', turnoData.plan],
          ['Capacidade Real', capT[turnoSelecionado] || 0],
          [`Realizado ${tipo.toUpperCase()}`, realizadoT[turnoSelecionado] || 0],
          [`Eficiência ${tipo.toUpperCase()}`, eficiencia]
        ];
        tbody.innerHTML = linhas.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
      };
      renderTable('resultadoSepTabelaHE','he',realizadoHeT,capHeT);
      renderTable('resultadoSepTabelaHO','ho',realizadoHoT,capHoT);
      if(chartResultadoSepHE) chartResultadoSepHE.destroy();
      if(chartResultadoSepHO) chartResultadoSepHO.destroy();
      const buildChart = (canvasId, realizadoValor, capValor, lineColor) => new Chart(document.getElementById(canvasId), {
        type:'bar',
        data:{ labels:[turnoSelecionado], datasets:[
          { label:'Realizado', data:[realizadoValor], borderRadius:12, borderSkipped:false, maxBarThickness:70, backgroundColor:['rgba(34,211,238,.92)'] },
          { type:'line', label:'Capacidade', data:[capValor], borderColor:lineColor, pointBackgroundColor:lineColor, pointRadius:4, tension:.25 }
        ]},
        options: mergeChartOptions(getPremiumChartOptions(), { plugins:{ legend:{ labels:{ color:'#f8fafc' } } } })
      });
      chartResultadoSepHE = buildChart('graficoResultadoSepHE', realizadoHeT[turnoSelecionado], capHeSelecionado, 'rgba(251,146,60,1)');
      chartResultadoSepHO = buildChart('graficoResultadoSepHO', realizadoHoT[turnoSelecionado], capHoSelecionado, 'rgba(59,130,246,1)');
    }

    const PASSAGEM_AREAS = ['Linha 5','Linha 6','Avarias','Expedição | EMB','Gestão de Estoque','Almoxarifado','Abastecimento','PD'];

    function getPassagemTurnoDefaults(){
      return {
        responsavel:'', operador:0, conferente:0, exclusiva:0,
        ferias:{operador:0, conferente:0, exclusiva:0},
        ausencias:{operador:0, conferente:0, exclusiva:0},
        bancoHoras:{operador:0, conferente:0, exclusiva:0},
        areas:Object.fromEntries(PASSAGEM_AREAS.map(a => [a,{mo:0, horas:0}])),
        ocorrencias:'', recebidoPor:'', horario:''
      };
    }

    function getPassagemTurnoState(){
      const dataRef = document.getElementById('passagemData')?.value || dataFiltrada() || '';
      const turno = document.getElementById('passagemTurno')?.value || 'T1';
      try{ return { ...getPassagemTurnoDefaults(), ...(JSON.parse(localStorage.getItem(getPassagemTurnoStorageKey(dataRef, turno)) || 'null') || {}) }; }catch(_){ return getPassagemTurnoDefaults(); }
    }

    function savePassagemTurnoState(state){
      const dataRef = document.getElementById('passagemData')?.value || dataFiltrada() || '';
      const turno = document.getElementById('passagemTurno')?.value || 'T1';
      localStorage.setItem(getPassagemTurnoStorageKey(dataRef, turno), JSON.stringify(state));
    }

    function renderPassagemAreas(state){
      const slug = area => area.replace(/[^a-zA-Z0-9]/g,'_');
      const wrap = document.getElementById('passagemAreasWrap');
      if(wrap){
        wrap.innerHTML = PASSAGEM_AREAS.map(area => `
          <div class="passagem-area-card">
            <h4>${esc(area)}</h4>
            <label>M/O</label><input type="number" id="passagemAreaMo_${slug(area)}" value="${esc(state.areas?.[area]?.mo ?? 0)}">
            <label>Horas</label><input type="number" id="passagemAreaHoras_${slug(area)}" value="${esc(state.areas?.[area]?.horas ?? 0)}">
          </div>`).join('');
      }
      const wrapIndicador = document.getElementById('passagemAreasWrapIndicador');
      if(wrapIndicador){
        wrapIndicador.innerHTML = PASSAGEM_AREAS.map(area => `
          <div class="passagem-area-card">
            <h4>${esc(area)}</h4>
            <label>M/O</label><div class="pt-ind-summary-value">${esc(state.areas?.[area]?.mo ?? 0)}</div>
            <label>Horas</label><div class="pt-ind-summary-value">${esc(state.areas?.[area]?.horas ?? 0)}</div>
          </div>`).join('');
      }
    }

    function collectPassagemTurnoState(){
      const g = id => document.getElementById(id);
      const n = id => num(g(id)?.value) || 0;
      const state = getPassagemTurnoDefaults();
      state.responsavel = g('passagemResponsavel')?.value || '';
      state.operador = n('passagemOperador');
      state.conferente = n('passagemConferente');
      state.exclusiva = n('passagemExclusiva');
      state.recebidoPor = g('passagemRecebidoPor')?.value || '';
      state.horario = g('passagemHorario')?.value || '';
      state.ocorrencias = g('passagemOcorrencias')?.value || '';
      ['operador','conferente','exclusiva'].forEach(ch => {
        state.ferias[ch] = num(document.getElementById(`passagemFerias_${ch}`)?.value) || 0;
        state.ausencias[ch] = num(document.getElementById(`passagemAusencias_${ch}`)?.value) || 0;
        state.bancoHoras[ch] = num(document.getElementById(`passagemBancoHoras_${ch}`)?.value) || 0;
      });
      PASSAGEM_AREAS.forEach(area => {
        const slug = area.replace(/[^a-zA-Z0-9]/g,'_');
        state.areas[area] = { mo:n(`passagemAreaMo_${slug}`), horas:n(`passagemAreaHoras_${slug}`) };
      });
      return state;
    }

    function renderMiniPassagemInputs(prefix, state){
      return ['operador','conferente','exclusiva'].map(ch => `<div class="passagem-mini-input" style="display:flex;flex-direction:column;gap:6px"><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">${ch.charAt(0).toUpperCase()+ch.slice(1)}</label><input id="${prefix}_${ch}" type="number" value="${esc(state[ch] ?? 0)}"></div>`).join('');
    }

    function renderPassagemTurno(){
      const barra = document.getElementById('passagemStatusBar');
      if(barra && !barra.dataset.init){
        atualizarStatusPassagem('idle');
        barra.dataset.init = '1';
      }
      const section = document.getElementById('view-passagem-turno');
      if(!section) return;
      const dtInput = document.getElementById('passagemData'); if(dtInput && !dtInput.value && dataFiltrada()) dtInput.value = dataFiltrada();
      const turnoEl = document.getElementById('passagemTurno');
      const dataRefRaw = dtInput?.value || dataFiltrada() || '';
      const turno = turnoEl?.value || 'T1';
      const state = getPassagemTurnoState();
      const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? ''; };
      setVal('passagemResponsavel', state.responsavel); setVal('passagemOperador', state.operador); setVal('passagemConferente', state.conferente); setVal('passagemExclusiva', state.exclusiva); setVal('passagemRecebidoPor', state.recebidoPor); setVal('passagemHorario', state.horario); setVal('passagemOcorrencias', state.ocorrencias);
      ['ferias','ausencias','bancoHoras'].forEach(prefix => {
        const box = document.querySelector(`#graficoPassagem${prefix === 'bancoHoras' ? 'BancoHoras' : prefix.charAt(0).toUpperCase()+prefix.slice(1)}`)?.closest('.card');
        if(box){
          let holder = box.querySelector('.passagem-mini-inputs-v2, .passagem-mini-inputs');
          if(!holder){
            holder = document.createElement('div');
            holder.className = 'passagem-mini-inputs';
            holder.style.display = 'grid';
            holder.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr))';
            holder.style.gap = '8px';
            holder.style.marginTop = '12px';
            box.appendChild(holder);
          }
          holder.innerHTML = renderMiniPassagemInputs(`passagem${prefix.charAt(0).toUpperCase()+prefix.slice(1)}`, state[prefix]);
        }
      });
      renderPassagemAreas(state);
      bindPassagemLiveInputs();
      const rows = getAgendaRows().filter(r => !dataRefRaw || r.data_agenda === dataRefRaw);
      const programado = rows.filter(r => definirTurno(r.hora_agenda) === turno);
      const realizado = rows.filter(r => r.status_global === 'Expedido');
      const vira = programado.filter(r => r.status_global !== 'Expedido' && ['Em Doca','Em Carregamento','No Pátio','Pronto Expedição','Separado'].includes(r.status_global));
      const atrasado = programado.filter(r => calcSla(r).label === 'Atrasado');
      const setKpiText = (ids,val)=>{ (Array.isArray(ids)?ids:[ids]).forEach(id => { const el=document.getElementById(id); if(el) el.textContent = val; }); };
      const tons = arr => arr.reduce((a,b)=>a+getTonelagemPassagem(b),0);
      const kpi = (arr, tonsIds, carrosIds) => { setKpiText(carrosIds, arr.length); setKpiText(tonsIds, formatPassagemTonelagem(tons(arr))); };

      kpi(programado,['passagemProgTons','passagemProgramadoTons'],['passagemProgCarros','passagemProgramadoCarros']); kpi(realizado,['passagemRealTons','passagemRealizadoTons'],['passagemRealCarros','passagemRealizadoCarros']); kpi(vira,'passagemViraTons','passagemViraCarros'); kpi(atrasado,'passagemAtrasadoTons','passagemAtrasadoCarros');
      setKpiText('passagemPreviewProgramado', document.getElementById('passagemProgramadoTons')?.textContent || '0');
      setKpiText('passagemPreviewRealizado', document.getElementById('passagemRealizadoTons')?.textContent || '0');
      setKpiText('passagemPreviewVira', document.getElementById('passagemViraTons')?.textContent || '0');
      setKpiText('passagemPreviewAtrasado', document.getElementById('passagemAtrasadoTons')?.textContent || '0');
      setKpiText('passagemEmailAssunto', `Passagem de turno • Expedição • ${(document.getElementById('passagemData')?.value || 'sem data')} (${turno})`);
      setKpiText('passagemIndDataRef', dataRefRaw ? fmtDate(dataRefRaw) : 'Todos');
      setKpiText('passagemIndTurnoDesc', descricaoTurnoPassagem(turno) || turno);
      setKpiText('passagemIndProgramadoCarros', document.getElementById('passagemProgramadoCarros')?.textContent || '0');
      setKpiText('passagemIndRealizadoCarros', document.getElementById('passagemRealizadoCarros')?.textContent || '0');
      setKpiText('passagemIndViraCarros', document.getElementById('passagemViraCarros')?.textContent || '0');
      setKpiText('passagemIndAtrasadoCarros', document.getElementById('passagemAtrasadoCarros')?.textContent || '0');
      setKpiText('passagemIndOperador', state.operador || 0);
      setKpiText('passagemIndConferente', state.conferente || 0);
      setKpiText('passagemIndExclusiva', state.exclusiva || 0);
      setKpiText('passagemIndResponsavel', state.responsavel || '-');
      setKpiText('passagemIndRecebidoPor', state.recebidoPor || '-');
      setKpiText('passagemIndHorario', state.horario || '-');
      setKpiText('passagemIndOcorrencias', state.ocorrencias || 'Sem observações registradas.');
      ['operador','conferente','exclusiva'].forEach(ch => {
        setKpiText(`passagemIndFerias_${ch}`, state.ferias?.[ch] || 0);
        setKpiText(`passagemIndAusencias_${ch}`, state.ausencias?.[ch] || 0);
        setKpiText(`passagemIndBancoHoras_${ch}`, state.bancoHoras?.[ch] || 0);
      });
      setKpiText('passagemPreviewTurnoEmail', turno);
      setKpiText('passagemPreviewQuadroEmail', totalQuadro);
      setKpiText('passagemPreviewProgramadoEmail', document.getElementById('passagemProgramadoTons')?.textContent || '0');
      setKpiText('passagemPreviewRealizadoEmail', document.getElementById('passagemRealizadoTons')?.textContent || '0');
      setKpiText('passagemPreviewViraEmail', document.getElementById('passagemViraTons')?.textContent || '0');
      setKpiText('passagemPreviewAtrasadoEmail', document.getElementById('passagemAtrasadoTons')?.textContent || '0');

      const totalQuadro = (Number(state.operador)||0)+(Number(state.conferente)||0)+(Number(state.exclusiva)||0);
      const setText2 = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
      setText2('passagemTurnoRef', turno); setText2('passagemTotalQuadroRef', totalQuadro);
      setText2('passagemPreviewTurno', turno); const turnoRefEl=document.getElementById('passagemTurnoRef'); if(turnoRefEl) turnoRefEl.textContent = descricaoTurnoPassagem(turno) || turno;
      setText2('passagemPreviewQuadro', totalQuadro);
      const donutData = [state.operador || 0, state.conferente || 0, state.exclusiva || 0];
      if(chartPassagemQuadro) chartPassagemQuadro.destroy();
      if(chartPassagemFerias) chartPassagemFerias.destroy();
      if(chartPassagemAusencias) chartPassagemAusencias.destroy();
      if(chartPassagemBancoHoras) chartPassagemBancoHoras.destroy();
      chartPassagemQuadro = new Chart(document.getElementById('graficoPassagemQuadro'), { type:'doughnut', data:{ labels:['Operador','Conferente','Exclusiva'], datasets:[{ data:donutData, backgroundColor:['rgba(34,211,238,.95)','rgba(59,130,246,.95)','rgba(251,146,60,.95)'], borderColor:'rgba(8,11,18,.92)', borderWidth:3 }] }, options: mergeChartOptions(getPremiumChartOptions(), { responsive:true, maintainAspectRatio:false, cutout:'68%', layout:{ padding:{ top:12, right:14, bottom:12, left:14 } }, plugins:{ legend:{ position:'right', labels:{ color:'#eef4ff', boxWidth:10, boxHeight:10, padding:12 } }, passagemDonutLabels:{ totalLabel:'Total' } } }) });
      const miniChart = (canvasId, src) => new Chart(document.getElementById(canvasId), { type:'bar', data:{ labels:['Operador','Conferente','Exclusiva'], datasets:[{ data:[src.operador||0, src.conferente||0, src.exclusiva||0], borderRadius:10, borderSkipped:false, backgroundColor:['rgba(34,211,238,.95)','rgba(59,130,246,.95)','rgba(251,146,60,.95)'] }] }, options: mergeChartOptions(getPremiumChartOptions(), { plugins:{ legend:{ display:false } }, scales:{ y:{ ticks:{ precision:0 } } } }) });
      chartPassagemFerias = miniChart('graficoPassagemFerias', state.ferias || {});
      chartPassagemAusencias = miniChart('graficoPassagemAusencias', state.ausencias || {});
      chartPassagemBancoHoras = miniChart('graficoPassagemBancoHoras', state.bancoHoras || {});

      const renderMiniIndicador = (refName, canvasId, src) => {
        try{
          const canvas = document.getElementById(canvasId);
          if(!canvas) return;
          if(window[refName]) window[refName].destroy();
          window[refName] = new Chart(canvas, {
            type:'bar',
            data:{
              labels:['Operador','Conferente','Exclusiva'],
              datasets:[{
                data:[src.operador||0, src.conferente||0, src.exclusiva||0],
                borderRadius:10,
                borderSkipped:false,
                backgroundColor:['rgba(34,211,238,.95)','rgba(59,130,246,.95)','rgba(251,146,60,.95)']
              }]
            },
            options: mergeChartOptions(getPremiumChartOptions(), {
              maintainAspectRatio:false,
              layout:{ padding:{ top:22, right:10, bottom:6, left:10 } },
              plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#eaf0fb', boxWidth:8, boxHeight:8, padding:12, font:{ size:10, weight:'700' } } }, passagemValueLabels:{ enabled:true } },
              scales:{ x:{ grid:{ display:false }, ticks:{ display:false } }, y:{ beginAtZero:true, grid:{ display:false }, border:{ display:false }, ticks:{ display:false, precision:0, stepSize:1 } } }
            })
          });
        }catch(err){ console.error(err); }
      };
      renderMiniIndicador('chartPassagemFeriasIndicador','graficoPassagemFeriasIndicador', state.ferias || {});
      renderMiniIndicador('chartPassagemAusenciasIndicador','graficoPassagemAusenciasIndicador', state.ausencias || {});
      renderMiniIndicador('chartPassagemBancoHorasIndicador','graficoPassagemBancoHorasIndicador', state.bancoHoras || {});
    }

    function salvarPassagemTurno(){
      const state = collectPassagemTurnoState();
      savePassagemTurnoState(state);
      const salvoEm = formatarDataHoraStatusPassagem();
      atualizarStatusPassagem('saved', salvoEm);
      showToast('Passagem de turno salva com sucesso');
      renderPassagemTurno();
    }

    function carregarSelectPatio(){
      const rows = linhasFiltradas().filter(r => ["Pronto Expedição","No Pátio","Em Doca","Em Carregamento"].includes(r.status_global));
      document.getElementById("p_dt").innerHTML = `<option value="">Selecione</option>` + rows.map(r => `<option value="${esc(r.id)}">${esc(r.dt)} - ${esc(r.transportadora || "")}</option>`).join("");
    }

    function carregarSelectCheckin(){
      const rows = linhasFiltradas().filter(r => ["Pronto Expedição","No Pátio","Em Doca","Em Carregamento","Agendado","Separado"].includes(r.status_global));
      document.getElementById("c_dt").innerHTML = `<option value="">Selecione</option>` + rows.map(r => `<option value="${esc(r.id)}">${esc(r.dt)} - ${esc(r.transportadora || "")}</option>`).join("");
    }


    async function rpcEntrarFilaPatio(agendaId, docaDestino = null, observacao = null){
      const { data: sessao } = await sb.auth.getSession();
      const user = sessao?.session?.user || null;
      const payload = {
        p_agenda_id: agendaId,
        p_doca_destino: docaDestino,
        p_observacao: observacao,
        p_usuario_id: user?.id || null,
        p_usuario_nome: document.getElementById("userNome")?.textContent || null,
        p_usuario_email: document.getElementById("userEmail")?.textContent || null,
        p_perfil: usuarioPerfil || null
      };
      const { data, error } = await sb.rpc("rpc_entrar_fila_patio", payload);
      if(error) throw error;
      return data;
    }

    async function rpcChamarMotoristaFila(filaId){
      const { data: sessao } = await sb.auth.getSession();
      const user = sessao?.session?.user || null;
      const payload = {
        p_fila_id: filaId,
        p_usuario_id: user?.id || null,
        p_usuario_nome: document.getElementById("userNome")?.textContent || null,
        p_usuario_email: document.getElementById("userEmail")?.textContent || null,
        p_perfil: usuarioPerfil || null
      };
      const { data, error } = await sb.rpc("rpc_chamar_motorista", payload);
      if(error) throw error;
      return data;
    }

    async function rpcLinkWhatsappMotoristaFila(filaId, mensagem = null){
      const payload = {
        p_fila_id: filaId,
        p_mensagem: mensagem
      };
      const { data, error } = await sb.rpc("rpc_link_whatsapp_motorista", payload);
      if(error) throw error;
      return data;
    }

    async function rpcEnviarParaDocaFila(filaId, doca){
      const { data: sessao } = await sb.auth.getSession();
      const user = sessao?.session?.user || null;
      const payload = {
        p_fila_id: filaId,
        p_doca: doca,
        p_usuario_id: user?.id || null,
        p_usuario_nome: document.getElementById("userNome")?.textContent || null,
        p_usuario_email: document.getElementById("userEmail")?.textContent || null,
        p_perfil: usuarioPerfil || null
      };
      const { data, error } = await sb.rpc("rpc_enviar_para_doca", payload);
      if(error) throw error;
      return data;
    }

    async function enviarDTParaFilaPatio(agendaId){
      if(!requirePermission("patio_operate", "Seu perfil não pode enviar DT para a fila do pátio.")) return;
      try{
        await rpcEntrarFilaPatio(agendaId, null, "Enviado pelo sistema interno");
        registrarLogSistema("entrada_fila_patio", `Agenda ${agendaId} enviada para a fila do pátio`);
        showToast("DT enviada para a fila do pátio");
        await carregarTudo();
      }catch(err){
        console.error(err);
        alert("Erro ao enviar a DT para a fila do pátio. Verifique se a RPC e a tabela patio_fila já foram criadas.");
      }
    }

    function preencherPatio(){
      const id = document.getElementById("p_dt").value;
      const r = registros.find(x => x.id === id);
      document.getElementById("p_doca").value = r?.doca_carregamento || r?.doca_agenda || "";
      document.getElementById("p_motorista").value = r?.motorista || "";
      document.getElementById("p_telefone_motorista").value = formatarTelefoneVisual(r?.telefone_motorista || "");
      document.getElementById("p_placa_cavalo").value = r?.placa_cavalo || "";
      document.getElementById("p_placa_carreta").value = r?.placa_carreta || "";
      document.getElementById("p_placa_reboque_1").value = r?.placa_reboque_1 || "";
      document.getElementById("p_placa_reboque_2").value = r?.placa_reboque_2 || "";
      document.getElementById("p_presenca").value = r?.presente_ausente || "";
    }

    async function moverPatio(status){
      if(!requirePermission("patio_operate", "Seu perfil não pode movimentar o pátio.")) return;
      const id = document.getElementById("p_dt").value;
      if(!id) return alert("Selecione a DT.");

      if(status === "No Pátio"){
        return await enviarDTParaFilaPatio(id);
      }

      if(status === "Em Doca"){
        try{
          const fila = patioFilaRegistros.find(x => x.agenda_id === id);
          if(!fila) return alert("Essa DT ainda não está na fila do pátio.");
          const doca = document.getElementById("p_doca").value || null;
          if(!doca) return alert("Selecione a doca de destino.");
          await rpcEnviarParaDocaFila(fila.id, doca);
          registrarLogSistema("envio_para_doca", `DT ${fila.dt || "-"} enviada para a doca ${doca}`);
          showToast(`DT enviada para ${doca}`);
          await carregarTudo();
          return;
        }catch(err){
          console.error(err);
          return alert("Erro ao enviar para a doca pela fila do pátio.");
        }
      }

      const payload = {
        status_global: status,
        doca_carregamento: document.getElementById("p_doca").value || null,
        motorista: document.getElementById("p_motorista").value.trim() || null,
        telefone_motorista: normalizarTelefone(document.getElementById("p_telefone_motorista").value) || null,
        placa_cavalo: document.getElementById("p_placa_cavalo").value.trim() || null,
        placa_carreta: document.getElementById("p_placa_carreta").value.trim() || null,
        placa_reboque_1: document.getElementById("p_placa_reboque_1").value.trim() || null,
        placa_reboque_2: document.getElementById("p_placa_reboque_2").value.trim() || null,
        presente_ausente: document.getElementById("p_presenca").value || null
      };
      if(status === "Em Carregamento") payload.inicio_carregamento = new Date().toISOString();
      if(status === "Expedido") payload.fim_carregamento = new Date().toISOString();

      const { error } = await sb.from("agendas").update(payload).eq("id", id);
      if(error){ console.error(error); return alert("Erro ao atualizar movimentação do pátio."); }
      const row = registros.find(r => r.id === id);
      registrarLogSistema("movimentacao_patio", `DT ${row?.dt || "-"} movida para ${status}`);
      await carregarTudo();
      showToast(`DT movida para ${status}`);
    }

    async function registrarCheckin(){
      if(!requirePermission("checkin_operate", "Seu perfil não pode registrar check-in.")) return;
      const id = document.getElementById("c_dt").value;
      if(!id) return alert("Selecione a DT.");
      const telefoneMotorista = normalizarTelefone(document.getElementById("c_telefone_motorista").value);
      if(!telefoneMotorista || telefoneMotorista.length < 10) return alert("Informe um telefone válido do motorista.");
      const payload = {
        motorista: document.getElementById("c_motorista").value.trim() || null,
        telefone_motorista: telefoneMotorista,
        placa_cavalo: document.getElementById("c_placa_cavalo").value.trim() || null,
        placa_carreta: document.getElementById("c_placa_carreta").value.trim() || null,
        placa_reboque_1: document.getElementById("c_placa_reboque_1").value.trim() || null,
        placa_reboque_2: document.getElementById("c_placa_reboque_2").value.trim() || null,
        presente_ausente: document.getElementById("c_presenca").value || null,
        observacao_geral: document.getElementById("c_obs").value.trim() || null,
        chegada_motorista: new Date().toISOString()
      };
      const upd = await sb.from("agendas").update(payload).eq("id", id);
      if(upd.error){ console.error(upd.error); return alert("Erro ao registrar check-in."); }
      try{
        await rpcEntrarFilaPatio(id, null, "Check-in interno registrado");
      }catch(err){
        console.error(err);
        return alert("Check-in salvo, mas a entrada na fila do pátio falhou. Verifique a RPC rpc_entrar_fila_patio.");
      }
      const row = registros.find(r => r.id === id);
      registrarLogSistema("checkin", `DT ${row?.dt || "-"} recebeu check-in interno e entrou na fila do pátio`);
      await carregarTudo();
      showToast("Check-in registrado");
    }

    async function mudarStatus(id, status){
      const row = registros.find(r => r.id === id);
      if(!row) return alert("DT não encontrada.");
      if(!podeTransicionar(row.status_global || "Agendado", status)){
        return alert(`Fluxo bloqueado: não é permitido sair de ${row.status_global || "Agendado"} para ${status}.`);
      }
      const payload = automacoesStatus(row, status);
      const { error } = await sb.from("agendas").update(payload).eq("id", id);
      if(error){ console.error(error); return alert("Erro ao alterar status."); }
      registrarLogSistema("mudar_status", `DT ${row.dt} • ${row.status_global || "Agendado"} → ${status}`);
      await carregarTudo();
      showToast(`Status alterado para ${status}`);
    }

    function aplicarModoModal(){
      const info = document.getElementById("blocoInfo");
      const sep = document.getElementById("blocoSeparacao");
      const exp = document.getElementById("blocoExpedicao");
      info.style.display = "block"; sep.style.display = "block"; exp.style.display = "block";

      const bloquearCampos = (container, bloquear) => container.querySelectorAll("input, select, textarea").forEach(el => el.disabled = bloquear);
      document.getElementById("m_dt").disabled = true;

      const perms = getRolePermissions();
      if(perms.read_only){
        bloquearCampos(info, true);
        bloquearCampos(sep, true);
        bloquearCampos(exp, true);
        document.getElementById("m_dt").disabled = true;
        return;
      }

      switch(viewAtualGlobal){
        case "agenda":
          sep.style.display = "none";
          exp.style.display = "none";
          bloquearCampos(info, !perms.dt_edit);
          break;
        case "separacao":
          exp.style.display = "none";
          bloquearCampos(info, true);
          bloquearCampos(sep, !perms.dt_edit);
          break;
        case "expedicao":
        case "patio":
          bloquearCampos(info, true);
          bloquearCampos(sep, true);
          bloquearCampos(exp, !perms.dt_edit);
          break;
        default:
          bloquearCampos(info, !perms.dt_edit);
          bloquearCampos(sep, !perms.dt_edit);
          bloquearCampos(exp, !perms.dt_edit);
      }
      document.getElementById("m_dt").disabled = true;
    }

    async function abrirDTPorId(id){
      const row = registros.find(r => r.id === id);
      if(!row){ alert("DT não encontrada."); return; }
      dtAtual = row;
      document.getElementById("dtModalSub").textContent = `DT ${row.dt || "-"} • ${row.transportadora || "-"} • ${row.cliente || "-"}`;
      const statusWrap = document.getElementById("dtModalStatusWrap");
      if(statusWrap){
        statusWrap.innerHTML = `<span class="chip ${clsStatus(row.status_global)}">${esc(row.status_global || "Sem status")}</span>`;
      }
      const resumo = {
        dt: document.getElementById("resumo_dt"),
        status: document.getElementById("resumo_status"),
        transportadora: document.getElementById("resumo_transportadora"),
        doca: document.getElementById("resumo_doca")
      };
      if(resumo.dt) resumo.dt.textContent = row.dt || "-";
      if(resumo.status) resumo.status.textContent = row.status_global || "-";
      if(resumo.transportadora) resumo.transportadora.textContent = row.transportadora || "-";
      if(resumo.doca) resumo.doca.textContent = `${row.doca_carregamento || row.doca_agenda || row.doca_planejada || "-"} • ${row.hora_agenda || "Sem janela"}`;
      const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? ""; };
      set("m_dt", row.dt);
      set("m_ordem", row.ordem);
      set("m_remessa", row.remessa);
      set("m_cliente", row.cliente);
      set("m_transportadora", row.transportadora);
      set("m_data_agenda", row.data_agenda);
      set("m_hora_agenda", row.hora_agenda);
      set("m_tempodecarregamento", valorTempoCarregamento(row));
      set("m_terminoprevisto", valorTerminoPrevisto(row));
      set("m_tipo_carga", row.tipo_carga);
      set("m_tipo_veiculo", row.tipo_veiculo);
      set("m_tipo_frete", row.tipo_frete);
      set("m_perfil_carga", row.perfil_carga);
      set("m_doca_agenda", row.doca_agenda);
      set("m_status_global", row.status_global || "Agendado");
      set("m_peso", row.peso);
      set("m_cubagem", row.cubagem);
      set("m_tonelagem", row.tonelagem);
      set("m_he", row.he);
      set("m_ho", row.ho);
      set("m_total_caixas", row.total_caixas);
      set("m_observacao_geral", row.observacao_geral);
      set("m_doca_planejada", row.doca_planejada);
      set("m_tipo_separacao", row.tipo_separacao);
      set("m_inicio_separacao", toInputDateTime(row.inicio_separacao));
      set("m_fim_separacao", toInputDateTime(row.fim_separacao));
      set("m_status_separacao", row.status_separacao);
      set("m_turno_separacao", row.turno_separacao || definirTurno(row.hora_agenda));
      set("m_inicio_recebimento", toInputDateTime(row.inicio_recebimento));
      set("m_fim_recebimento", toInputDateTime(row.fim_recebimento));
      set("m_conf_recebimento", row.conferente_recebimento);
      set("m_status_recebimento", row.status_recebimento);
      set("m_obs_separacao", row.obs_separacao);
      set("m_conf_expedicao", row.conferente_expedicao);
      set("m_faturado", row.faturado === true ? "true" : row.faturado === false ? "false" : "");
      set("m_data_faturamento", toInputDateTime(row.data_faturamento));
      set("m_romaneio", row.romaneio);
      set("m_retirada_nf", toInputDateTime(row.retirada_nf));
      set("m_caixas_embarcadas", row.caixas_embarcadas);
      set("m_operador", row.operador);
      set("m_mao_obra", row.mao_obra);
      set("m_motorista", row.motorista);
      set("m_telefone_motorista", formatarTelefoneVisual(row.telefone_motorista));
      set("m_placa_cavalo", row.placa_cavalo);
      set("m_placa_carreta", row.placa_carreta);
      set("m_placa_reboque_1", row.placa_reboque_1);
      set("m_placa_reboque_2", row.placa_reboque_2);
      set("m_presente_ausente", row.presente_ausente);
      set("m_chegada_motorista", toInputDateTime(row.chegada_motorista));
      set("m_doca_carregamento", row.doca_carregamento);
      set("m_data_em_doca", toInputDateTime(row.data_em_doca));
      set("m_inicio_carregamento", toInputDateTime(row.inicio_carregamento));
      set("m_fim_carregamento", toInputDateTime(row.fim_carregamento));
      set("m_obs_carregamento", row.obs_carregamento);
      aplicarModoModal();
      document.getElementById("dtModal").classList.add("show");
    }


    function bindTurnoExpedidoAuto(){
      const fimEl = document.getElementById("m_fim_carregamento");
      const turnoEl = document.getElementById("m_turno_expedido");
      const statusEl = document.getElementById("m_status_global");
      if(!fimEl || !turnoEl || !statusEl) return;
      const preencher = () => {
        if(turnoEl.value) return;
        if(fimEl.value){
          const d = new Date(fimEl.value);
          if(!isNaN(d)){
            const hh = String(d.getHours()).padStart(2,'0');
            const mm = String(d.getMinutes()).padStart(2,'0');
            turnoEl.value = definirTurno(`${hh}:${mm}`);
            return;
          }
        }
        if(statusEl.value === "Expedido"){
          const now = new Date();
          const hh = String(now.getHours()).padStart(2,'0');
          const mm = String(now.getMinutes()).padStart(2,'0');
          turnoEl.value = definirTurno(`${hh}:${mm}`);
        }
      };
      if(fimEl.dataset.turnoAutoBound !== '1'){
        fimEl.addEventListener('change', preencher);
        fimEl.addEventListener('input', preencher);
        fimEl.dataset.turnoAutoBound = '1';
      }
      if(statusEl.dataset.turnoAutoBound !== '1'){
        statusEl.addEventListener('change', preencher);
        statusEl.dataset.turnoAutoBound = '1';
      }
      preencher();
    }

    function fecharDTModal(){
      document.getElementById("dtModal").classList.remove("show");
      dtAtual = null;
    }

    async function salvarDTModal(){
      if(!dtAtual) return;
      if(!requirePermission("dt_edit", "Seu perfil está em modo visualização e não pode salvar alterações.")) return;
      const faturadoVal = document.getElementById("m_faturado").value;
      const payload = {
        ordem: document.getElementById("m_ordem").value.trim() || null,
        remessa: document.getElementById("m_remessa").value.trim() || null,
        cliente: document.getElementById("m_cliente").value.trim() || null,
        transportadora: document.getElementById("m_transportadora").value.trim() || null,
        data_agenda: document.getElementById("m_data_agenda").value || null,
        hora_agenda: document.getElementById("m_hora_agenda").value || null,
        TEMPODECARREGAMENTO: document.getElementById("m_tempodecarregamento").value || null,
        "TÉRMINOPREVISTO": document.getElementById("m_terminoprevisto").value || null,
        tipo_carga: document.getElementById("m_tipo_carga").value.trim() || null,
        tipo_veiculo: document.getElementById("m_tipo_veiculo").value.trim() || null,
        tipo_frete: document.getElementById("m_tipo_frete").value.trim() || null,
        perfil_carga: document.getElementById("m_perfil_carga").value.trim() || null,
        doca_agenda: document.getElementById("m_doca_agenda").value || null,
        status_global: document.getElementById("m_status_global").value || null,
        peso: num(document.getElementById("m_peso").value),
        cubagem: num(document.getElementById("m_cubagem").value),
        tonelagem: num(document.getElementById("m_tonelagem").value),
        he: num(document.getElementById("m_he").value),
        ho: num(document.getElementById("m_ho").value),
        total_caixas: num(document.getElementById("m_total_caixas").value),
        observacao_geral: document.getElementById("m_observacao_geral").value.trim() || null,
        doca_planejada: document.getElementById("m_doca_planejada").value || null,
        tipo_separacao: document.getElementById("m_tipo_separacao").value || null,
        inicio_separacao: document.getElementById("m_inicio_separacao").value || null,
        fim_separacao: document.getElementById("m_fim_separacao").value || null,
        status_separacao: document.getElementById("m_status_separacao").value.trim() || null,
        turno_separacao: document.getElementById("m_turno_separacao").value || null,
        inicio_recebimento: document.getElementById("m_inicio_recebimento").value || null,
        fim_recebimento: document.getElementById("m_fim_recebimento").value || null,
        conferente_recebimento: document.getElementById("m_conf_recebimento").value || null,
        status_recebimento: document.getElementById("m_status_recebimento").value.trim() || null,
        obs_separacao: document.getElementById("m_obs_separacao").value.trim() || null,
        conferente_expedicao: document.getElementById("m_conf_expedicao").value || null,
        faturado: faturadoVal === "" ? null : faturadoVal === "true",
        data_faturamento: document.getElementById("m_data_faturamento").value || null,
        romaneio: document.getElementById("m_romaneio").value.trim() || null,
        retirada_nf: document.getElementById("m_retirada_nf").value || null,
        caixas_embarcadas: num(document.getElementById("m_caixas_embarcadas").value),
        operador: document.getElementById("m_operador").value.trim() || null,
        mao_obra: document.getElementById("m_mao_obra").value.trim() || null,
        motorista: document.getElementById("m_motorista").value.trim() || null,
        telefone_motorista: normalizarTelefone(document.getElementById("m_telefone_motorista").value) || null,
        placa_cavalo: document.getElementById("m_placa_cavalo").value.trim() || null,
        placa_carreta: document.getElementById("m_placa_carreta").value.trim() || null,
        placa_reboque_1: document.getElementById("m_placa_reboque_1").value.trim() || null,
        placa_reboque_2: document.getElementById("m_placa_reboque_2").value.trim() || null,
        presente_ausente: document.getElementById("m_presente_ausente").value || null,
        chegada_motorista: document.getElementById("m_chegada_motorista").value || null,
        doca_carregamento: document.getElementById("m_doca_carregamento").value || null,
        data_em_doca: document.getElementById("m_data_em_doca").value || null,
        inicio_carregamento: document.getElementById("m_inicio_carregamento").value || null,
        fim_carregamento: document.getElementById("m_fim_carregamento").value || null,
        obs_carregamento: document.getElementById("m_obs_carregamento").value.trim() || null
      };
      const { error } = await sb.from("agendas").update(payload).eq("id", dtAtual.id);
      if(error){ console.error(error); return alert("Erro ao salvar DT."); }
      registrarLogSistema("salvar_dt", `DT ${dtAtual.dt} atualizada no modal`);
      showToast("DT salva com sucesso");
      fecharDTModal();
      await carregarTudo();
    }

    
    async function parseAgendaExcel(file){
      function limparCabecalho(v){
        return String(v ?? "")
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();
      }

      function get(row, nomes){
        const keys = Object.keys(row || {});
        for(const nome of nomes){
          const alvo = limparCabecalho(nome);

          const exata = keys.find(k => limparCabecalho(k) === alvo);
          if(exata && row[exata] !== undefined && row[exata] !== "") return row[exata];

          const parcial = keys.find(k => limparCabecalho(k).includes(alvo));
          if(parcial && row[parcial] !== undefined && row[parcial] !== "") return row[parcial];
        }
        return null;
      }

      function numPlanilha(v){
        if(v === null || v === undefined || v === "") return null;
        if(typeof v === "number" && Number.isFinite(v)) return v;

        const txt = String(v).trim();
        if(!txt) return null;

        const normalizado = txt.includes(",")
          ? txt.replace(/\./g, "").replace(",", ".")
          : txt;

        const n = Number(normalizado);
        return Number.isFinite(n) ? n : null;
      }

      function intPlanilha(v){
        const n = numPlanilha(v);
        if(n === null) return null;
        return Math.round(n);
      }

      function normalizarDataPlanilha(v){
        if(v === null || v === undefined || v === "") return null;

        if(typeof v === "number"){
          const base = new Date(Date.UTC(1899, 11, 30));
          const data = new Date(base.getTime() + v * 86400000);
          return data.toISOString().slice(0,10);
        }

        const txt = String(v).trim();
        const br = txt.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if(br){
          let [, d, m, y] = br;
          if(y.length === 2) y = "20" + y;
          return `${y.padStart(4,"0")}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
        }

        const iso = txt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if(iso) return txt;

        const d = new Date(txt);
        if(!isNaN(d)) return d.toISOString().slice(0,10);

        return null;
      }

      function normalizarHoraPlanilha(v){
        if(v === null || v === undefined || v === "") return null;

        if(typeof v === "number"){
          const total = Math.round(v * 86400);
          const h = String(Math.floor(total / 3600)).padStart(2, "0");
          const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
          return `${h}:${m}`;
        }

        const txt = String(v).trim();
        const hm = txt.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if(hm){
          const h = hm[1].padStart(2, "0");
          const m = hm[2].padStart(2, "0");
          return `${h}:${m}`;
        }

        return null;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type:"array" });

      let registrosImportacao = [];
      let linhasLidas = 0;

      for(const nomeAba of workbook.SheetNames){
        const sheet = workbook.Sheets[nomeAba];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval:"" });

        for(const row of rows){
          linhasLidas++;

          const dt = String(get(row, [
            "Nº transporte","No transporte","Numero transporte","DT","TRANSPORTE","CARRO"
          ]) || "").trim();

          if(!dt) continue;

          registrosImportacao.push({
            dt,
            ordem: String(get(row, ["Ordem","ORDEM"]) || "").trim() || null,
            remessa: String(get(row, ["Remessa","REMESSA"]) || "").trim() || null,
            data_agenda: normalizarDataPlanilha(get(row, ["Data agenda","DATA AGENDA","DATA"])),
            hora_agenda: normalizarHoraPlanilha(get(row, ["Hora agenda","HORA AGENDA","HORA"])),
            transportadora: String(get(row, ["Nome agente de frete","Transportadora","TRANSPORTADOR","TRANSPORTADORA"]) || "").trim() || null,
            cliente: String(get(row, ["Nome do emissor da ordem","Cliente","CLIENTE"]) || "").trim() || null,
            tipo_carga: String(get(row, ["Tipo de carga","TPCARGA"]) || "").trim() || null,
            tipo_veiculo: String(get(row, ["Tipo de veículo","Tipo de veiculo","TPCARRO","TIPO VEICULO"]) || "").trim() || null,
            tipo_frete: String(get(row, ["Tipo de frete","TPFRETE"]) || "").trim() || null,
            perfil_carga: String(get(row, ["Perfil de carregamento","PERFILCARGA"]) || "").trim() || null,
            doca_agenda: String(get(row, ["Doca agenda","DOCA"]) || "").trim() || null,
            peso: numPlanilha(get(row, ["Peso total","PESO"])),
            cubagem: numPlanilha(get(row, ["Volume","CUBAGEM"])),
            tonelagem: numPlanilha(get(row, ["Tonelagem","TON"])),
            total_caixas: intPlanilha(get(row, ["Qtd.remessa","Qtd remessa","TOTAL","TOTAL CAIXAS"])),
            he: intPlanilha(get(row, ["HE"])),
            ho: intPlanilha(get(row, ["HO","PalletsHO","PALLETSHO"])),
            TEMPODECARREGAMENTO: (() => {
              const v = get(row, ["TEMPODECARREGAMENTO","TEMPO DE CARREGAMENTO","TEMPO CARREGAMENTO"]);
              return v === null || v === undefined || v === "" ? null : String(v).trim();
            })(),
            "TÉRMINOPREVISTO": (() => {
              const v = get(row, ["TÉRMINOPREVISTO","TÉRMINO PREVISTO","TERMINOPREVISTO","TERMINO PREVISTO"]);
              if(v === null || v === undefined || v === "") return null;
              if(typeof v === "number"){
                const base = new Date(Date.UTC(1899, 11, 30));
                const data = new Date(base.getTime() + v * 86400000);
                return data.toISOString().replace("T"," ").slice(0,19);
              }
              const txt = String(v).trim();
              const d = new Date(txt.replace(" ", "T"));
              if(!isNaN(d) && /\d/.test(txt)) return d.toISOString().replace("T"," ").slice(0,19);
              return txt;
            })(),
            status_global: "Agendado"
          });
        }
      }

      const mapa = new Map();
      for(const item of registrosImportacao){
        mapa.set(item.dt, item);
      }

      const registrosUnicos = Array.from(mapa.values()).filter(r => r.dt);

      return {
        totalAbas: workbook.SheetNames.length,
        linhasLidas,
        registrosUnicos
      };
    }

    function renderPreviewImportacao(resultado){
      const box = document.getElementById("previewBox");
      const resumo = document.getElementById("previewResumo");
      const tabela = document.getElementById("previewTabela");

      const rows = resultado.registrosUnicos || [];
      box.style.display = rows.length ? "block" : "none";

      resumo.innerHTML = `
        <div class="kpi"><div class="label">Abas lidas</div><div class="value">${resultado.totalAbas}</div><div class="sub">arquivo Excel</div></div>
        <div class="kpi"><div class="label">Linhas lidas</div><div class="value">${resultado.linhasLidas}</div><div class="sub">todas as abas</div></div>
        <div class="kpi"><div class="label">Registros válidos</div><div class="value">${rows.length}</div><div class="sub">com DT reconhecida</div></div>
        <div class="kpi"><div class="label">Prévia exibida</div><div class="value">${Math.min(rows.length, 20)}</div><div class="sub">primeiras linhas</div></div>
      `;

      tabela.innerHTML = rows.slice(0, 20).map(r => `
        <tr>
          <td>${esc(r.dt)}</td>
          <td>${fmtDate(r.data_agenda)}</td>
          <td>${esc(r.hora_agenda)}</td>
          <td>${esc(r.cliente)}</td>
          <td>${esc(r.transportadora)}</td>
          <td>${esc(r.TEMPODECARREGAMENTO || "-")}</td>
          <td>${esc(formatTerminoPrevistoAgenda(r["TÉRMINOPREVISTO"]))}</td>
          <td>${esc(r.tipo_veiculo)}</td>
          <td>${esc(r.total_caixas)}</td>
          <td>${esc(r.peso)}</td>
        </tr>
      `).join("");
    }

    async function preVisualizarExcel(){
      if(!requirePermission("import_excel", "Apenas admin pode pré-visualizar a agenda.")) return;

      const input = document.getElementById("fileInput");
      const status = document.getElementById("statusUpload");
      if(!input.files?.length) return alert("Selecione um arquivo Excel.");

      status.textContent = "Lendo arquivo para pré-visualização...";

      try{
        const resultado = await parseAgendaExcel(input.files[0]);

        if(!resultado.registrosUnicos.length){
          document.getElementById("previewBox").style.display = "none";
          status.textContent = "Nenhuma linha válida encontrada no arquivo.";
          return alert("Nenhuma linha válida encontrada no Excel.");
        }

        renderPreviewImportacao(resultado);
        status.textContent = `${resultado.registrosUnicos.length} registros prontos para importação.`;
      }catch(err){
        console.error(err);
        status.textContent = "Erro ao ler o arquivo.";
        alert("Erro ao processar o Excel.");
      }
    }

    async function importarExcel(){
      if(!requirePermission("import_excel", "Apenas admin pode importar a agenda.")) return;

      const input = document.getElementById("fileInput");
      const status = document.getElementById("statusUpload");
      if(!input.files?.length) return alert("Selecione um arquivo Excel.");

      status.textContent = "Lendo arquivo...";

      try{
        const resultado = await parseAgendaExcel(input.files[0]);
        const registrosUnicos = resultado.registrosUnicos || [];

        if(!registrosUnicos.length){
          document.getElementById("previewBox").style.display = "none";
          status.textContent = "Nenhuma linha válida encontrada no arquivo.";
          return alert("Nenhuma linha válida encontrada no Excel.");
        }

        renderPreviewImportacao(resultado);
        status.textContent = `Importando ${registrosUnicos.length} registros...`;

        const { error } = await sb.from("agendas").upsert(registrosUnicos, { onConflict:"dt" });
        if(error){
          console.error(error);
          status.textContent = "Erro na importação.";
          return alert("Erro ao importar Excel: " + (error.message || "falha no upsert"));
        }

        status.textContent = `${registrosUnicos.length} registros importados com sucesso.`;
        await carregarTudo();
        showToast("Importação concluída");
      }catch(err){
        console.error(err);
        status.textContent = "Erro ao ler o arquivo.";
        alert("Erro ao processar o Excel.");
      }
    }

    async function salvarMotorista(){
      if(!requirePermission("cadastros_edit", "Seu perfil não pode editar cadastro de motoristas.")) return;
      const payload = {
        nome: document.getElementById("m_nome").value.trim() || null,
        cpf: document.getElementById("m_cpf").value.trim() || null,
        telefone: document.getElementById("m_telefone").value.trim() || null
      };
      if(!payload.nome) return alert("Informe o nome do motorista.");
      const { error } = await sb.from("motoristas").insert([payload]);
      if(error){ console.error(error); return alert("Erro ao salvar motorista."); }
      document.getElementById("m_nome").value = "";
      document.getElementById("m_cpf").value = "";
      document.getElementById("m_telefone").value = "";
      await carregarCadastros();
      showToast("Motorista salvo");
    }

    function carregarMotoristas(){
      document.getElementById("listaMotoristas").innerHTML = (window._motoristas || []).map(m => `<tr><td>${esc(m.nome)}</td><td>${esc(m.cpf)}</td><td>${esc(m.telefone)}</td></tr>`).join("");
    }

    async function salvarTransportadora(){
      if(!requirePermission("cadastros_edit", "Seu perfil não pode editar cadastro de transportadoras.")) return;
      const payload = {
        nome: document.getElementById("t_nome").value.trim() || null,
        cnpj: document.getElementById("t_cnpj").value.trim() || null
      };
      if(!payload.nome) return alert("Informe o nome da transportadora.");
      const { error } = await sb.from("transportadoras").insert([payload]);
      if(error){ console.error(error); return alert("Erro ao salvar transportadora."); }
      document.getElementById("t_nome").value = "";
      document.getElementById("t_cnpj").value = "";
      await carregarCadastros();
      showToast("Transportadora salva");
    }

    function carregarTransportadoras(){
      document.getElementById("listaTransportadoras").innerHTML = (window._transportadoras || []).map(t => `<tr><td>${esc(t.nome)}</td><td>${esc(t.cnpj)}</td></tr>`).join("");
    }

    async function enviarMensagemMotoristaDaFila(id){
      const fila = patioFilaRegistros.find(r => r.id === id || r.agenda_id === id);
      if(!fila) return alert("Registro da fila não encontrado.");
      const telefone = getTelefoneMotorista(fila);
      if(!telefone) return alert("Telefone do motorista não está disponível no registro.");
      try{
        const result = await rpcLinkWhatsappMotoristaFila(
          fila.id,
          `Olá, motorista da DT ${fila.dt || "-"}, favor seguir para a próxima etapa operacional. ${fila.doca_destino ? "Dirija-se para " + fila.doca_destino + "." : ""}`
        );
        if(result?.whatsapp_url){
          window.open(result.whatsapp_url, "_blank");
          registrarLogSistema("mensagem_motorista", `Mensagem enviada para o motorista da DT ${fila.dt || "-"}`);
          return;
        }
      }catch(err){
        console.warn("RPC de WhatsApp indisponível, usando link direto.", err);
      }
      abrirWhatsApp(
        telefone,
        `Olá, motorista da DT ${fila.dt || "-"}, favor seguir para a próxima etapa operacional. ${fila.doca_destino ? "Dirija-se para " + fila.doca_destino + "." : ""}`
      );
      registrarLogSistema("mensagem_motorista", `Mensagem enviada para o motorista da DT ${fila.dt || "-"}`);
    }

    async function enviarMensagemPorAgenda(agendaId){
      const agenda = registros.find(r => r.id === agendaId);
      if(!agenda) return alert("Agenda não encontrada.");
      const fila = patioFilaRegistros.find(r => r.agenda_id === agendaId);
      if(fila) return await enviarMensagemMotoristaDaFila(fila.id);
      const telefone = getTelefoneMotorista(agenda);
      if(!telefone) return alert("Telefone do motorista não está disponível.");
      abrirWhatsApp(
        telefone,
        `Olá, motorista da DT ${agenda.dt || "-"}, favor aguardar ou seguir a orientação operacional recebida.`
      );
      registrarLogSistema("mensagem_motorista", `Mensagem enviada para o motorista da DT ${agenda.dt || "-"}`);
    }

    function filtrarPorKpi(label){
      agendaFiltroKpi = agendaFiltroKpi === label ? "" : label;
      setView('agenda', document.getElementById('menu-agenda'));
      renderAgenda();
      renderDashboard();
    }

    function initDragDrop(){
      const items = document.querySelectorAll("#dashboardBoard .item[draggable='true']");
      const lanes = document.querySelectorAll("#dashboardBoard .lane[data-status]");
      items.forEach(item => {
        item.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", item.dataset.id));
      });
      lanes.forEach(lane => {
        lane.addEventListener("dragover", e => e.preventDefault());
        lane.addEventListener("drop", async e => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          const status = lane.dataset.status;
          if(id && status) await mudarStatus(id, status);
        });
      });
    }

    (function iniciar(){
      const hoje = new Date();
      const p = n => String(n).padStart(2, "0");
      document.getElementById("filtroData").value = `${hoje.getFullYear()}-${p(hoje.getMonth()+1)}-${p(hoje.getDate())}`;
    })();

    async function testarConexao(){
      try{
        const { error } = await sb.from("agendas").select("id").limit(1);
        if(error) throw error;
        const el = document.getElementById("statusConexao");
        el.textContent = "Conectado ao Supabase.";
        el.style.color = "#22c55e";
        const adminStatus = document.getElementById("adminStatusRef");
        if(adminStatus) adminStatus.textContent = "Online";
      }catch(e){
        console.error(e);
        const el = document.getElementById("statusConexao");
        const msg = String(e?.message || "");
        el.textContent = msg.includes("permission denied")
          ? "Conectado ao Supabase, mas sem permissão de leitura. Verifique GRANT e RLS."
          : "Erro de conexão. Verifique URL, key, RLS e estrutura SQL.";
        el.style.color = "#ef4444";
        const adminStatus = document.getElementById("adminStatusRef");
        if(adminStatus) adminStatus.textContent = "Erro";
      }
    }

    
async function login(){
  return window.loginYMS ? window.loginYMS() : null;
}



async function logout(){
  if(realtimeChannel){ try{ await sb.removeChannel(realtimeChannel); }catch(_){} }
  if(window.logoutYMS){
    await window.logoutYMS();
    return;
  }
  await sb.auth.signOut();
  window.location.href = "login.html";
}



async function verificarSessao(){
  const authResult = window.requireAuthYMS
    ? await window.requireAuthYMS()
    : { session: (await sb.auth.getSession()).data.session, profile: null };
  const session = authResult?.session || authResult || null;
  const profile = authResult?.profile || window.YMS_AUTH_PROFILE || null;
  if(session?.user){
    await entrarSistema(session.user, profile);
    return true;
  }
  bloquearSistema();
  return false;
}

async function entrarSistema(user, profile){
  const app = document.getElementById("app");
  if(app) app.classList.remove("hidden");
  const backdrop = document.getElementById("sidebarBackdrop");
  if(backdrop) backdrop.classList.add("hidden");
  await carregarPerfil(user.email, user.id, profile || null);
  await carregarCadastros();
  await carregarTudo();
  setView(viewAtualGlobal);
  await iniciarRealtime();
}

function bloquearSistema(){
  window.location.href = "login.html";
}

sb.auth.onAuthStateChange(async (_, session) => {
  if(!session) bloquearSistema();
});

    async function carregarPerfil(email, userId, profileFromAuth = null){
      let data = null;
      let error = null;

      const preencherPerfilUI = (perfilData) => {
        usuarioPerfil = String(perfilData?.perfil || "operacao").toLowerCase();
        try{
          sessionStorage.setItem("glp_auth_profile_v2", JSON.stringify({
            id: perfilData?.id || userId || null,
            nome: perfilData?.nome || email || "Usuário logado",
            email: perfilData?.email || email || "-",
            perfil: usuarioPerfil,
            ativo: perfilData?.ativo !== false
          }));
        }catch(_){ }
        document.getElementById("userNome").textContent = perfilData?.nome || email || "Usuário logado";
        document.getElementById("userEmail").textContent = perfilData?.email || email || "-";
        document.getElementById("userPerfil").textContent = `Perfil: ${usuarioPerfil}`;
        document.getElementById("areaAdmin").style.display = usuarioPerfil === "admin" ? "grid" : "none";
        aplicarPermissoes();
        if(usuarioPerfil === "admin") carregarUsuariosAdmin();
        atualizarSaudacaoSistema();
        carregarTemperaturaSistema();
      };

      try{
        const cachePerfil = profileFromAuth || window.YMS_AUTH_PROFILE || JSON.parse(sessionStorage.getItem("glp_auth_profile_v2") || "null");
        if(cachePerfil && (cachePerfil.email || cachePerfil.perfil)){
          preencherPerfilUI(cachePerfil);
          return;
        }
      }catch(_){ }

      try{
        const porId = await sb
          .from("usuarios")
          .select("id,nome,email,perfil,ativo")
          .eq("id", userId)
          .maybeSingle();
        if(porId.error) error = porId.error;
        if(porId.data) data = porId.data;

        if(!data){
          const porEmail = await sb
            .from("usuarios")
            .select("id,nome,email,perfil,ativo")
            .eq("email", email)
            .maybeSingle();
          if(porEmail.error) error = porEmail.error;
          if(porEmail.data) data = porEmail.data;
        }
      }catch(err){
        error = err;
      }

      if(error){
        console.error(error);
        usuarioPerfil = null;
        document.getElementById("userNome").textContent = email || "Usuário logado";
        document.getElementById("userEmail").textContent = email || "-";
        document.getElementById("userPerfil").textContent = "Perfil: indisponível";
        document.getElementById("areaAdmin").style.display = "none";
        const menuAdmin = document.getElementById("menu-admin");
        if(menuAdmin) menuAdmin.style.display = "none";
        const status = document.getElementById("statusConexao");
        if(status){
          status.textContent = "Sem permissão para ler o perfil do usuário. Verifique GRANT e RLS da tabela public.usuarios.";
          status.style.color = "#ef4444";
        }
        return;
      }

      if(!data){
        usuarioPerfil = null;
        document.getElementById("userNome").textContent = email || "Usuário logado";
        document.getElementById("userEmail").textContent = email || "-";
        document.getElementById("userPerfil").textContent = "Perfil: sem cadastro";
        document.getElementById("areaAdmin").style.display = "none";
        const menuAdmin = document.getElementById("menu-admin");
        if(menuAdmin) menuAdmin.style.display = "none";
        const status = document.getElementById("statusConexao");
        if(status){
          status.textContent = "Seu usuário não possui perfil cadastrado no sistema.";
          status.style.color = "#ef4444";
        }
        return;
      }

      if(data.ativo !== true){
        usuarioPerfil = null;
        document.getElementById("userNome").textContent = data.nome || email || "Usuário logado";
        document.getElementById("userEmail").textContent = data.email || email || "-";
        document.getElementById("userPerfil").textContent = "Perfil: usuário inativo";
        alert("Seu usuário está inativo. Procure o administrador do sistema.");
        await sb.auth.signOut();
        bloquearSistema();
        return;
      }

      preencherPerfilUI(data);
    }

    function aplicarPermissoes(){
      const perms = getRolePermissions();
      const ocultar = (id, hidden) => {
        const el = document.getElementById(id);
        if(el) el.style.display = hidden ? "none" : "";
      };

      ocultar("menu-admin", !perms.admin);

      // Gestão: visualização total, sem edição/admin.
      // Assistente/Operação/Portaria: mesma lógica operacional.
      const adminArea = document.getElementById("areaAdmin");
      if(adminArea) adminArea.style.display = perms.admin ? "grid" : "none";

      // Cadastro auxiliar fica disponível só para perfis operacionais e admin.
      ["menu-motoristas","menu-transportadoras"].forEach(id => ocultar(id, !perms.cadastros_edit));

      // Relatórios e visualização seguem liberados.
      ocultar("menu-relatorios", !perms.relatorios_view);

      aplicarEstadoPermissoesUI();
    }

    function aplicarEstadoPermissoesUI(){
      const perms = getRolePermissions();
      const toggleDisabled = (selector, disabled) => {
        document.querySelectorAll(selector).forEach(el => {
          el.disabled = disabled;
          el.classList.toggle("is-disabled-by-role", disabled);
        });
      };

      // Agenda
      toggleDisabled('#view-agenda input, #view-agenda select, #view-agenda textarea', !perms.agenda_edit);
      toggleDisabled('#view-agenda .btn', !perms.agenda_edit);
      const agendaBtn = document.querySelector('#view-agenda .btn.btn-success');
      if(agendaBtn) agendaBtn.style.display = perms.agenda_edit ? "" : "none";

      // Pátio
      toggleDisabled('#view-patio input, #view-patio select, #view-patio textarea', !perms.patio_operate);
      document.querySelectorAll('#view-patio .btn').forEach(el => {
        el.disabled = !perms.patio_operate;
      });

      // Check-in
      toggleDisabled('#view-checkin input, #view-checkin select, #view-checkin textarea', !perms.checkin_operate);
      document.querySelectorAll('#view-checkin .btn').forEach(el => {
        el.disabled = !perms.checkin_operate;
      });

      // Cadastros auxiliares
      toggleDisabled('#view-motoristas input, #view-motoristas select, #view-motoristas textarea', !perms.cadastros_edit);
      toggleDisabled('#view-transportadoras input, #view-transportadoras select, #view-transportadoras textarea', !perms.cadastros_edit);
      document.querySelectorAll('#view-motoristas .btn, #view-transportadoras .btn').forEach(el => {
        el.disabled = !perms.cadastros_edit;
      });

      // Admin/importação
      toggleDisabled('#view-admin input, #view-admin select, #view-admin textarea', !perms.admin);
      document.querySelectorAll('#view-admin .btn').forEach(el => {
        el.disabled = !perms.admin;
      });
      const fileInput = document.getElementById("fileInput");
      if(fileInput) fileInput.disabled = !perms.import_excel;

      // Gestão = visualização total, então impede botões inline
      document.querySelectorAll('.mini').forEach(el => {
        if(el.closest('#view-agenda') || el.closest('#view-separacao') || el.closest('#view-expedicao')){
          const isOpen = /Abrir DT/i.test(el.textContent || "");
          el.disabled = perms.read_only ? !isOpen : el.disabled;
        }
      });
    }

    async function carregarCadastros(){
      const [confRes, docaRes, motRes, transRes] = await Promise.all([
        sb.from("conferentes").select("*").eq("ativo", true).order("nome"),
        sb.from("docas").select("*").eq("ativo", true).order("nome"),
        sb.from("motoristas").select("*").order("nome"),
        sb.from("transportadoras").select("*").order("nome")
      ]);

      conferentes = confRes.data || [];
      docas = (docaRes.data || []).slice().sort((a, b) => compararDocas(a?.nome, b?.nome));
      window._motoristas = motRes.data || [];
      window._transportadoras = transRes.data || [];

      ["a_doca_agenda","p_doca","m_doca_agenda","m_doca_planejada","m_doca_carregamento"].forEach(preencherSelectDocas);
      ["m_conf_recebimento","m_conf_expedicao"].forEach(preencherSelectConferentes);
      carregarMotoristas();
      carregarTransportadoras();
    }

    function preencherSelectDocas(id){
      const el = document.getElementById(id);
      if(!el) return;
      const atual = el.value;
      const docasOrdenadas = getDocasOrdenadas();
      el.innerHTML = `<option value="">Selecione</option>` + docasOrdenadas.map(d => {
        const valor = d.nome_original || d.nome;
        const rotulo = d.nome_exibicao || formatarNomeDoca(valor);
        return `<option value="${esc(valor)}">${esc(rotulo)}</option>`;
      }).join("");

      if(atual){
        const atualNormalizado = formatarNomeDoca(atual);
        const optionMatch = [...el.options].find(opt => formatarNomeDoca(opt.value) === atualNormalizado || formatarNomeDoca(opt.textContent) === atualNormalizado);
        if(optionMatch) el.value = optionMatch.value;
      }
    }

    function preencherSelectConferentes(id){
      const el = document.getElementById(id);
      if(!el) return;
      const atual = el.value;
      el.innerHTML = `<option value="">Selecione</option>` + conferentes.map(c => `<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join("");
      if(atual) el.value = atual;
    }

    async function carregarPatioFila(){
      try{
        let query = sb.from("v_patio_fila_operacional").select("*");
        const { data, error } = await query;
        if(error){
          console.warn("Fila do pátio indisponível:", error.message || error);
          patioFilaRegistros = [];
          return;
        }
        patioFilaRegistros = data || [];
      }catch(err){
        console.warn("Falha ao carregar fila do pátio:", err);
        patioFilaRegistros = [];
      }
    }

async function boot(){
      await testarConexao();
      await verificarSessao();
    }

    aplicarMascaraTelefone("p_telefone_motorista");
    aplicarMascaraTelefone("c_telefone_motorista");
    aplicarMascaraTelefone("m_telefone_motorista");
    document.getElementById("sidebarToggle")?.addEventListener("click", () => alternarSidebar());
    document.getElementById("topbarMenuToggle")?.addEventListener("click", () => alternarSidebar());
    document.getElementById("mobileMenuToggle")?.addEventListener("click", () => alternarSidebar(false));
    document.getElementById("sidebarBackdrop")?.addEventListener("click", () => alternarSidebar(true));
    window.addEventListener("resize", atualizarIconesSidebar);
    setInterval(atualizarSaudacaoSistema, 60000);
    atualizarIconesSidebar();
    atualizarSaudacaoSistema();
    carregarTemperaturaSistema();
    syncPassagemMenuState();
    boot();

/* ===== SUPABASE • RESULTADO SEPARAÇÃO + PASSAGEM DE TURNO ===== */
let __resultadoSeparacaoCache = {};
let __resultadoSeparacaoLoadKey = "";
let __resultadoSeparacaoLoading = false;

let __passagemTurnoCache = {};
let __passagemTurnoLoadKey = "";
let __passagemTurnoLoading = false;

function getResultadoSeparacaoSelectedDataRaw(){
  return document.getElementById('resultadoSepData')?.value || dataFiltrada() || '';
}

function getResultadoSeparacaoSelectedTurno(){
  return document.getElementById('resultadoSepTurno')?.value || 'T1';
}

function getResultadoSeparacaoSupabaseKey(){
  return `${getResultadoSeparacaoSelectedDataRaw() || 'todos'}__${getResultadoSeparacaoSelectedTurno() || 'T1'}`;
}

function getPassagemTurnoSupabaseKey(){
  const dataRef = document.getElementById('passagemData')?.value || dataFiltrada() || '';
  const turno = document.getElementById('passagemTurno')?.value || 'T1';
  return `${dataRef || 'todos'}__${turno}`;
}

function normalizeResultadoSeparacaoFromDb(master, detalhes){
  const base = getResultadoSeparacaoDefaults();
  const out = {
    ...base,
    heProdPessoa: Number(master?.he_prod_pessoa ?? base.heProdPessoa) || 0,
    hoProdPessoa: Number(master?.ho_prod_pessoa ?? base.hoProdPessoa) || 0,
    heMeta: Number(master?.he_meta ?? base.heMeta) || 0,
    hoMeta: Number(master?.ho_meta ?? base.hoMeta) || 0,
    he: { T1:{real:0,plan:0}, T2:{real:0,plan:0}, T3:{real:0,plan:0} },
    ho: { T1:{real:0,plan:0}, T2:{real:0,plan:0}, T3:{real:0,plan:0} }
  };
  (detalhes || []).forEach(d => {
    const turno = d.turno || 'T1';
    const tipo = String(d.tipo || '').toUpperCase();
    if(tipo === 'HE'){
      out.he[turno] = {
        real: Number(d.mo_real || 0),
        plan: Number(d.mo_planejada || 0)
      };
    }
    if(tipo === 'HO'){
      out.ho[turno] = {
        real: Number(d.mo_real || 0),
        plan: Number(d.mo_planejada || 0)
      };
    }
  });
  return out;
}

async function loadResultadoSeparacaoFromSupabase(force = false){
  const dataRef = getResultadoSeparacaoSelectedDataRaw();
  const key = getResultadoSeparacaoSupabaseKey();
  if(!force && __resultadoSeparacaoLoadKey === key && __resultadoSeparacaoCache[key]) return __resultadoSeparacaoCache[key];
  if(__resultadoSeparacaoLoading) return __resultadoSeparacaoCache[key] || getResultadoSeparacaoDefaults();
  if(!dataRef) {
    __resultadoSeparacaoLoadKey = key;
    __resultadoSeparacaoCache[key] = getResultadoSeparacaoDefaults();
    return __resultadoSeparacaoCache[key];
  }

  __resultadoSeparacaoLoading = true;
  try{
    const turno = getResultadoSeparacaoSelectedTurno();
    const { data: master, error: e1 } = await sb
      .from('resultado_separacao')
      .select('*')
      .eq('data_referencia', dataRef)
      .eq('turno', turno)
      .maybeSingle();
    if(e1) throw e1;

    let detalhes = [];
    if(master?.id){
      const { data: det, error: e2 } = await sb
        .from('resultado_separacao_detalhes')
        .select('*')
        .eq('resultado_id', master.id);
      if(e2) throw e2;
      detalhes = det || [];
    }

    __resultadoSeparacaoLoadKey = key;
    __resultadoSeparacaoCache[key] = normalizeResultadoSeparacaoFromDb(master, detalhes);
    return __resultadoSeparacaoCache[key];
  }catch(err){
    console.error('Erro ao carregar resultado separação no Supabase', err);
    showToast('Erro ao carregar Resultado Separação');
    return __resultadoSeparacaoCache[key] || getResultadoSeparacaoDefaults();
  }finally{
    __resultadoSeparacaoLoading = false;
  }
}

function getResultadoSeparacaoState(){
  const key = getResultadoSeparacaoSupabaseKey();
  if(__resultadoSeparacaoLoadKey !== key && !__resultadoSeparacaoLoading){
    loadResultadoSeparacaoFromSupabase().then(() => renderResultadoSeparacao());
  }
  return __resultadoSeparacaoCache[key] || getResultadoSeparacaoDefaults();
}

function setResultadoSeparacaoState(state){
  __resultadoSeparacaoLoadKey = getResultadoSeparacaoSupabaseKey();
  __resultadoSeparacaoCache[__resultadoSeparacaoLoadKey] = state;
}

async function salvarResultadoSeparacaoFormulario(){
  const getNum = id => num(document.getElementById(id)?.value) || 0;
  const turno = getResultadoSeparacaoSelectedTurno();
  const dataRef = getResultadoSeparacaoSelectedDataRaw();
  if(!dataRef) return alert('Selecione a data para salvar o Resultado Separação.');

  const state = getResultadoSeparacaoState();
  state.heProdPessoa = getNum('resSepHeProdPessoa');
  state.hoProdPessoa = getNum('resSepHoProdPessoa');
  state.heMeta = getNum('resSepHeMeta');
  state.hoMeta = getNum('resSepHoMeta');
  state.he = state.he || {T1:{real:0,plan:0},T2:{real:0,plan:0},T3:{real:0,plan:0}};
  state.ho = state.ho || {T1:{real:0,plan:0},T2:{real:0,plan:0},T3:{real:0,plan:0}};
  state.he[turno] = { real:getNum('resSepHeTurnoReal'), plan:getNum('resSepHeTurnoPlan') };
  state.ho[turno] = { real:getNum('resSepHoTurnoReal'), plan:getNum('resSepHoTurnoPlan') };

  try{
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id || null;

    const payload = {
      data_referencia: dataRef,
      turno,
      he_prod_pessoa: state.heProdPessoa,
      ho_prod_pessoa: state.hoProdPessoa,
      he_meta: state.heMeta,
      ho_meta: state.hoMeta,
      criado_por: userId
    };

    const { data: master, error: e1 } = await sb
      .from('resultado_separacao')
      .upsert(payload, { onConflict: 'data_referencia,turno' })
      .select()
      .single();
    if(e1) throw e1;

    const detalhes = [
      {
        resultado_id: master.id,
        turno,
        tipo: 'HE',
        mo_real: state.he[turno].real || 0,
        mo_planejada: state.he[turno].plan || 0
      },
      {
        resultado_id: master.id,
        turno,
        tipo: 'HO',
        mo_real: state.ho[turno].real || 0,
        mo_planejada: state.ho[turno].plan || 0
      }
    ];

    const { error: e2 } = await sb
      .from('resultado_separacao_detalhes')
      .upsert(detalhes, { onConflict: 'resultado_id,tipo' });
    if(e2) throw e2;

    setResultadoSeparacaoState(state);
    showToast(`Resultado da separação salvo no Supabase para ${turno}`);
    await loadResultadoSeparacaoFromSupabase(true);
    renderResultadoSeparacao();
  }catch(err){
    console.error('Erro ao salvar resultado separação no Supabase', err);
    alert('Erro ao salvar Resultado Separação no Supabase.');
  }
}

function carregarResultadoSeparacaoFormulario(){
  loadResultadoSeparacaoFromSupabase(true).then(() => {
    preencherResultadoSeparacaoFormulario(getResultadoSeparacaoState());
    renderResultadoSeparacao();
  });
}

function getPassagemTurnoState(){
  const key = getPassagemTurnoSupabaseKey();
  if(__passagemTurnoLoadKey !== key && !__passagemTurnoLoading){
    loadPassagemTurnoFromSupabase().then(() => renderPassagemTurno());
  }
  return __passagemTurnoCache[key] || getPassagemTurnoDefaults();
}

function savePassagemTurnoState(state){
  const key = getPassagemTurnoSupabaseKey();
  __passagemTurnoLoadKey = key;
  __passagemTurnoCache[key] = state;
}

function normalizePassagemTurnoFromDb(master, indicadores, areas){
  const base = getPassagemTurnoDefaults();
  const out = {
    ...base,
    responsavel: master?.responsavel_nome || '',
    operador: Number(master?.operadores || 0),
    conferente: Number(master?.conferentes || 0),
    exclusiva: Number(master?.exclusiva || 0),
    recebidoPor: master?.recebido_por || '',
    horario: master?.horario_passagem || '',
    ocorrencias: master?.ocorrencias || '',
    ferias: { operador:0, conferente:0, exclusiva:0 },
    ausencias: { operador:0, conferente:0, exclusiva:0 },
    bancoHoras: { operador:0, conferente:0, exclusiva:0 },
    areas: Object.fromEntries(PASSAGEM_AREAS.map(a => [a,{mo:0, horas:0}]))
  };
  (indicadores || []).forEach(item => {
    const grupoMap = { FERIAS:'ferias', AUSENCIAS:'ausencias', BANCO_HORAS:'bancoHoras' };
    const categoriaMap = { OPERADOR:'operador', CONFERENTE:'conferente', EXCLUSIVA:'exclusiva' };
    const g = grupoMap[item.grupo];
    const c = categoriaMap[item.categoria];
    if(g && c) out[g][c] = Number(item.valor || 0);
  });
  (areas || []).forEach(item => {
    if(out.areas[item.area_nome]){
      out.areas[item.area_nome] = { mo:Number(item.mo || 0), horas:Number(item.horas || 0) };
    }
  });
  return out;
}

async function loadPassagemTurnoFromSupabase(force = false){
  const dataRef = document.getElementById('passagemData')?.value || dataFiltrada() || '';
  const turno = document.getElementById('passagemTurno')?.value || 'T1';
  const key = `${dataRef || 'todos'}__${turno}`;
  if(!force && __passagemTurnoLoadKey === key && __passagemTurnoCache[key]) return __passagemTurnoCache[key];
  if(__passagemTurnoLoading) return __passagemTurnoCache[key] || getPassagemTurnoDefaults();
  if(!dataRef){
    __passagemTurnoLoadKey = key;
    __passagemTurnoCache[key] = getPassagemTurnoDefaults();
    return __passagemTurnoCache[key];
  }

  __passagemTurnoLoading = true;
  try{
    const { data: master, error: e1 } = await sb
      .from('passagem_turno')
      .select('*')
      .eq('data_referencia', dataRef)
      .eq('turno', turno)
      .eq('setor', 'Expedição')
      .maybeSingle();
    if(e1) throw e1;

    let indicadores = [];
    let areas = [];
    if(master?.id){
      const [{ data: inds, error: e2 }, { data: ars, error: e3 }] = await Promise.all([
        sb.from('passagem_turno_indicadores').select('*').eq('passagem_id', master.id),
        sb.from('passagem_turno_areas').select('*').eq('passagem_id', master.id)
      ]);
      if(e2) throw e2;
      if(e3) throw e3;
      indicadores = inds || [];
      areas = ars || [];
    }

    __passagemTurnoLoadKey = key;
    __passagemTurnoCache[key] = normalizePassagemTurnoFromDb(master, indicadores, areas);
    return __passagemTurnoCache[key];
  }catch(err){
    console.error('Erro ao carregar passagem de turno no Supabase', err);
    showToast('Erro ao carregar Passagem de Turno');
    return __passagemTurnoCache[key] || getPassagemTurnoDefaults();
  }finally{
    __passagemTurnoLoading = false;
  }
}

async function salvarPassagemTurno(){
  const state = collectPassagemTurnoState();
  const dataRef = document.getElementById('passagemData')?.value || dataFiltrada() || '';
  const turno = document.getElementById('passagemTurno')?.value || 'T1';
  if(!dataRef) return alert('Selecione a data para salvar a Passagem de Turno.');

  try{
    clearTimeout(__passagemSaveUiTimer);
    setPassagemSaveButtonsState('saving');
    atualizarStatusPassagem('saving');

    const rows = getAgendaRows().filter(r => !dataRef || r.data_agenda === dataRef);
    const programado = rows.filter(r => definirTurno(r.hora_agenda) === turno);
    const realizado = rows.filter(r => r.status_global === 'Expedido');
    const vira = programado.filter(r => r.status_global !== 'Expedido' && ['Em Doca','Em Carregamento','No Pátio','Pronto Expedição','Separado'].includes(r.status_global));
    const atrasado = programado.filter(r => calcSla(r).label === 'Atrasado');

    const tons = arr => arr.reduce((a,b)=>a+getTonelagemPassagem(b),0);

    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id || null;

    const payload = {
      data_referencia: dataRef,
      turno,
      setor: 'Expedição',
      responsavel_nome: state.responsavel || null,
      recebido_por: state.recebidoPor || null,
      horario_passagem: state.horario || null,
      operadores: state.operador || 0,
      conferentes: state.conferente || 0,
      exclusiva: state.exclusiva || 0,
      total_quadro: (state.operador || 0) + (state.conferente || 0) + (state.exclusiva || 0),
      programado_carros: programado.length,
      programado_tons: tons(programado),
      realizado_carros: realizado.length,
      realizado_tons: tons(realizado),
      vira_carros: vira.length,
      vira_tons: tons(vira),
      atrasado_carros: atrasado.length,
      atrasado_tons: tons(atrasado),
      ocorrencias: state.ocorrencias || null,
      criado_por: userId
    };

    const { data: master, error: e1 } = await sb
      .from('passagem_turno')
      .upsert(payload, { onConflict: 'data_referencia,turno,setor' })
      .select()
      .single();
    if(e1) throw e1;

    const indicadores = [
      ['FERIAS','OPERADOR', state.ferias.operador],
      ['FERIAS','CONFERENTE', state.ferias.conferente],
      ['FERIAS','EXCLUSIVA', state.ferias.exclusiva],
      ['AUSENCIAS','OPERADOR', state.ausencias.operador],
      ['AUSENCIAS','CONFERENTE', state.ausencias.conferente],
      ['AUSENCIAS','EXCLUSIVA', state.ausencias.exclusiva],
      ['BANCO_HORAS','OPERADOR', state.bancoHoras.operador],
      ['BANCO_HORAS','CONFERENTE', state.bancoHoras.conferente],
      ['BANCO_HORAS','EXCLUSIVA', state.bancoHoras.exclusiva]
    ].map(([grupo,categoria,valor]) => ({ passagem_id: master.id, grupo, categoria, valor }));

    const areas = PASSAGEM_AREAS.map(area => ({
      passagem_id: master.id,
      area_nome: area,
      mo: Number(state.areas?.[area]?.mo || 0),
      horas: Number(state.areas?.[area]?.horas || 0)
    }));

    const { error: e2 } = await sb
      .from('passagem_turno_indicadores')
      .upsert(indicadores, { onConflict: 'passagem_id,grupo,categoria' });
    if(e2) throw e2;

    const { error: e3 } = await sb
      .from('passagem_turno_areas')
      .upsert(areas, { onConflict: 'passagem_id,area_nome' });
    if(e3) throw e3;

    savePassagemTurnoState(state);
    await loadPassagemTurnoFromSupabase(true);
    renderPassagemTurno();

    const salvoEm = formatarDataHoraStatusPassagem();
    atualizarStatusPassagem('saved', salvoEm);
    setPassagemSaveButtonsState('saved');
    showToast('Passagem de turno salva com sucesso');

    __passagemSaveUiTimer = setTimeout(() => {
      setPassagemSaveButtonsState('idle');
    }, 1800);
  }catch(err){
    console.error('Erro ao salvar passagem de turno no Supabase', err);
    setPassagemSaveButtonsState('idle');
    markPassagemAsDirty();
    alert('Erro ao salvar Passagem de Turno no Supabase.');
  }
}

function renderPassagemTurno(){
  const section = document.getElementById('view-passagem-turno');
  if(!section) return;
  const dtInput = document.getElementById('passagemData');
  if(dtInput && !dtInput.dataset.userLocked && dataFiltrada()) dtInput.value = dataFiltrada();
  const dataRefRaw = dtInput?.value || dataFiltrada() || '';
  const turnoEl = document.getElementById('passagemTurno');
  const turno = turnoEl?.value || 'T1';

  const key = getPassagemTurnoSupabaseKey();
  if(__passagemTurnoLoadKey !== key && !__passagemTurnoLoading){
    loadPassagemTurnoFromSupabase().then(() => renderPassagemTurno());
  }

  const state = getPassagemTurnoState();
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? ''; };
  setVal('passagemResponsavel', state.responsavel);
  setVal('passagemOperador', state.operador);
  setVal('passagemConferente', state.conferente);
  setVal('passagemExclusiva', state.exclusiva);
  setVal('passagemRecebidoPor', state.recebidoPor);
  setVal('passagemHorario', state.horario);
  setVal('passagemOcorrencias', state.ocorrencias);

  ['ferias','ausencias','bancoHoras'].forEach(prefix => {
    const box = document.querySelector(`#graficoPassagem${prefix === 'bancoHoras' ? 'BancoHoras' : prefix.charAt(0).toUpperCase()+prefix.slice(1)}`)?.closest('.card');
    if(box){
      let holder = box.querySelector('.passagem-mini-inputs-v2, .passagem-mini-inputs');
      if(!holder){
        holder = document.createElement('div');
        holder.className = 'passagem-mini-inputs';
        holder.style.display = 'grid';
        holder.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr))';
        holder.style.gap = '8px';
        holder.style.marginTop = '12px';
        box.appendChild(holder);
      }
      holder.innerHTML = renderMiniPassagemInputs(`passagem${prefix.charAt(0).toUpperCase()+prefix.slice(1)}`, state[prefix]);
    }
  });
  renderPassagemAreas(state);
  bindPassagemLiveInputs();

  const rows = getAgendaRows().filter(r => !dataRefRaw || r.data_agenda === dataRefRaw);
  const programado = rows.filter(r => definirTurno(r.hora_agenda) === turno);
  const realizado = rows.filter(r => r.status_global === 'Expedido');
  const vira = programado.filter(r => r.status_global !== 'Expedido' && ['Em Doca','Em Carregamento','No Pátio','Pronto Expedição','Separado'].includes(r.status_global));
  const atrasado = programado.filter(r => calcSla(r).label === 'Atrasado');
  const setKpiText = (ids,val)=>{ (Array.isArray(ids)?ids:[ids]).forEach(id => { const el=document.getElementById(id); if(el) el.textContent = val; }); };
  const tons = arr => arr.reduce((a,b)=>a+getTonelagemPassagem(b),0);
  const kpi = (arr, tonsIds, carrosIds) => { setKpiText(carrosIds, arr.length); setKpiText(tonsIds, formatPassagemTonelagem(tons(arr))); };
  kpi(programado, ['passagemProgramadoTons','passagemProgTons'], ['passagemProgramadoCarros','passagemProgCarros']);
  kpi(realizado, ['passagemRealizadoTons','passagemRealTons'], ['passagemRealizadoCarros','passagemRealCarros']);
  kpi(vira, 'passagemViraTons', 'passagemViraCarros');
  kpi(atrasado, 'passagemAtrasadoTons', 'passagemAtrasadoCarros');

  const totalQuadro = (Number(state.operador)||0) + (Number(state.conferente)||0) + (Number(state.exclusiva)||0);
  const setText2 = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
  setText2('passagemTurnoRef', turno);
  setText2('passagemTotalQuadroRef', totalQuadro);
  const donutCtx = document.getElementById('graficoPassagemQuadro');
  if(donutCtx){
    try{ window.chartPassagemQuadro?.destroy(); }catch(_){}
    window.chartPassagemQuadro = new Chart(donutCtx, {
      type:'doughnut',
      data:{ labels:['Operador','Conferente','Exclusiva'], datasets:[{ data:[state.operador||0,state.conferente||0,state.exclusiva||0], backgroundColor:['rgba(34,211,238,.92)','rgba(59,130,246,.92)','rgba(245,158,11,.92)'], borderColor:'rgba(10,13,18,.94)', borderWidth:3, hoverOffset:4 }]},
      options: mergeChartOptions(getPremiumChartOptions(), { cutout:'68%', layout:{ padding:{ top:8, right:12, bottom:8, left:12 } }, plugins:{ legend:{ position:'top' }, passagemDonutLabels:{ totalLabel:'Total' } } })
    });
  }
  const miniChart = (id, vals) => {
    const el = document.getElementById(id); if(!el) return;
    try{
      const ref = window[`chart_${id}`];
      if(ref) ref.destroy();
    }catch(_){}
    window[`chart_${id}`] = new Chart(el, {
      type:'bar',
      data:{ labels:['Operador','Conferente','Exclusiva'], datasets:[{ data:vals, borderRadius:10, backgroundColor:['rgba(34,211,238,.92)','rgba(59,130,246,.92)','rgba(245,158,11,.92)'] }]},
      options: mergeChartOptions(getPremiumChartOptions(), {
        plugins:{ legend:{ display:false } },
        maintainAspectRatio:false,
        scales:{ y:{ beginAtZero:true, ticks:{ precision:0, stepSize:1 } } }
      })
    });
  };
  miniChart('graficoPassagemFerias', [state.ferias.operador||0,state.ferias.conferente||0,state.ferias.exclusiva||0]);
  miniChart('graficoPassagemAusencias', [state.ausencias.operador||0,state.ausencias.conferente||0,state.ausencias.exclusiva||0]);
  miniChart('graficoPassagemBancoHoras', [state.bancoHoras.operador||0,state.bancoHoras.conferente||0,state.bancoHoras.exclusiva||0]);
  const totalRef = document.getElementById('passagemTotalQuadro');
  if(totalRef) totalRef.textContent = totalQuadro;
}

// Recarregar dados do Supabase ao trocar filtros
document.getElementById('resultadoSepData')?.addEventListener('change', () => loadResultadoSeparacaoFromSupabase(true).then(renderResultadoSeparacao));
document.getElementById('resultadoSepTurno')?.addEventListener('change', () => loadResultadoSeparacaoFromSupabase(true).then(renderResultadoSeparacao));
document.getElementById('passagemData')?.addEventListener('change', () => loadPassagemTurnoFromSupabase(true).then(renderPassagemTurno));
document.getElementById('passagemTurno')?.addEventListener('change', () => loadPassagemTurnoFromSupabase(true).then(renderPassagemTurno));


/* ===== RESULTADO SEPARAÇÃO • OVERRIDES PREMIUM ===== */
function getResultadoSeparacaoDefaults(){
  const turnos = ['T1','T2','T3'];
  return {
    heTurnos: Object.fromEntries(turnos.map(t => [t, { fixa:0, avaria:0, exclusiva:0, linha:0 }])),
    hoTurnos: Object.fromEntries(turnos.map(t => [t, { fixa:0, disp:0 }])),
    lastUpdatedAt: ''
  };
}

function normalizeResultadoSeparacaoFromDb(master, detalhes){
  const base = getResultadoSeparacaoDefaults();
  let fromLocal = {};
  try{
    fromLocal = JSON.parse(localStorage.getItem(getResultadoSeparacaoSupabaseKey()) || 'null') || {};
  }catch(_){}
  return { ...base, ...fromLocal };
}

function preencherResultadoSeparacaoFormulario(state){
  const turnos = ['T1','T2','T3'];
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? 0; };
  turnos.forEach(turno => {
    const he = state.heTurnos?.[turno] || { fixa:0, avaria:0, exclusiva:0, linha:0 };
    const ho = state.hoTurnos?.[turno] || { fixa:0, disp:0 };
    setVal(`resSepHe${turno}FixaQtd`, he.fixa);
    setVal(`resSepHe${turno}AvariaQtd`, he.avaria);
    setVal(`resSepHe${turno}ExclusivaQtd`, he.exclusiva);
    setVal(`resSepHe${turno}LinhaQtd`, he.linha);
    setVal(`resSepHo${turno}FixaQtd`, ho.fixa);
    setVal(`resSepHo${turno}DispQtd`, ho.disp);
  });
}

async function salvarResultadoSeparacaoFormulario(){
  const getNum = id => num(document.getElementById(id)?.value) || 0;
  const turnos = ['T1','T2','T3'];
  const dataRef = getResultadoSeparacaoSelectedDataRaw();
  if(!dataRef) return alert('Selecione a data para salvar o Resultado Separação.');

  const state = getResultadoSeparacaoState();
  state.heTurnos = state.heTurnos || {};
  state.hoTurnos = state.hoTurnos || {};

  turnos.forEach(turno => {
    state.heTurnos[turno] = {
      fixa: getNum(`resSepHe${turno}FixaQtd`),
      avaria: getNum(`resSepHe${turno}AvariaQtd`),
      exclusiva: getNum(`resSepHe${turno}ExclusivaQtd`),
      linha: getNum(`resSepHe${turno}LinhaQtd`)
    };
    state.hoTurnos[turno] = {
      fixa: getNum(`resSepHo${turno}FixaQtd`),
      disp: getNum(`resSepHo${turno}DispQtd`)
    };
  });
  state.lastUpdatedAt = new Date().toISOString();
  setResultadoSeparacaoState(state);
  try{
    localStorage.setItem(getResultadoSeparacaoSupabaseKey(), JSON.stringify(state));
  }catch(_){}

  try{
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id || null;
    const calcCapHe = cfg => (Number(cfg?.fixa||0)*1000) + (Number(cfg?.avaria||0)*800) + (Number(cfg?.exclusiva||0)*1000) + (Number(cfg?.linha||0)*1000);
    const calcCapHo = cfg => (Number(cfg?.fixa||0) + Number(cfg?.disp||0)) * 120;

    for (const turno of turnos){
      const payload = {
        data_referencia: dataRef,
        turno,
        he_prod_pessoa: 0,
        ho_prod_pessoa: 0,
        he_meta: calcCapHe(state.heTurnos[turno]),
        ho_meta: calcCapHo(state.hoTurnos[turno]),
        criado_por: userId
      };
      const { data: master, error: e1 } = await sb.from('resultado_separacao').upsert(payload, { onConflict: 'data_referencia,turno' }).select().single();
      if(e1) throw e1;

      const heTotal = Number(state.heTurnos[turno]?.fixa || 0) + Number(state.heTurnos[turno]?.avaria || 0) + Number(state.heTurnos[turno]?.exclusiva || 0) + Number(state.heTurnos[turno]?.linha || 0);
      const hoTotal = Number(state.hoTurnos[turno]?.fixa || 0) + Number(state.hoTurnos[turno]?.disp || 0);

      const detalhes = [
        { resultado_id: master.id, turno, tipo: 'HE', mo_real: heTotal, mo_planejada: heTotal },
        { resultado_id: master.id, turno, tipo: 'HO', mo_real: hoTotal, mo_planejada: hoTotal }
      ];
      const { error: e2 } = await sb.from('resultado_separacao_detalhes').upsert(detalhes, { onConflict: 'resultado_id,tipo' });
      if(e2) throw e2;
    }
    showToast('Configuração da separação salva com sucesso');
    await loadResultadoSeparacaoFromSupabase(true);
  }catch(err){
    console.error('Erro ao salvar resultado separação no Supabase', err);
    showToast('Configuração salva localmente. Falhou no Supabase.');
  }
  renderResultadoSeparacao();
}

function carregarResultadoSeparacaoFormulario(){
  const filtro = document.getElementById('resultadoSepData');
  if(filtro && !filtro.value && dataFiltrada()) filtro.value = dataFiltrada();
  loadResultadoSeparacaoFromSupabase(true).then(() => {
    preencherResultadoSeparacaoFormulario(getResultadoSeparacaoState());
    renderResultadoSeparacao();
  });
}

function renderResultadoSeparacao(){
  const section = document.getElementById('view-resultado-separacao');
  if(!section) return;
  const turnos = ['T1','T2','T3'];
  const dataRaw = getResultadoSeparacaoSelectedDataRaw();
  const filtroDataEl = document.getElementById('resultadoSepData');
  if(filtroDataEl && dataRaw && filtroDataEl.value !== dataRaw) filtroDataEl.value = dataRaw;

  const rowsBase = getAgendaRows();
  const rows = dataRaw ? rowsBase.filter(r => r.data_agenda === dataRaw) : rowsBase;
  const state = getResultadoSeparacaoState();
  preencherResultadoSeparacaoFormulario(state);

  const rowsPorTurno = t => rows.filter(r => (r.turno_separacao || definirTurno(r.hora_agenda)) === t);
  const statusSeparados = ['Separado','Pronto Expedição','No Pátio','Em Doca','Em Carregamento','Expedido'];

  const planejadoHeT = Object.fromEntries(turnos.map(t => [t, rowsPorTurno(t).reduce((a,b)=>a+(Number(b.he)||0),0)]));
  const planejadoHoT = Object.fromEntries(turnos.map(t => [t, rowsPorTurno(t).reduce((a,b)=>a+(Number(b.ho)||0),0)]));
  const realizadoHeT = Object.fromEntries(turnos.map(t => [t, rowsPorTurno(t).filter(r => statusSeparados.includes(r.status_global)).reduce((a,b)=>a+(Number(b.he)||0),0)]));
  const realizadoHoT = Object.fromEntries(turnos.map(t => [t, rowsPorTurno(t).filter(r => statusSeparados.includes(r.status_global)).reduce((a,b)=>a+(Number(b.ho)||0),0)]));

  const calcCapHe = cfg => (Number(cfg?.fixa||0)*1000) + (Number(cfg?.avaria||0)*800) + (Number(cfg?.exclusiva||0)*1000) + (Number(cfg?.linha||0)*1000);
  const calcCapHo = cfg => (Number(cfg?.fixa||0) + Number(cfg?.disp||0)) * 120;
  const calcTotHe = cfg => Number(cfg?.fixa||0) + Number(cfg?.avaria||0) + Number(cfg?.exclusiva||0) + Number(cfg?.linha||0);
  const calcTotHo = cfg => Number(cfg?.fixa||0) + Number(cfg?.disp||0);

  const capHeT = Object.fromEntries(turnos.map(t => [t, calcCapHe(state.heTurnos?.[t] || {})]));
  const capHoT = Object.fromEntries(turnos.map(t => [t, calcCapHo(state.hoTurnos?.[t] || {})]));
  const totalHeT = Object.fromEntries(turnos.map(t => [t, calcTotHe(state.heTurnos?.[t] || {})]));
  const totalHoT = Object.fromEntries(turnos.map(t => [t, calcTotHo(state.hoTurnos?.[t] || {})]));
  const efHeT = Object.fromEntries(turnos.map(t => [t, capHeT[t] ? Math.round((realizadoHeT[t] / capHeT[t]) * 100) : 0]));
  const efHoT = Object.fromEntries(turnos.map(t => [t, capHoT[t] ? Math.round((realizadoHoT[t] / capHoT[t]) * 100) : 0]));

  const planejadoHe = turnos.reduce((a,t)=>a+planejadoHeT[t],0);
  const planejadoHo = turnos.reduce((a,t)=>a+planejadoHoT[t],0);
  const realizadoHe = turnos.reduce((a,t)=>a+realizadoHeT[t],0);
  const realizadoHo = turnos.reduce((a,t)=>a+realizadoHoT[t],0);
  const pendHe = Math.max(planejadoHe - realizadoHe, 0);
  const pendHo = Math.max(planejadoHo - realizadoHo, 0);

  const setText = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
  setText('resultadoSepDataRef', dataRaw ? fmtDate(dataRaw) : 'Todos');
  const capHeGeral = turnos.reduce((a,t)=>a+capHeT[t],0);
  const capHoGeral = turnos.reduce((a,t)=>a+capHoT[t],0);
  setText('resultadoSepEfHeRef', `${capHeGeral ? Math.round((realizadoHe / capHeGeral) * 100) : 0}%`);
  setText('resultadoSepEfHoRef', `${capHoGeral ? Math.round((realizadoHo / capHoGeral) * 100) : 0}%`);
  setText('resSepProgramadoHe', planejadoHe.toLocaleString('pt-BR'));
  setText('resSepProgramadoHo', planejadoHo.toLocaleString('pt-BR'));
  setText('resSepRealizadoHe', realizadoHe.toLocaleString('pt-BR'));
  setText('resSepRealizadoHo', realizadoHo.toLocaleString('pt-BR'));
  setText('resSepPendenteHe', pendHe.toLocaleString('pt-BR'));
  setText('resSepPendenteHo', pendHo.toLocaleString('pt-BR'));

  turnos.forEach(t => {
    setText(`resSepHe${t}TotalMo`, totalHeT[t]);
    setText(`resSepHe${t}Capacidade`, capHeT[t].toLocaleString('pt-BR'));
    setText(`resSepHe${t}Realizado`, realizadoHeT[t].toLocaleString('pt-BR'));
    setText(`resSepHe${t}Eficiencia`, `${efHeT[t]}%`);
    setText(`resSepHo${t}TotalMo`, totalHoT[t]);
    setText(`resSepHo${t}Capacidade`, capHoT[t].toLocaleString('pt-BR'));
    setText(`resSepHo${t}Realizado`, realizadoHoT[t].toLocaleString('pt-BR'));
    setText(`resSepHo${t}Eficiencia`, `${efHoT[t]}%`);
  });

  const renderSummary = (id, tipo, realizadoT, capT, totalT, eficienciaT) => {
    const wrap = document.getElementById(id);
    if(!wrap) return;
    const tituloRealizado = tipo === 'HE' ? 'Realizado HE' : 'Realizado HO';
    const totalMo = turnos.reduce((a,t)=>a+totalT[t],0);
    const capacidade = turnos.reduce((a,t)=>a+capT[t],0);
    const realizado = turnos.reduce((a,t)=>a+realizadoT[t],0);
    const eficiencia = capacidade ? Math.round((realizado / capacidade) * 100) : 0;
    const melhorTurno = turnos.slice().sort((a,b)=>eficienciaT[b]-eficienciaT[a])[0] || 'T1';
    wrap.innerHTML = `
      <div class="resultado-summary-card">
        <span>Total M.O</span>
        <strong>${esc(totalMo)}</strong>
        <small>Somando T1, T2 e T3</small>
      </div>
      <div class="resultado-summary-card capacidade">
        <span>Capacidade</span>
        <strong>${esc(capacidade.toLocaleString('pt-BR'))}</strong>
        <small>Calculada pela configuração</small>
      </div>
      <div class="resultado-summary-card realizado">
        <span>${esc(tituloRealizado)}</span>
        <strong>${esc(realizado.toLocaleString('pt-BR'))}</strong>
        <small>Integrado com a agenda</small>
      </div>
      <div class="resultado-summary-card eficiencia">
        <span>Eficiência</span>
        <strong>${esc(eficiencia)}%</strong>
        <small>Melhor turno: ${esc(melhorTurno)}</small>
      </div>
    `;
  };
  renderSummary('resultadoSepTabelaHE', 'HE', realizadoHeT, capHeT, totalHeT, efHeT);
  renderSummary('resultadoSepTabelaHO', 'HO', realizadoHoT, capHoT, totalHoT, efHoT);

  if(chartResultadoSepHE) chartResultadoSepHE.destroy();
  if(chartResultadoSepHO) chartResultadoSepHO.destroy();

  const chartBaseOpts = mergeChartOptions(getPremiumChartOptions(), {
    plugins:{ legend:{ labels:{ color:'#f8fafc' } } },
    scales:{
      x:{ ticks:{ color:'#d8e5ff', font:{ weight:'700', size:12 } } },
      y:{ beginAtZero:true, ticks:{ color:'#9fb0ca' } }
    }
  });

  chartResultadoSepHE = new Chart(document.getElementById('graficoResultadoSepHE'), {
    type:'bar',
    data:{
      labels: turnos,
      datasets:[
        { label:'Realizado', data: turnos.map(t => realizadoHeT[t]), backgroundColor:'rgba(34,211,238,.92)', borderRadius:10, borderSkipped:false, maxBarThickness:56 },
        { type:'line', label:'Capacidade', data: turnos.map(t => capHeT[t]), borderColor:'rgba(251,146,60,1)', pointBackgroundColor:'rgba(251,146,60,1)', pointRadius:4, tension:.25 }
      ]
    },
    options: chartBaseOpts
  });

  chartResultadoSepHO = new Chart(document.getElementById('graficoResultadoSepHO'), {
    type:'bar',
    data:{
      labels: turnos,
      datasets:[
        { label:'Realizado', data: turnos.map(t => realizadoHoT[t]), backgroundColor:'rgba(34,211,238,.92)', borderRadius:10, borderSkipped:false, maxBarThickness:56 },
        { type:'line', label:'Capacidade', data: turnos.map(t => capHoT[t]), borderColor:'rgba(251,146,60,1)', pointBackgroundColor:'rgba(251,146,60,1)', pointRadius:4, tension:.25 }
      ]
    },
    options: chartBaseOpts
  });
}



let __passagemStatusState = 'idle';
let __passagemStatusLastSavedAt = '';

function formatarDataHoraStatusPassagem(date = new Date()){
  const dd = String(date.getDate()).padStart(2,'0');
  const mm = String(date.getMonth()+1).padStart(2,'0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2,'0');
  const mi = String(date.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function atualizarStatusPassagem(estado = 'idle', salvoEm = ''){
  __passagemStatusState = estado;
  if(salvoEm) __passagemStatusLastSavedAt = salvoEm;
  const bar = document.getElementById('passagemStatusBar');
  const texto = document.getElementById('passagemStatusTexto');
  const detalhe = document.getElementById('passagemStatusRascunho');
  if(!bar || !texto || !detalhe) return;
  bar.classList.remove('is-idle','is-saved','is-dirty');

  if(estado === 'saved'){
    bar.classList.add('is-saved');
    texto.textContent = '✓ Dados salvos com sucesso';
    detalhe.textContent = `Último salvamento às ${salvoEm || __passagemStatusLastSavedAt || formatarDataHoraStatusPassagem()}`;
    return;
  }

  if(estado === 'saving'){
    bar.classList.add('is-idle');
    texto.textContent = '◌ Salvando passagem de turno';
    detalhe.textContent = 'Enviando dados para o Supabase...';
    return;
  }

  if(estado === 'dirty'){
    bar.classList.add('is-dirty');
    texto.textContent = '• Alterações não salvas';
    detalhe.textContent = __passagemStatusLastSavedAt
      ? `Houve mudanças após o salvamento de ${__passagemStatusLastSavedAt}`
      : 'Preencha e salve a passagem de turno';
    return;
  }

  bar.classList.add('is-idle');
  texto.textContent = '• Alterações pendentes';
  detalhe.textContent = 'Preencha e salve a passagem de turno';
}

async function capturarPassagemTurnoImagem(){
  const alvo = document.getElementById('passagemPainelCaptura');
  if(!alvo || typeof html2canvas === 'undefined') return null;
  return await html2canvas(alvo, { backgroundColor: '#05070b', scale: 2, useCORS: true });
}
function baixarCanvasPassagem(canvas, nomeArquivo = 'passagem_turno_preview.png'){
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = nomeArquivo;
  link.click();
}


inicializarMenuPassagemTurno();
window.addEventListener('load', inicializarMenuPassagemTurno);

async function fecharEEnviarPassagemTurno(){
  try{ if(typeof salvarPassagemTurno === 'function') await salvarPassagemTurno(); }catch(err){ console.error(err); }
  const turno = document.getElementById('passagemTurno')?.value || 'T1';
  const dataRef = document.getElementById('passagemData')?.value || '';
  const programado = document.getElementById('passagemProgramadoTons')?.textContent || '0';
  const realizado = document.getElementById('passagemRealizadoTons')?.textContent || '0';
  const vira = document.getElementById('passagemViraTons')?.textContent || '0';
  const atrasado = document.getElementById('passagemAtrasadoTons')?.textContent || '0';
  const responsavel = document.getElementById('passagemResponsavel')?.value || '';
  const assunto = `Passagem de turno • Expedição • ${dataRef || 'sem data'} (${turno})`;
  const corpo = [
    'Segue fechamento da passagem de turno da expedição.',
    '',
    `Data: ${dataRef || '-'}`,
    `Turno: ${turno}`,
    `Responsável: ${responsavel || '-'}`,
    `Programado: ${programado}`,
    `Realizado: ${realizado}`,
    `Vira: ${vira}`,
    `Atrasado: ${atrasado}`,
    '',
    'A imagem do painel foi baixada para anexar ao e-mail.'
  ].join('\n');
  try{
    const canvas = await capturarPassagemTurnoImagem();
    if(canvas) baixarCanvasPassagem(canvas, `passagem_turno_${(dataRef || 'sem-data').replaceAll('/','-')}_${turno}.png`);
  }catch(err){ console.error(err); }
  window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  if(typeof showToast === 'function') showToast('Passagem salva. A imagem foi baixada para anexar no e-mail.');
}


function descricaoTurnoPassagem(turno){
  if(turno === 'T1') return '06h00 às 14h00';
  if(turno === 'T2') return '14h00 às 22h00';
  if(turno === 'T3') return '22h00 às 06h00';
  return '';
}





function getPassagemMenuRefs(){
  return {
    group: document.getElementById('menu-group-passagem-turno'),
    menuBtn: document.getElementById('menu-passagem-turno'),
    submenu: document.getElementById('submenu-passagem-turno'),
    chevron: document.getElementById('passagemMenuChevron'),
    subLanc: document.getElementById('submenu-passagem-lancamento'),
    subInd: document.getElementById('submenu-passagem-indicadores'),
    lancView: document.getElementById('passagemSubLancamento'),
    indView: document.getElementById('passagemSubIndicadores')
  };
}

function togglePassagemMenu(forceOpen){
  const { group, submenu, chevron } = getPassagemMenuRefs();
  if(!group || !submenu) return;

  const abrir = typeof forceOpen === 'boolean'
    ? forceOpen
    : !group.classList.contains('open');

  group.classList.toggle('open', abrir);
  submenu.hidden = false;
  submenu.setAttribute('aria-hidden', abrir ? 'false' : 'true');
  submenu.style.display = 'flex';
  if(chevron) chevron.textContent = abrir ? '▴' : '▾';
}

function syncPassagemMenuState(){
  const { group, submenu, chevron, subLanc, subInd, lancView, indView } = getPassagemMenuRefs();

  if(lancView) lancView.classList.toggle('active', passagemSubViewAtual === 'lancamento');
  if(indView) indView.classList.toggle('active', passagemSubViewAtual === 'indicadores');
  if(lancView) lancView.style.display = passagemSubViewAtual === 'lancamento' ? 'block' : 'none';
  if(indView) indView.style.display = passagemSubViewAtual === 'indicadores' ? 'block' : 'none';

  if(subLanc) subLanc.classList.toggle('active', passagemSubViewAtual === 'lancamento');
  if(subInd) subInd.classList.toggle('active', passagemSubViewAtual === 'indicadores');

  if(group && submenu){
    const aberto = group.classList.contains('open');
    submenu.hidden = false;
    submenu.setAttribute('aria-hidden', aberto ? 'false' : 'true');
    submenu.style.display = 'flex';
    if(chevron) chevron.textContent = aberto ? '▴' : '▾';
  }
}

function setPassagemSubView(view){
  passagemSubViewAtual = view === 'indicadores' ? 'indicadores' : 'lancamento';
  const { group } = getPassagemMenuRefs();
  if(group) group.classList.add('active', 'open');
  syncPassagemMenuState();
}

function openPassagemTurnoMenu(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  if(viewAtualGlobal !== 'passagem-turno'){
    setView('passagem-turno', document.getElementById('menu-passagem-turno'));
    setPassagemSubView(passagemSubViewAtual || 'lancamento');
    togglePassagemMenu(true);
    return;
  }

  togglePassagemMenu();
  syncPassagemMenuState();
}

function openPassagemSubView(view, event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  if(viewAtualGlobal !== 'passagem-turno'){
    setView('passagem-turno', document.getElementById('menu-passagem-turno'));
  }

  setPassagemSubView(view);
  togglePassagemMenu(true);
}

function inicializarMenuPassagemTurno(){
  const { menuBtn, submenu, subLanc, subInd } = getPassagemMenuRefs();
  if(menuBtn && !menuBtn.dataset.boundPassagemMenu){
    menuBtn.addEventListener('click', openPassagemTurnoMenu);
    menuBtn.dataset.boundPassagemMenu = '1';
  }
  if(subLanc && !subLanc.dataset.boundPassagemSub){
    subLanc.addEventListener('click', (event) => openPassagemSubView('lancamento', event));
    subLanc.dataset.boundPassagemSub = '1';
  }
  if(subInd && !subInd.dataset.boundPassagemSub){
    subInd.addEventListener('click', (event) => openPassagemSubView('indicadores', event));
    subInd.dataset.boundPassagemSub = '1';
  }
  if(submenu){
    submenu.hidden = false;
    submenu.style.display = 'flex';
    submenu.setAttribute('aria-hidden', 'true');
  }
  syncPassagemMenuState();
}




async function fecharEEnviarPassagemTurno(){
  try{ if(typeof salvarPassagemTurno === 'function') salvarPassagemTurno(); }catch(err){ console.error(err); }
  setPassagemSubView('indicadores');
  const turno = document.getElementById('passagemTurno')?.value || 'T1';
  const dataRef = document.getElementById('passagemData')?.value || '';
  const assunto = `Passagem de turno • Expedição • ${dataRef || 'sem data'} (${turno})`;
  const corpo = [
    'Segue fechamento da passagem de turno da expedição.',
    '',
    `Data: ${dataRef || '-'}`,
    `Turno: ${turno}`,
    `Programado: ${document.getElementById('passagemPreviewProgramado')?.textContent || '0'}`,
    `Realizado: ${document.getElementById('passagemPreviewRealizado')?.textContent || '0'}`,
    `Vira: ${document.getElementById('passagemPreviewVira')?.textContent || '0'}`,
    `Atrasado: ${document.getElementById('passagemPreviewAtrasado')?.textContent || '0'}`
  ].join('\n');
  window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  if(typeof showToast === 'function') showToast('Indicadores prontos para envio por e-mail.');
}

document.addEventListener('DOMContentLoaded', function(){
  syncPassagemMenuState();
});




/* ===== FIX GLOBAL MENU PASSAGEM ===== */
window.syncPassagemMenuState = function(){
  const group = document.getElementById('menu-group-passagem-turno');
  const chev = document.getElementById('passagemMenuChevron');
  if(!group || !chev) return;
  chev.textContent = group.classList.contains('open') ? '▴' : '▾';
};

window.setPassagemSubView = function(view){
  window.passagemSubViewAtual = view === 'indicadores' ? 'indicadores' : 'lancamento';
  const lanc = document.getElementById('passagemSubLancamento');
  const ind = document.getElementById('passagemSubIndicadores');
  const tabLanc = document.getElementById('ptTabLancamento');
  const tabInd = document.getElementById('ptTabIndicadores');
  const subLanc = document.getElementById('submenu-passagem-lancamento');
  const subInd = document.getElementById('submenu-passagem-indicadores');
  const group = document.getElementById('menu-group-passagem-turno');
  if(lanc) lanc.classList.toggle('active', window.passagemSubViewAtual === 'lancamento');
  if(ind) ind.classList.toggle('active', window.passagemSubViewAtual === 'indicadores');
  if(tabLanc) tabLanc.classList.toggle('active', window.passagemSubViewAtual === 'lancamento');
  if(tabInd) tabInd.classList.toggle('active', window.passagemSubViewAtual === 'indicadores');
  if(subLanc) subLanc.classList.toggle('active', window.passagemSubViewAtual === 'lancamento');
  if(subInd) subInd.classList.toggle('active', window.passagemSubViewAtual === 'indicadores');
  if(group) group.classList.add('open','active');
  window.syncPassagemMenuState();
};

window.openPassagemTurnoMenu = function(){
  const group = document.getElementById('menu-group-passagem-turno');
  if(typeof viewAtualGlobal !== 'undefined' && viewAtualGlobal === 'passagem-turno'){
    if(group) group.classList.toggle('open');
    window.syncPassagemMenuState();
    return;
  }
  if(typeof setView === 'function'){
    setView('passagem-turno', document.getElementById('menu-passagem-turno'));
  }
  if(group) group.classList.add('open','active');
  window.setPassagemSubView(window.passagemSubViewAtual || 'lancamento');
  window.syncPassagemMenuState();
};

window.openPassagemSubView = function(view){
  if(typeof setView === 'function'){
    setView('passagem-turno', document.getElementById('menu-passagem-turno'));
  }
  window.setPassagemSubView(view);
};

document.addEventListener('DOMContentLoaded', function(){
  window.syncPassagemMenuState();
});



window.setPassagemSubView = function(view){
  window.passagemSubViewAtual = view === 'indicadores' ? 'indicadores' : 'lancamento';
  const lanc = document.getElementById('passagemSubLancamento');
  const ind = document.getElementById('passagemSubIndicadores');
  const subLanc = document.getElementById('submenu-passagem-lancamento');
  const subInd = document.getElementById('submenu-passagem-indicadores');
  const group = document.getElementById('menu-group-passagem-turno');
  if(lanc) lanc.classList.toggle('active', window.passagemSubViewAtual === 'lancamento');
  if(ind) ind.classList.toggle('active', window.passagemSubViewAtual === 'indicadores');
  if(subLanc) subLanc.classList.toggle('active', window.passagemSubViewAtual === 'lancamento');
  if(subInd) subInd.classList.toggle('active', window.passagemSubViewAtual === 'indicadores');
  if(group) group.classList.add('open','active');
  if(typeof window.syncPassagemMenuState === 'function') window.syncPassagemMenuState();
};

window.openPassagemTurnoMenu = function(){
  const group = document.getElementById('menu-group-passagem-turno');
  if(typeof setView === 'function'){
    setView('passagem-turno', document.getElementById('menu-passagem-turno'));
  }
  if(group) group.classList.toggle('open');
  if(group) group.classList.add('active');
  if(!document.getElementById('passagemSubLancamento')?.classList.contains('active') &&
     !document.getElementById('passagemSubIndicadores')?.classList.contains('active')){
    window.setPassagemSubView(window.passagemSubViewAtual || 'lancamento');
  }
  if(typeof window.syncPassagemMenuState === 'function') window.syncPassagemMenuState();
};

window.openPassagemSubView = function(view){
  if(typeof setView === 'function'){
    setView('passagem-turno', document.getElementById('menu-passagem-turno'));
  }
  window.setPassagemSubView(view);
};



document.addEventListener('DOMContentLoaded', function(){
  const obs = document.getElementById('passagemOcorrencias');
  const counter = document.getElementById('passagemOcorrenciasCounter');
  if(obs && counter){
    const syncCounter = ()=>{ counter.textContent = String((obs.value || '').length); };
    obs.addEventListener('input', syncCounter);
    syncCounter();
  }
});

(function(){
  const oldRender = window.renderPassagemTurno;
  if(typeof oldRender === 'function'){
    window.renderPassagemTurno = function(){
      const result = oldRender.apply(this, arguments);
      const turno = document.getElementById('passagemTurno')?.value || 'T1';
      const ref = document.getElementById('passagemTurnoRef');
      const desc = ({T1:'06:00 às 14:00',T2:'14:00 às 22:00',T3:'22:00 às 06:00'})[turno] || turno;
      if(ref) ref.textContent = desc;
      const indDesc = document.getElementById('passagemIndTurnoDesc');
      if(indDesc) indDesc.textContent = desc;
      const dt = document.getElementById('passagemData')?.value;
      const indDt = document.getElementById('passagemIndDataRef');
      if(indDt && dt){
        try{
          const [y,m,d] = dt.split('-');
          indDt.textContent = `${d}/${m}/${y}`;
        }catch(_){}
      }
      return result;
    }
  }
})();

document.addEventListener('DOMContentLoaded', function(){
  const group = document.getElementById('menu-group-passagem-turno');
  if(group && document.getElementById('view-passagem-turno') && !document.getElementById('view-passagem-turno').classList.contains('hidden')){
    group.classList.add('open');
    if(typeof syncPassagemMenuState === 'function') syncPassagemMenuState();
  }
  const counter = document.getElementById('passagemOcorrenciasCounter');
  const obs = document.getElementById('passagemOcorrencias');
  if(counter && obs){
    const sync = ()=> counter.textContent = String((obs.value || '').length);
    obs.addEventListener('input', sync);
    sync();
  }
});


/* ===== PASSAGEM DE TURNO V9 | LABELS NOS GRÁFICOS ===== */
(function(){
  if(typeof Chart === 'undefined' || window.__passagemV9PluginsLoaded) return;
  window.__passagemV9PluginsLoaded = true;

  const roundRect = (ctx, x, y, w, h, r=8) => {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  };

  Chart.register({
    id:'passagemValueLabels',
    afterDatasetsDraw(chart, args, opts){
      if(!opts || !opts.enabled || chart.config.type !== 'bar') return;
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0);
      const dataset = chart.data.datasets[0];
      if(!meta || !dataset) return;
      ctx.save();
      ctx.font = '700 14px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      meta.data.forEach((bar, i) => {
        const value = Number(dataset.data[i] || 0);
        const x = bar.x;
        const topY = Math.min(bar.y, bar.base) - 10;
        const baseY = chart.chartArea.bottom - 18;
        const y = value > 0 ? topY : baseY;
        ctx.fillStyle = '#f8fbff';
        ctx.fillText(String(value), x, y);
      });
      ctx.restore();
    }
  });

  Chart.register({
    id:'passagemDonutLabels',
    afterDatasetsDraw(chart, args, opts){
      if(chart.config.type !== 'doughnut') return;
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0);
      const data = chart.data.datasets?.[0]?.data || [];
      if(!meta || !meta.data?.length) return;
      const total = data.reduce((a,b)=>a + Number(b || 0), 0);
      const centerX = meta.data[0].x;
      const centerY = meta.data[0].y;
      ctx.save();
      // center value
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9fb0ca';
      ctx.font = '600 12px Inter, Arial, sans-serif';
      ctx.fillText((opts && opts.totalLabel) || 'Total', centerX, centerY - 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 28px Inter, Arial, sans-serif';
      ctx.fillText(String(total), centerX, centerY + 22);
      // segment values around ring
      meta.data.forEach((arc, i) => {
        const value = Number(data[i] || 0);
        if(value <= 0) return;
        const angle = (arc.startAngle + arc.endAngle) / 2;
        const r = arc.outerRadius + 16;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        const bg = Array.isArray(chart.data.datasets[0].backgroundColor) ? chart.data.datasets[0].backgroundColor[i] : '#fff';
        const txt = String(value);
        ctx.font = '800 16px Inter, Arial, sans-serif';
        const width = Math.max(26, ctx.measureText(txt).width + 14);
        const h = 24;
        ctx.fillStyle = 'rgba(7,11,18,.88)';
        roundRect(ctx, x - width/2, y - h/2, width, h, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = typeof bg === 'string' ? bg.replace('.95', '1').replace('.92','1') : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, x, y + 1);
      });
      ctx.restore();
    }
  });
})();

try{ if(typeof renderPassagemTurno === 'function') setTimeout(() => renderPassagemTurno(), 0); }catch(_){ }

// V10 buttons added

window.passagemTurnoV11Refresh = function(){
  try{
    if(typeof renderPassagemTurno === 'function') renderPassagemTurno();
  }catch(_){}
};
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(() => {
    try{ window.passagemTurnoV11Refresh(); }catch(_){}
  }, 120);
});


/* ===== PASSAGEM DE TURNO | REGRA OPERACIONAL REAL ===== */
function getHoraTextoPassagem(valor){
  if(valor === null || valor === undefined || valor === '') return '';
  const texto = String(valor).trim();
  if(!texto) return '';
  const match = texto.match(/(\d{1,2}):(\d{2})/);
  if(match) return `${String(match[1]).padStart(2,'0')}:${match[2]}`;
  const numero = Number(texto.replace(',', '.'));
  if(Number.isFinite(numero) && numero >= 0 && numero < 1){
    const totalMin = Math.round(numero * 24 * 60);
    const hh = String(Math.floor(totalMin / 60) % 24).padStart(2,'0');
    const mm = String(totalMin % 60).padStart(2,'0');
    return `${hh}:${mm}`;
  }
  return '';
}

function getTurnoPorHorarioPrevisto(row){
  const previsto = valorTerminoPrevisto(row);
  const horaPrev = getHoraTextoPassagem(previsto);
  if(horaPrev) return definirTurno(horaPrev);
  return definirTurno(row?.hora_agenda);
}

function getTurnoConclusaoReal(row){
  const candidatos = [
    row?.fim_carregamento,
    row?.data_expedicao,
    row?.hora_fim_carregamento,
    row?.horario_saida
  ];
  for(const valor of candidatos){
    const hora = getHoraTextoPassagem(valor);
    if(hora) return definirTurno(hora);
  }
  if(row?.turno_expedido) return row.turno_expedido;
  return '';
}

function carroEstaPresenteParaCarregamento(row){
  return !!(
    row?.chegada_motorista ||
    row?.data_em_doca ||
    row?.inicio_carregamento ||
    row?.fim_carregamento ||
    ['No Pátio','Em Doca','Em Carregamento','Expedido'].includes(row?.status_global)
  );
}

function carroConcluidoNoTurno(row, turno){
  if(row?.status_global !== 'Expedido' && !row?.fim_carregamento && !row?.data_expedicao) return false;
  return getTurnoConclusaoReal(row) === turno;
}

function getResumoOperacionalPassagem(rows, turno){
  const programado = rows.filter(r => getTurnoPorHorarioPrevisto(r) === turno);
  const realizado = programado.filter(r => carroConcluidoNoTurno(r, turno));
  const vira = programado.filter(r => !carroConcluidoNoTurno(r, turno) && carroEstaPresenteParaCarregamento(r));
  const atrasado = programado.filter(r => !carroConcluidoNoTurno(r, turno) && !carroEstaPresenteParaCarregamento(r));
  return { programado, realizado, vira, atrasado };
}

renderPassagemTurno = function(){
  const section = document.getElementById('view-passagem-turno');
  if(!section) return;
  const dtInput = document.getElementById('passagemData');
  if(dtInput && !dtInput.dataset.userLocked && dataFiltrada()) dtInput.value = dataFiltrada();
  const dataRefRaw = dtInput?.value || dataFiltrada() || '';
  const turnoEl = document.getElementById('passagemTurno');
  const turno = turnoEl?.value || 'T1';

  const key = getPassagemTurnoSupabaseKey();
  if(__passagemTurnoLoadKey !== key && !__passagemTurnoLoading){
    loadPassagemTurnoFromSupabase().then(() => renderPassagemTurno());
  }

  const state = getPassagemTurnoState();
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val ?? ''; };
  setVal('passagemResponsavel', state.responsavel);
  setVal('passagemOperador', state.operador);
  setVal('passagemConferente', state.conferente);
  setVal('passagemExclusiva', state.exclusiva);
  setVal('passagemRecebidoPor', state.recebidoPor);
  setVal('passagemHorario', state.horario);
  setVal('passagemOcorrencias', state.ocorrencias);

  ['ferias','ausencias','bancoHoras'].forEach(prefix => {
    const box = document.querySelector(`#graficoPassagem${prefix === 'bancoHoras' ? 'BancoHoras' : prefix.charAt(0).toUpperCase()+prefix.slice(1)}`)?.closest('.card');
    if(box){
      let holder = box.querySelector('.passagem-mini-inputs-v2, .passagem-mini-inputs');
      if(!holder){
        holder = document.createElement('div');
        holder.className = 'passagem-mini-inputs';
        holder.style.display = 'grid';
        holder.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr))';
        holder.style.gap = '8px';
        holder.style.marginTop = '12px';
        box.appendChild(holder);
      }
      holder.innerHTML = renderMiniPassagemInputs(`passagem${prefix.charAt(0).toUpperCase()+prefix.slice(1)}`, state[prefix]);
    }
  });
  renderPassagemAreas(state);
  bindPassagemLiveInputs();

  const rows = getAgendaRows().filter(r => !dataRefRaw || r.data_agenda === dataRefRaw);
  const resumo = getResumoOperacionalPassagem(rows, turno);
  const setKpiText = (ids,val)=>{ (Array.isArray(ids)?ids:[ids]).forEach(id => { const el=document.getElementById(id); if(el) el.textContent = val; }); };
  const tons = arr => arr.reduce((a,b)=>a+getTonelagemPassagem(b),0);
  const kpi = (arr, tonsIds, carrosIds) => { setKpiText(carrosIds, arr.length); setKpiText(tonsIds, formatPassagemTonelagem(tons(arr))); };

  kpi(resumo.programado, ['passagemProgramadoTons','passagemProgTons'], ['passagemProgramadoCarros','passagemProgCarros']);
  kpi(resumo.realizado, ['passagemRealizadoTons','passagemRealTons'], ['passagemRealizadoCarros','passagemRealCarros']);
  kpi(resumo.vira, 'passagemViraTons', 'passagemViraCarros');
  kpi(resumo.atrasado, 'passagemAtrasadoTons', 'passagemAtrasadoCarros');

  const totalQuadro = (Number(state.operador)||0) + (Number(state.conferente)||0) + (Number(state.exclusiva)||0);
  const setText2 = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
  setText2('passagemTurnoRef', turno);
  setText2('passagemTotalQuadroRef', totalQuadro);
  setText2('passagemPreviewProgramado', document.getElementById('passagemProgramadoTons')?.textContent || '0');
  setText2('passagemPreviewRealizado', document.getElementById('passagemRealizadoTons')?.textContent || '0');
  setText2('passagemPreviewVira', document.getElementById('passagemViraTons')?.textContent || '0');
  setText2('passagemPreviewAtrasado', document.getElementById('passagemAtrasadoTons')?.textContent || '0');
  setText2('passagemIndProgramadoCarros', document.getElementById('passagemProgramadoCarros')?.textContent || '0');
  setText2('passagemIndRealizadoCarros', document.getElementById('passagemRealizadoCarros')?.textContent || '0');
  setText2('passagemIndViraCarros', document.getElementById('passagemViraCarros')?.textContent || '0');
  setText2('passagemIndAtrasadoCarros', document.getElementById('passagemAtrasadoCarros')?.textContent || '0');
  setText2('passagemPreviewProgramadoEmail', document.getElementById('passagemProgramadoTons')?.textContent || '0');
  setText2('passagemPreviewRealizadoEmail', document.getElementById('passagemRealizadoTons')?.textContent || '0');
  setText2('passagemPreviewViraEmail', document.getElementById('passagemViraTons')?.textContent || '0');
  setText2('passagemPreviewAtrasadoEmail', document.getElementById('passagemAtrasadoTons')?.textContent || '0');
  setText2('passagemPreviewTurnoEmail', turno);
  setText2('passagemPreviewQuadroEmail', totalQuadro);
  setText2('passagemPreviewQuadro', totalQuadro);
  setText2('passagemIndOperador', state.operador || 0);
  setText2('passagemIndConferente', state.conferente || 0);
  setText2('passagemIndExclusiva', state.exclusiva || 0);
  setText2('passagemIndResponsavel', state.responsavel || '-');
  setText2('passagemIndRecebidoPor', state.recebidoPor || '-');
  setText2('passagemIndHorario', state.horario || '-');
  setText2('passagemIndOcorrencias', state.ocorrencias || 'Sem observações registradas.');

  const setMini = (prefix, obj) => {
    setText2(`${prefix}_operador`, obj.operador || 0);
    setText2(`${prefix}_conferente`, obj.conferente || 0);
    setText2(`${prefix}_exclusiva`, obj.exclusiva || 0);
  };
  setMini('passagemIndFerias', state.ferias || {});
  setMini('passagemIndAusencias', state.ausencias || {});
  setMini('passagemIndBancoHoras', state.bancoHoras || {});

  const donutCtx = document.getElementById('graficoPassagemQuadro');
  if(donutCtx){
    try{ window.chartPassagemQuadro?.destroy(); }catch(_){}
    window.chartPassagemQuadro = new Chart(donutCtx, {
      type:'doughnut',
      data:{ labels:['Operador','Conferente','Exclusiva'], datasets:[{ data:[state.operador||0,state.conferente||0,state.exclusiva||0], backgroundColor:['rgba(34,211,238,.92)','rgba(59,130,246,.92)','rgba(245,158,11,.92)'], borderColor:'rgba(10,13,18,.94)', borderWidth:3, hoverOffset:4 }]},
      options: mergeChartOptions(getPremiumChartOptions(), { cutout:'68%', layout:{ padding:{ top:8, right:12, bottom:8, left:12 } }, plugins:{ legend:{ position:'top' }, passagemDonutLabels:{ totalLabel:'Total' } } })
    });
  }

  const miniChart = (id, vals) => {
    const el = document.getElementById(id); if(!el) return;
    try{ const ref = window[`chart_${id}`]; if(ref) ref.destroy(); }catch(_){}
    window[`chart_${id}`] = new Chart(el, {
      type:'bar',
      data:{ labels:['Operador','Conferente','Exclusiva'], datasets:[{ data:vals, borderRadius:10, backgroundColor:['rgba(34,211,238,.92)','rgba(59,130,246,.92)','rgba(245,158,11,.92)'] }]},
      options: mergeChartOptions(getPremiumChartOptions(), {
        plugins:{ legend:{ display:false } },
        maintainAspectRatio:false,
        scales:{ y:{ beginAtZero:true, ticks:{ precision:0, stepSize:1 } } }
      })
    });
  };
  miniChart('graficoPassagemFerias', [state.ferias.operador||0,state.ferias.conferente||0,state.ferias.exclusiva||0]);
  miniChart('graficoPassagemAusencias', [state.ausencias.operador||0,state.ausencias.conferente||0,state.ausencias.exclusiva||0]);
  miniChart('graficoPassagemBancoHoras', [state.bancoHoras.operador||0,state.bancoHoras.conferente||0,state.bancoHoras.exclusiva||0]);
  miniChart('graficoPassagemFeriasIndicador', [state.ferias.operador||0,state.ferias.conferente||0,state.ferias.exclusiva||0]);
  miniChart('graficoPassagemAusenciasIndicador', [state.ausencias.operador||0,state.ausencias.conferente||0,state.ausencias.exclusiva||0]);
  miniChart('graficoPassagemBancoHorasIndicador', [state.bancoHoras.operador||0,state.bancoHoras.conferente||0,state.bancoHoras.exclusiva||0]);

  const totalRef = document.getElementById('passagemTotalQuadro');
  if(totalRef) totalRef.textContent = totalQuadro;
};
