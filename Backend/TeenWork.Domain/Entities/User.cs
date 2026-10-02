using TeenWork.Domain.Common;
using TeenWork.Domain.Enums;

namespace TeenWork.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserType UserType { get; set; }
    public string? ProfileImage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }

    /// <summary>Hash SHA-256 do token de redefinição de senha (o token em si nunca é salvo).</summary>
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    public StudentProfile? StudentProfile { get; set; }
    public CompanyProfile? CompanyProfile { get; set; }
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
