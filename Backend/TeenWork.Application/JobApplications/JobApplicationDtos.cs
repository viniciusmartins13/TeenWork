using TeenWork.Application.Common.Models;
using TeenWork.Application.Students;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.JobApplications;

public sealed class ApplyRequest
{
    /// <summary>Mensagem opcional de apresentação para a empresa.</summary>
    public string? CoverLetter { get; set; }
}

public sealed class UpdateApplicationStatusRequest
{
    /// <summary>UnderReview, Accepted ou Rejected (Pending também é aceito para desfazer uma análise).</summary>
    public ApplicationStatus Status { get; set; }
    /// <summary>Mensagem opcional enviada ao candidato.</summary>
    public string? Feedback { get; set; }
}

/// <summary>Candidatura na visão do estudante.</summary>
public sealed class MyApplicationDto
{
    public int Id { get; init; }
    public int JobId { get; init; }
    public string JobTitle { get; init; } = string.Empty;
    public int CompanyId { get; init; }
    public string CompanyName { get; init; } = string.Empty;
    public string? CompanyLogo { get; init; }
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public WorkModel WorkModel { get; init; }
    public JobType JobType { get; init; }
    public JobStatus JobStatus { get; init; }
    public ApplicationStatus Status { get; init; }
    public string? CoverLetter { get; init; }
    public string? CompanyFeedback { get; init; }
    public bool CanCancel { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

/// <summary>Candidatura recebida, na visão da empresa.</summary>
public sealed class ReceivedApplicationDto
{
    public int Id { get; init; }
    public int JobId { get; init; }
    public string JobTitle { get; init; } = string.Empty;
    public int StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public string? StudentPhoto { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? School { get; init; }
    public string? Course { get; init; }
    public string? SchoolYear { get; init; }
    public IReadOnlyList<string> Skills { get; init; } = [];
    public ApplicationStatus Status { get; init; }
    public string? CoverLetter { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class ApplicationJobDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public int CompanyId { get; init; }
    public string CompanyName { get; init; } = string.Empty;
    public string? CompanyLogo { get; init; }
    public JobStatus Status { get; init; }
}

/// <summary>Detalhe completo de uma candidatura (aluno dono ou empresa dona da vaga).</summary>
public sealed class ApplicationDetailsDto
{
    public int Id { get; init; }
    public ApplicationStatus Status { get; init; }
    public string? CoverLetter { get; init; }
    public string? CompanyFeedback { get; init; }
    public bool CanCancel { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public ApplicationJobDto Job { get; init; } = new();
    public StudentProfileDto Student { get; init; } = new();
}

public sealed class MyApplicationsQuery : PaginationQuery
{
    public ApplicationStatus? Status { get; set; }
}

public sealed class ReceivedApplicationsQuery : PaginationQuery
{
    public int? JobId { get; set; }
    public ApplicationStatus? Status { get; set; }
    /// <summary>Busca por nome do candidato, escola, curso ou habilidade.</summary>
    public string? Search { get; set; }
}
