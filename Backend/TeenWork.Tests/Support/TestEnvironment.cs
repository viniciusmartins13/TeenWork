using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TeenWork.Application.Auth;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.JobApplications;
using TeenWork.Application.Jobs;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Enums;
using TeenWork.Infrastructure.Email;
using TeenWork.Infrastructure.Persistence;
using TeenWork.Infrastructure.Security;

namespace TeenWork.Tests.Support;

/// <summary>
/// Monta os serviços reais da camada Application sobre um banco EF Core InMemory isolado.
/// </summary>
public sealed class TestEnvironment : IDisposable
{
    public const string Password = "Senha@123";

    public TestEnvironment()
    {
        Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"teenwork-unit-{Guid.NewGuid():N}")
            .Options);

        Clock = TimeProvider.System;
        CurrentUser = new FakeCurrentUser();
        Hasher = new BcryptPasswordHasher();
        Tokens = new JwtTokenService(Options.Create(new JwtOptions
        {
            Key = "chave-de-teste-teenwork-com-mais-de-32-caracteres",
            Issuer = "TeenWork.Tests",
            Audience = "TeenWork.Tests",
            ExpirationMinutes = 60
        }), Clock);

        Auth = new AuthService(Db, Hasher, Tokens, CurrentUser,
            new EmailSender(Options.Create(new EmailOptions()), NullLogger<EmailSender>.Instance),
            Options.Create(new FrontendOptions()), Clock);
        Jobs = new JobService(Db, CurrentUser, Clock);
        Applications = new JobApplicationService(Db, CurrentUser, Clock);
    }

    public AppDbContext Db { get; }
    public TimeProvider Clock { get; }
    public FakeCurrentUser CurrentUser { get; }
    public IPasswordHasher Hasher { get; }
    public ITokenService Tokens { get; }
    public AuthService Auth { get; }
    public JobService Jobs { get; }
    public JobApplicationService Applications { get; }

    public async Task<AuthResponse> RegisterStudentAsync(string email = "aluno@teste.com", string name = "Aluno Teste")
    {
        var response = await Auth.RegisterAsync(new RegisterRequest
        {
            Name = name,
            Email = email,
            Password = Password,
            ConfirmPassword = Password,
            UserType = Roles.Student,
            City = "Campinas",
            State = "SP",
            AcceptTerms = true
        });
        return response;
    }

    public async Task<AuthResponse> RegisterCompanyAsync(string email = "empresa@teste.com", string companyName = "Empresa Teste")
    {
        return await Auth.RegisterAsync(new RegisterRequest
        {
            Name = "Responsável RH",
            Email = email,
            Password = Password,
            ConfirmPassword = Password,
            UserType = Roles.Company,
            CompanyName = companyName,
            AcceptTerms = true
        });
    }

    public void SignInAs(AuthResponse auth) => CurrentUser.SignIn(auth.User.Id, auth.User.Role);

    public static JobRequest SampleJob(string title = "Estágio em Desenvolvimento Web") => new()
    {
        Title = title,
        Description = "Participar do desenvolvimento de sistemas web com mentoria de um desenvolvedor sênior.",
        Requirements = "Cursando técnico em informática",
        Area = "Tecnologia",
        City = "Campinas",
        State = "SP",
        WorkModel = WorkModel.Hybrid,
        JobType = JobType.Internship,
        Salary = 1200m,
        Vacancies = 2,
        Deadline = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(30)
    };

    /// <summary>Cria empresa + vaga e deixa a empresa logada.</summary>
    public async Task<(AuthResponse Company, JobDetailsDto Job)> CreateCompanyWithJobAsync(string email = "empresa@teste.com")
    {
        var company = await RegisterCompanyAsync(email);
        SignInAs(company);
        var job = await Jobs.CreateAsync(SampleJob());
        return (company, job);
    }

    public async Task<MyApplicationDto> ApplyAsStudentAsync(AuthResponse student, int jobId, string? coverLetter = null)
    {
        SignInAs(student);
        return await Applications.ApplyAsync(jobId, new ApplyRequest { CoverLetter = coverLetter });
    }

    public void Dispose() => Db.Dispose();
}
