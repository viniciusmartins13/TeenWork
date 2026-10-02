using TeenWork.Application.Common.Models;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Jobs;

/// <summary>Card de vaga usado na busca, recomendações e vagas salvas.</summary>
public sealed class JobSummaryDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public int CompanyId { get; init; }
    public string CompanyName { get; init; } = string.Empty;
    public string? CompanyLogo { get; init; }
    public string Area { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public WorkModel WorkModel { get; init; }
    public JobType JobType { get; init; }
    public decimal? Salary { get; init; }
    public int Vacancies { get; init; }
    public JobStatus Status { get; init; }
    public DateOnly? Deadline { get; init; }
    public DateTime CreatedAt { get; init; }
    /// <summary>Preenchido apenas quando o usuário logado é estudante.</summary>
    public bool IsSaved { get; init; }
    /// <summary>Preenchido apenas quando o usuário logado é estudante (ignora candidaturas canceladas).</summary>
    public bool HasApplied { get; init; }
}

public sealed class JobCompanyDto
{
    public int Id { get; init; }
    public string CompanyName { get; init; } = string.Empty;
    public string? Logo { get; init; }
    public string? Industry { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Website { get; init; }
    public string? Description { get; init; }
}

public sealed class MyApplicationSnapshotDto
{
    public int Id { get; init; }
    public ApplicationStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class JobDetailsDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? Requirements { get; init; }
    public string? Benefits { get; init; }
    public string Area { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public WorkModel WorkModel { get; init; }
    public JobType JobType { get; init; }
    public decimal? Salary { get; init; }
    public string? Workload { get; init; }
    public int Vacancies { get; init; }
    public JobStatus Status { get; init; }
    public DateOnly? Deadline { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public bool IsOpenForApplications { get; init; }
    public JobCompanyDto Company { get; init; } = new();

    /// <summary>True quando a empresa logada é a dona da vaga.</summary>
    public bool IsOwner { get; init; }
    /// <summary>Total de candidaturas (exceto canceladas); visível apenas para a dona da vaga.</summary>
    public int? ApplicationsCount { get; init; }

    public bool IsSaved { get; init; }
    /// <summary>Candidatura ativa do estudante logado nesta vaga, se houver.</summary>
    public MyApplicationSnapshotDto? MyApplication { get; init; }
}

/// <summary>Vaga na visão de gestão da empresa.</summary>
public sealed class CompanyJobDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Area { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public WorkModel WorkModel { get; init; }
    public JobType JobType { get; init; }
    public decimal? Salary { get; init; }
    public int Vacancies { get; init; }
    public JobStatus Status { get; init; }
    public DateOnly? Deadline { get; init; }
    public bool IsExpired { get; init; }
    public int ApplicationsCount { get; init; }
    public int PendingApplicationsCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class JobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public string Area { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public WorkModel WorkModel { get; set; }
    public JobType JobType { get; set; }
    public decimal? Salary { get; set; }
    public string? Workload { get; set; }
    public int Vacancies { get; set; } = 1;
    public DateOnly? Deadline { get; set; }
}

public sealed class UpdateJobStatusRequest
{
    public JobStatus Status { get; set; }
}

public static class JobSortOptions
{
    public const string Recent = "recent";
    public const string Oldest = "oldest";
    public const string SalaryDesc = "salary_desc";
    public const string SalaryAsc = "salary_asc";
    public const string Deadline = "deadline";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { Recent, Oldest, SalaryDesc, SalaryAsc, Deadline };
}

/// <summary>Filtros de GET /api/jobs.</summary>
public sealed class JobQuery : PaginationQuery
{
    /// <summary>Busca em título, área, descrição e nome da empresa.</summary>
    public string? Search { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public WorkModel? WorkModel { get; set; }
    public JobType? JobType { get; set; }
    public string? Area { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public int? CompanyId { get; set; }
    /// <summary>recent (padrão), oldest, salary_desc, salary_asc, deadline.</summary>
    public string? Sort { get; set; }
}

/// <summary>Filtros de GET /api/companies/me/jobs.</summary>
public sealed class CompanyJobQuery : PaginationQuery
{
    public string? Search { get; set; }
    public JobStatus? Status { get; set; }
}

public sealed class JobLocationDto
{
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public int JobsCount { get; init; }
}

/// <summary>Valores reais disponíveis para os filtros da busca (somente vagas abertas).</summary>
public sealed class JobFilterOptionsDto
{
    public IReadOnlyList<string> Areas { get; init; } = [];
    public IReadOnlyList<JobLocationDto> Locations { get; init; } = [];
    public decimal? MaxSalary { get; init; }
}
