using TeenWork.Domain.Common;

namespace TeenWork.Domain.Entities;

/// <summary>Vaga favoritada por um estudante.</summary>
public class SavedJob : BaseEntity
{
    public int StudentId { get; set; }
    public StudentProfile Student { get; set; } = null!;

    public int JobId { get; set; }
    public Job Job { get; set; } = null!;
}
