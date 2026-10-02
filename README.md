# TeenWork

Plataforma de oportunidades para estudantes do ensino médio e técnico: **Jovem Aprendiz, estágio, primeiro emprego e cursos**.
Projeto de TCC — Desenvolvimento de Sistemas (ETEC).

| Camada | Tecnologias |
| --- | --- |
| Backend | C# · .NET 10 · ASP.NET Core Web API · EF Core 9 · MySQL 8 (Pomelo) · JWT · BCrypt · FluentValidation · Swagger · xUnit |
| Frontend | React 19 · Vite 6 · TypeScript (strict) · React Router 7 · react-icons (Lucide) · CSS próprio (sem framework) |
| Infra | Docker · docker-compose · Migrations EF Core · script SQL completo |

## Estrutura

```
TeenWork/
├── Backend/            Solução .NET em 4 camadas + testes
│   ├── TeenWork.Domain           Entidades, enums, regras de domínio
│   ├── TeenWork.Application      DTOs, serviços, validações (FluentValidation)
│   ├── TeenWork.Infrastructure   EF Core, migrations, seed, JWT, BCrypt, uploads, e-mail
│   ├── TeenWork.API              Controllers, middlewares, Swagger, Program.cs
│   └── TeenWork.Tests            Testes unitários e de integração (xUnit)
├── Frontend/           SPA React + Vite + TypeScript
│   └── src/
│       ├── lib/         cliente HTTP com JWT, tipos dos DTOs, endpoints, formatadores
│       ├── context/     autenticação e notificações (toasts)
│       ├── components/  UI (botões, campos, modais…), layouts, vagas, candidaturas
│       ├── pages/       public/ · student/ · company/ · shared/
│       └── styles/      tokens (paleta azul), componentes, layout, páginas
├── Database/schema.sql Script completo do banco (alternativa às migrations)
└── docker-compose.yml  MySQL + API
```

## Como rodar

### Pré-requisitos
- .NET SDK 10
- Node.js 20+ e npm
- MySQL 8 (ou Docker)

### 1. Banco de dados
Com Docker:
```bash
docker compose up -d mysql
```
Ou crie o banco manualmente em um MySQL local. A API aplica as migrations e cria os dados de demonstração sozinha na primeira execução.
Se preferir, rode `Database/schema.sql` direto no MySQL Workbench.

### 2. Backend (porta 5165)
```bash
cd Backend
dotnet restore
dotnet run --project TeenWork.API
```
- Swagger: http://localhost:5165/swagger
- Saúde: http://localhost:5165/api/health
- Ajuste a connection string em `TeenWork.API/appsettings.Development.json` se necessário.

Testes:
```bash
dotnet test
```

### 3. Frontend (porta 5173)
```bash
cd Frontend
npm install
npm run dev
```
Abra http://localhost:5173. O Vite redireciona `/api` e `/uploads` para `http://localhost:5165` (veja `vite.config.ts`).
Para outra URL da API, copie `.env.example` para `.env` e ajuste `VITE_API_PROXY` (dev) ou `VITE_API_URL` (produção).

Build de produção:
```bash
npm run build      # gera Frontend/dist
npm run preview
```

### Tudo com Docker
```bash
docker compose up --build
```

## Contas de demonstração

Senha de todas: **`TeenWork@2026`**

| Perfil | E-mail |
| --- | --- |
| Estudante | ana.souza@teenwork.dev |
| Estudante | lucas.pereira@teenwork.dev |
| Estudante | beatriz.lima@teenwork.dev |
| Empresa | rh@nuvemazul.teenwork.dev |
| Empresa | contato@bomdia.teenwork.dev |
| Admin | admin@teenwork.dev |

(Na tela de login há atalhos que preenchem as contas de estudante e empresa.)

## Funcionalidades

**Estudante**: cadastro e login · painel com recomendações e progresso do perfil · busca de vagas com filtros (texto, cidade, modalidade, tipo, área, salário, ordenação, paginação — tudo refletido na URL) · detalhe da vaga · candidatura com mensagem · trilha visual da candidatura · cancelamento · vagas salvas · perfil com foto, habilidades e experiências · lista e página de empresas · notificações · troca de senha · recuperação de senha por e-mail.

**Empresa**: painel com indicadores · publicar/editar/pausar/encerrar/excluir vagas · candidatos por vaga e geral, com filtros · perfil completo do candidato · aprovar/recusar/colocar em análise com mensagem ao estudante · perfil e logo da empresa · notificações.

**Admin**: estatísticas da plataforma e ativação/desativação de contas.

## Observações técnicas
- EF Core e Pomelo fixados em **9.0.0** (o Pomelo ainda não tem versão 10); roda normalmente no .NET 10.
- `Jwt:Key` precisa ter pelo menos 32 caracteres — troque em produção.
- Imagens enviadas ficam em `TeenWork.API/uploads` (máx. 2 MB, JPG/PNG/WEBP).
- O e-mail de recuperação usa SMTP opcional; sem SMTP configurado, o link é registrado no log da API.
- Respostas da API seguem o envelope `{ success, message, data, errors }`, consumido pelo cliente em `Frontend/src/lib/api.ts`.

## Hospedagem gratuita sugerida
- API: **Render** (Docker, pasta `Backend/`), variáveis `ConnectionStrings__DefaultConnection` e `Jwt__Key`.
- Banco: **Aiven for MySQL** (plano grátis).
- Frontend: **Vercel** ou Cloudflare Pages (`npm run build`, pasta `dist`), com `VITE_API_URL` apontando para a API.
- Configure `Frontend:FrontendUrl` e `Cors:AllowedOrigins` com a URL final do frontend.
