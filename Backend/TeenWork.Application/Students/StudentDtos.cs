using TeenWork.Domain.Enums;

namespace TeenWork.Application.Students;

public sealed class ExperienceDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Organization { get; init; } = string.Empty;
    public ExperienceType Type { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public bool IsCurrent { get; init; }
    public string? Description { get; init; }
}

/// <summary>Perfil do estudante (visto pelo próprio aluno ou por empresas às quais ele se candidatou).</summary>
public sealed class StudentProfileDto
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? ProfileImage { get; init; }
    public string? School { get; init; }
    public string? Course { get; init; }
    public string? SchoolYear { get; init; }
    public int? GraduationYear { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Bio { get; init; }
    public IReadOnlyList<string> Skills { get; init; } = [];
    public string? PortfolioUrl { get; init; }
    public IReadOnlyList<ExperienceDto> Experiences { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class UpdateStudentProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? School { get; set; }
    public string? Course { get; set; }
    public string? SchoolYear { get; set; }
    public int? GraduationYear { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Bio { get; set; }
    public List<string>? Skills { get; set; }
    public string? PortfolioUrl { get; set; }
}

public sealed class ExperienceRequest
{
    public string Title { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public ExperienceType Type { get; set; } = ExperienceType.Job;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}
