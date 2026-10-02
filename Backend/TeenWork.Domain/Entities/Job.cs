using TeenWork.Domain.Common;
using TeenWork.Domain.Enums;

namespace TeenWork.Domain.Entities;

public class Job : BaseEntity
{
    public int CompanyId { get; set; }
    public CompanyProfile Company { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Requirements { get; set; }
    public string? Benefits { get; set; }
    public string Area { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public WorkModel WorkModel { get; set; }
    public JobType JobType { get; set; }
    /// <summary>Remuneração mensal (bolsa/salário). Nulo = não informado ou não remunerado.</summary>
    public decimal? Salary { get; set; }
    public string? Workload { get; set; }
    public int Vacancies { get; set; } = 1;
    public JobStatus Status { get; set; } = JobStatus.Active;
    public DateOnly? Deadline { get; set; }

    public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
    public ICollection<SavedJob> SavedBy { get; set; } = new List<SavedJob>();

    /// <summary>
    /// Uma vaga aceita candidaturas quando está ativa e o prazo (se houver) não passou.
    /// </summary>
    public bool IsOpenForApplications(DateOnly today) =>
        Status == JobStatus.Active && (Deadline is null || Deadline.Value >= today);
}
