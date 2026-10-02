using TeenWork.Domain.Common;

namespace TeenWork.Domain.Entities;

public class StudentProfile : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string? School { get; set; }
    public string? Course { get; set; }
    /// <summary>Série atual, ex.: "2º ano".</summary>
    public string? SchoolYear { get; set; }
    public int? GraduationYear { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Bio { get; set; }
    /// <summary>Habilidades separadas por ";" (ver SkillsParser).</summary>
    public string? Skills { get; set; }
    public string? PortfolioUrl { get; set; }

    public ICollection<StudentExperience> Experiences { get; set; } = new List<StudentExperience>();
    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    public ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
}
