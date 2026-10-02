using TeenWork.Domain.Common;
using TeenWork.Domain.Enums;

namespace TeenWork.Domain.Entities;

/// <summary>
/// Candidatura de um estudante a uma vaga (tabela "Applications").
/// Relacionamento N:N entre StudentProfile e Job.
/// </summary>
public class JobApplication : BaseEntity
{
    public int JobId { get; set; }
    public Job Job { get; set; } = null!;

    public int StudentId { get; set; }
    public StudentProfile Student { get; set; } = null!;

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
    public string? CoverLetter { get; set; }
    /// <summary>Mensagem opcional da empresa ao alterar o status.</summary>
    public string? CompanyFeedback { get; set; }

    public bool CanBeCancelledByStudent =>
        Status is ApplicationStatus.Pending or ApplicationStatus.UnderReview;
}
