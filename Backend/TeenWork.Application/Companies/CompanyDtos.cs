using TeenWork.Application.Common.Models;

namespace TeenWork.Application.Companies;

public sealed class CompanyProfileDto
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string CompanyName { get; init; } = string.Empty;
    /// <summary>Nome do responsável pela conta.</summary>
    public string ResponsibleName { get; init; } = string.Empty;
    /// <summary>Visível apenas para a própria empresa e administradores.</summary>
    public string? Email { get; init; }
    public string? Description { get; init; }
    public string? Cnpj { get; init; }
    public string? Industry { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Website { get; init; }
    public string? Logo { get; init; }
    public int ActiveJobsCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class CompanySummaryDto
{
    public int Id { get; init; }
    public string CompanyName { get; init; } = string.Empty;
    public string? Industry { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Logo { get; init; }
    public string? Description { get; init; }
    public int ActiveJobsCount { get; init; }
}

public sealed class UpdateCompanyProfileRequest
{
    public string ResponsibleName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Cnpj { get; set; }
    public string? Industry { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Website { get; set; }
}

public sealed class CompanyQuery : PaginationQuery
{
    public string? Search { get; set; }
    public string? State { get; set; }
    /// <summary>Quando true, lista apenas empresas com vagas abertas.</summary>
    public bool OnlyHiring { get; set; }
}
