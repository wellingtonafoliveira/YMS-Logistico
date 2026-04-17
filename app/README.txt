YMS separado em login e sistema interno

Arquivos principais:
- login.html -> tela de login
- app.html -> sistema interno
- assets/css/styles.css -> estilos compartilhados
- assets/js/config.js -> conexão Supabase
- assets/js/auth.js -> autenticação e redirecionamento
- assets/js/app.js -> lógica do sistema interno

Importante:
- Mantenha os arquivos de imagem no mesmo nível de login.html e app.html:
  - logo.png
  - Foto armazém.jpg
  - gestao-de-patio.jpg
  - gestao-de-etapas.png

Fluxo:
- login.html faz login e redireciona para app.html
- app.html exige sessão ativa; sem sessão, volta para login.html