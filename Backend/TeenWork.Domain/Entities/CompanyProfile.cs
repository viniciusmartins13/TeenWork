using TeenWork.Domain.Common;

namespace TeenWork.Domain.Entities;

public class CompanyProfile : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string CompanyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>Somente dígitos.</summary>
    public string? Cnpj { get; set; }
    public string? Industry { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Website { get; set; }
    public string? Logo { get; set; }

    public ICollection<Job> Jobs { get; set; } = new List<Job>();
}
