using TeenWork.Domain.Common;
using TeenWork.Domain.Enums;

namespace TeenWork.Domain.Entities;

public class StudentExperience : BaseEntity
{
    public int StudentId { get; set; }
    public StudentProfile Student { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public ExperienceType Type { get; set; }
    public DateOnly StartDate { get; set; }
    /// <summary>Nulo quando a experiência ainda está em andamento.</summary>
    public DateOnly? EndDate { get; set; }
    public string? Description { get; set; }
}
