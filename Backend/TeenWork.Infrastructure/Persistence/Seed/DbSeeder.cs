using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Domain.Entities;
using TeenWork.Domain.Enums;

namespace TeenWork.Infrastructure.Persistence.Seed;

/// <summary>
/// Dados de demonstração (seed). Executado apenas quando o banco está vazio.
/// Todas as contas usam a senha <see cref="DemoPassword"/> e o domínio fictício teenwork.dev.
/// </summary>
public static class DbSeeder
{
    public const string DemoPassword = "TeenWork@2026";

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            logger.LogInformation("Seed ignorado: o banco já possui usuários.");
            return;
        }

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now.AddHours(-3));
        var passwordHash = hasher.Hash(DemoPassword);
        DateTime DaysAgo(double days) => now.AddDays(-days);

        // ---------------- Administrador ----------------
        var admin = new User
        {
            Name = "Administrador TeenWork",
            Email = "admin@teenwork.dev",
            PasswordHash = passwordHash,
            UserType = UserType.Admin,
            CreatedAt = DaysAgo(60)
        };

        // ---------------- Empresas ----------------
        var nuvemAzul = new User
        {
            Name = "Mariana Costa",
            Email = "rh@nuvemazul.teenwork.dev",
            PasswordHash = passwordHash,
            UserType = UserType.Company,
            CreatedAt = DaysAgo(45),
            CompanyProfile = new CompanyProfile
            {
                CompanyName = "Nuvem Azul Tecnologia",
                Description = "Software house que desenvolve sistemas web para escolas e pequenos negócios. " +
                              "Acreditamos no primeiro emprego como porta de entrada para a tecnologia e mantemos " +
                              "um programa de mentoria para estagiários e aprendizes. (Empresa fictícia — dados de demonstração.)",
                Cnpj = "11222333000181",
                Industry = "Tecnologia",
                City = "Campinas",
                State = "SP",
                Website = "https://nuvemazul.teenwork.dev",
                CreatedAt = DaysAgo(45)
            }
        };

        var bomDia = new User
        {
            Name = "Roberto Almeida",
            Email = "contato@bomdia.teenwork.dev",
            PasswordHash = passwordHash,
            UserType = UserType.Company,
            CreatedAt = DaysAgo(40),
            CompanyProfile = new CompanyProfile
            {
                CompanyName = "Supermercados Bom Dia",
                Description = "Rede regional de supermercados com 12 lojas no interior paulista. " +
                              "Contratamos jovens aprendizes todos os semestres e oferecemos plano de carreira " +
                              "para quem está começando. (Empresa fictícia — dados de demonstração.)",
                Cnpj = "44555666000181",
                Industry = "Varejo",
                City = "Bauru",
                State = "SP",
                Website = "https://bomdia.teenwork.dev",
                CreatedAt = DaysAgo(40)
            }
        };

        // ---------------- Estudantes ----------------
        var ana = new User
        {
            Name = "Ana Souza",
            Email = "ana.souza@teenwork.dev",
            PasswordHash = passwordHash,
            UserType = UserType.Student,
            CreatedAt = DaysAgo(30),
            StudentProfile = new StudentProfile
            {
                School = "ETEC Bento Quirino",
                Course = "Técnico em Desenvolvimento de Sistemas",
                SchoolYear = "3º ano",
                GraduationYear = today.Year,
                City = "Campinas",
                State = "SP",
                Bio = "Estudante de Desenvolvimento de Sistemas apaixonada por front-end. Gosto de transformar ideias em " +
                      "interfaces simples de usar e estou buscando meu primeiro estágio na área.",
                Skills = "HTML;CSS;JavaScript;React;Git;Trabalho em equipe",
                PortfolioUrl = "https://github.com/ana-souza-dev",
                CreatedAt = DaysAgo(30),
                Experiences =
                {
                    new StudentExperience
                    {
                        Title = "Desenvolvedora do site da Feira de Ciências",
                        Organization = "ETEC Bento Quirino",
                        Type = ExperienceType.Project,
                        StartDate = today.AddMonths(-8),
                        EndDate = today.AddMonths(-6),
                        Description = "Criei o site de inscrições da feira com HTML, CSS e JavaScript, usado por mais de 200 alunos."
                    },
                    new StudentExperience
                    {
                        Title = "Monitora de informática",
                        Organization = "Biblioteca Municipal",
                        Type = ExperienceType.Volunteer,
                        StartDate = today.AddMonths(-5),
                        EndDate = null,
                        Description = "Ajudo pessoas idosas a usar o computador e serviços públicos online aos sábados."
                    }
                }
            }
        };

        var lucas = new User
        {
            Name = "Lucas Pereira",
            Email = "lucas.pereira@teenwork.dev",
            PasswordHash = passwordHash,
            UserType = UserType.Student,
            CreatedAt = DaysAgo(25),
            StudentProfile = new StudentProfile
            {
                School = "E.E. Prof. Luiz Castanho de Almeida",
                Course = "Ensino Médio + Técnico em Administração",
                SchoolYear = "2º ano",
                GraduationYear = today.Year + 1,
                City = "Bauru",
                State = "SP",
                Bio = "Organizado e comunicativo, ajudo no comércio da família desde os 14 anos. Quero minha primeira " +
                      "experiência formal como jovem aprendiz na área administrativa.",
                Skills = "Excel;Atendimento ao cliente;Comunicação;Organização",
                CreatedAt = DaysAgo(25),
                Experiences =
                {
                    new StudentExperience
                    {
                        Title = "Auxiliar no comércio da família",
                        Organization = "Mercearia Pereira",
                        Type = ExperienceType.Job,
                        StartDate = today.AddYears(-2),
                        EndDate = null,
                        Description = "Atendimento no balcão, controle de estoque em planilha e fechamento de caixa."
                    }
                }
            }
        };

        var beatriz = new User
        {
            Name = "Beatriz Lima",
            Email = "beatriz.lima@teenwork.dev",
            PasswordHash = passwordHash,
            UserType = UserType.Student,
            CreatedAt = DaysAgo(20),
            StudentProfile = new StudentProfile
            {
                School = "ETEC Antonio Devisate",
                Course = "Técnico em Marketing",
                SchoolYear = "3º ano",
                GraduationYear = today.Year,
                City = "Marília",
                State = "SP",
                Bio = "Crio conteúdo para redes sociais e adoro fotografia. Busco estágio em marketing digital, de preferência remoto.",
                Skills = "Canva;Redes sociais;Copywriting;Fotografia;Comunicação",
                CreatedAt = DaysAgo(20)
            }
        };

        db.Users.AddRange(admin, nuvemAzul, bomDia, ana, lucas, beatriz);
        await db.SaveChangesAsync(ct);

        // ---------------- Vagas ----------------
        var nuvem = nuvemAzul.CompanyProfile!;
        var mercado = bomDia.CompanyProfile!;

        var frontEnd = new Job
        {
            CompanyId = nuvem.Id,
            Title = "Estágio em Desenvolvimento Front-end",
            Description = "Você vai participar do desenvolvimento das telas dos nossos sistemas escolares, " +
                          "construindo componentes em React junto com um desenvolvedor mentor. Rotina com code review, " +
                          "reuniões rápidas diárias e muito aprendizado prático.",
            Requirements = "Estar cursando ensino técnico ou superior em TI\nConhecimentos básicos de HTML, CSS e JavaScript\nNoções de Git\nVontade de aprender React",
            Benefits = "Bolsa-auxílio\nVale-transporte\nNotebook fornecido pela empresa\nMentoria semanal",
            Area = "Tecnologia",
            City = "Campinas",
            State = "SP",
            WorkModel = WorkModel.Hybrid,
            JobType = JobType.Internship,
            Salary = 1200m,
            Workload = "30h semanais",
            Vacancies = 2,
            Status = JobStatus.Active,
            Deadline = today.AddDays(30),
            CreatedAt = DaysAgo(12)
        };

        var suporte = new Job
        {
            CompanyId = nuvem.Id,
            Title = "Jovem Aprendiz — Suporte Técnico",
            Description = "Programa de aprendizagem com atividades de suporte aos clientes: atendimento por chat, " +
                          "abertura de chamados, testes simples nos sistemas e organização da base de conhecimento.",
            Requirements = "Ter entre 14 e 24 anos\nEstar matriculado(a) no ensino médio ou técnico\nBoa comunicação escrita",
            Benefits = "Salário de aprendiz\nVale-transporte\nCurso de formação profissional",
            Area = "Tecnologia",
            City = "Campinas",
            State = "SP",
            WorkModel = WorkModel.OnSite,
            JobType = JobType.YoungApprentice,
            Salary = 950m,
            Workload = "20h semanais (4h/dia)",
            Vacancies = 3,
            Status = JobStatus.Active,
            Deadline = today.AddDays(21),
            CreatedAt = DaysAgo(8)
        };

        var curso = new Job
        {
            CompanyId = nuvem.Id,
            Title = "Curso gratuito: Lógica de Programação para Iniciantes",
            Description = "Curso online e gratuito de 6 semanas com aulas ao vivo às quartas-feiras. Os melhores alunos " +
                          "são convidados para o processo seletivo do nosso programa de estágio.",
            Requirements = "Estar cursando o ensino médio\nTer acesso a um computador com internet",
            Benefits = "Certificado de conclusão\nIndicação para vagas de estágio",
            Area = "Educação",
            City = "Campinas",
            State = "SP",
            WorkModel = WorkModel.Remote,
            JobType = JobType.Course,
            Salary = null,
            Workload = "3h semanais",
            Vacancies = 40,
            Status = JobStatus.Active,
            Deadline = today.AddDays(15),
            CreatedAt = DaysAgo(5)
        };

        var aprendizAdm = new Job
        {
            CompanyId = mercado.Id,
            Title = "Jovem Aprendiz Administrativo",
            Description = "Apoio às rotinas do escritório central: lançamento de notas fiscais, organização de documentos, " +
                          "controle de planilhas e atendimento a fornecedores por telefone e e-mail.",
            Requirements = "Ter entre 16 e 22 anos\nEstar cursando o ensino médio\nConhecimento básico em Excel",
            Benefits = "Salário de aprendiz\nVale-transporte\nVale-alimentação\nDesconto nas lojas",
            Area = "Administração",
            City = "Bauru",
            State = "SP",
            WorkModel = WorkModel.OnSite,
            JobType = JobType.YoungApprentice,
            Salary = 900m,
            Workload = "20h semanais",
            Vacancies = 2,
            Status = JobStatus.Active,
            Deadline = today.AddDays(25),
            CreatedAt = DaysAgo(10)
        };

        var caixa = new Job
        {
            CompanyId = mercado.Id,
            Title = "Operador(a) de Caixa — Primeiro Emprego",
            Description = "Vaga para quem está buscando o primeiro emprego com carteira assinada. Você vai atender clientes " +
                          "no caixa, conferir mercadorias e zelar pela organização do setor. Treinamento completo na admissão.",
            Requirements = "Ter 18 anos ou mais\nEnsino médio completo ou em andamento\nDisponibilidade de horário (escala 6x1)",
            Benefits = "Vale-transporte\nVale-alimentação\nPlano de carreira\nConvênio médico após 90 dias",
            Area = "Varejo",
            City = "Bauru",
            State = "SP",
            WorkModel = WorkModel.OnSite,
            JobType = JobType.FirstJob,
            Salary = 1650m,
            Workload = "44h semanais (escala 6x1)",
            Vacancies = 5,
            Status = JobStatus.Active,
            Deadline = null,
            CreatedAt = DaysAgo(3)
        };

        var marketing = new Job
        {
            CompanyId = mercado.Id,
            Title = "Estágio em Marketing Digital",
            Description = "Criação de posts para as redes sociais das lojas, acompanhamento de métricas e apoio nas campanhas " +
                          "sazonais. Processo seletivo encerrado nesta edição.",
            Requirements = "Cursando técnico ou superior em Marketing, Publicidade ou áreas afins\nConhecimento em Canva",
            Benefits = "Bolsa-auxílio\nAuxílio home office",
            Area = "Marketing",
            City = "Bauru",
            State = "SP",
            WorkModel = WorkModel.Remote,
            JobType = JobType.Internship,
            Salary = 1000m,
            Workload = "25h semanais",
            Vacancies = 1,
            Status = JobStatus.Closed,
            Deadline = today.AddDays(-5),
            CreatedAt = DaysAgo(35)
        };

        db.Jobs.AddRange(frontEnd, suporte, curso, aprendizAdm, caixa, marketing);
        await db.SaveChangesAsync(ct);

        // ---------------- Candidaturas ----------------
        var anaProfile = ana.StudentProfile!;
        var lucasProfile = lucas.StudentProfile!;
        var biaProfile = beatriz.StudentProfile!;

        db.Applications.AddRange(
            new JobApplication
            {
                JobId = frontEnd.Id, StudentId = anaProfile.Id, Status = ApplicationStatus.UnderReview,
                CoverLetter = "Olá! Já desenvolvi projetos em HTML, CSS e JavaScript na escola e estou estudando React. " +
                              "Seria incrível aprender com a equipe da Nuvem Azul.",
                CreatedAt = DaysAgo(9), UpdatedAt = DaysAgo(4)
            },
            new JobApplication
            {
                JobId = curso.Id, StudentId = anaProfile.Id, Status = ApplicationStatus.Accepted,
                CompanyFeedback = "Inscrição confirmada! O link da primeira aula será enviado por e-mail.",
                CreatedAt = DaysAgo(4), UpdatedAt = DaysAgo(2)
            },
            new JobApplication
            {
                JobId = aprendizAdm.Id, StudentId = lucasProfile.Id, Status = ApplicationStatus.Pending,
                CoverLetter = "Tenho experiência com planilhas e atendimento no comércio da minha família.",
                CreatedAt = DaysAgo(6), UpdatedAt = DaysAgo(6)
            },
            new JobApplication
            {
                JobId = caixa.Id, StudentId = lucasProfile.Id, Status = ApplicationStatus.Rejected,
                CompanyFeedback = "Obrigado pelo interesse! Esta vaga exige 18 anos. Recomendamos a vaga de Jovem Aprendiz.",
                CreatedAt = DaysAgo(3), UpdatedAt = DaysAgo(1)
            },
            new JobApplication
            {
                JobId = marketing.Id, StudentId = biaProfile.Id, Status = ApplicationStatus.Accepted,
                CoverLetter = "Cuido das redes sociais do grêmio estudantil e tenho portfólio de posts no Canva.",
                CompanyFeedback = "Parabéns, Beatriz! Entraremos em contato para a integração.",
                CreatedAt = DaysAgo(30), UpdatedAt = DaysAgo(7)
            },
            new JobApplication
            {
                JobId = frontEnd.Id, StudentId = biaProfile.Id, Status = ApplicationStatus.Pending,
                CreatedAt = DaysAgo(2), UpdatedAt = DaysAgo(2)
            });

        db.SavedJobs.AddRange(
            new SavedJob { StudentId = anaProfile.Id, JobId = suporte.Id, CreatedAt = DaysAgo(7) },
            new SavedJob { StudentId = lucasProfile.Id, JobId = suporte.Id, CreatedAt = DaysAgo(5) },
            new SavedJob { StudentId = biaProfile.Id, JobId = curso.Id, CreatedAt = DaysAgo(1) });

        await db.SaveChangesAsync(ct);

        // ---------------- Notificações ----------------
        var applications = await db.Applications.AsNoTracking().ToListAsync(ct);
        int AppId(Job job, StudentProfile student) =>
            applications.First(a => a.JobId == job.Id && a.StudentId == student.Id).Id;

        db.Notifications.AddRange(
            new Notification
            {
                UserId = ana.Id, Type = NotificationType.ApplicationStatusChanged, Link = "/aluno/candidaturas",
                Title = "Sua candidatura está em análise",
                Message = $"Sua candidatura para \"{frontEnd.Title}\" está agora: Em análise.",
                CreatedAt = DaysAgo(4)
            },
            new Notification
            {
                UserId = ana.Id, Type = NotificationType.ApplicationStatusChanged, Link = "/aluno/candidaturas",
                Title = "Parabéns! Você foi aprovado(a)",
                Message = $"Sua candidatura para \"{curso.Title}\" está agora: Aceita. Mensagem da empresa: Inscrição confirmada!",
                CreatedAt = DaysAgo(2)
            },
            new Notification
            {
                UserId = lucas.Id, Type = NotificationType.ApplicationStatusChanged, Link = "/aluno/candidaturas",
                Title = "Atualização do processo seletivo",
                Message = $"Sua candidatura para \"{caixa.Title}\" está agora: Não selecionada.",
                CreatedAt = DaysAgo(1)
            },
            new Notification
            {
                UserId = nuvemAzul.Id, Type = NotificationType.ApplicationReceived,
                Link = $"/empresa/candidatos/{AppId(frontEnd, biaProfile)}",
                Title = "Nova candidatura recebida",
                Message = $"Beatriz Lima se candidatou à vaga \"{frontEnd.Title}\".",
                CreatedAt = DaysAgo(2)
            },
            new Notification
            {
                UserId = bomDia.Id, Type = NotificationType.ApplicationReceived,
                Link = $"/empresa/candidatos/{AppId(aprendizAdm, lucasProfile)}",
                Title = "Nova candidatura recebida",
                Message = $"Lucas Pereira se candidatou à vaga \"{aprendizAdm.Title}\".",
                CreatedAt = DaysAgo(6)
            });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seed concluído: 1 admin, 2 empresas, 3 estudantes, 6 vagas e 6 candidaturas. Senha de todas as contas: {Password}", DemoPassword);
    }
}
