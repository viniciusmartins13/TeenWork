using TeenWork.Domain.Common;
using TeenWork.Domain.Enums;

namespace TeenWork.Domain.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    /// <summary>Rota do frontend relacionada à notificação.</summary>
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
