using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Common.Validation;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Notifications;

public sealed class NotificationDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public NotificationType Type { get; init; }
    public string? Link { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class UnreadCountDto
{
    public int Count { get; init; }
}

public sealed class NotificationQuery : PaginationQuery
{
    public bool UnreadOnly { get; set; }
}

public sealed class NotificationQueryValidator : PaginationQueryValidator<NotificationQuery>;

public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(NotificationQuery query, CancellationToken ct = default);
    Task<UnreadCountDto> GetUnreadCountAsync(CancellationToken ct = default);
    Task MarkAsReadAsync(int id, CancellationToken ct = default);
    Task<int> MarkAllAsReadAsync(CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public sealed class NotificationService(IAppDbContext db, ICurrentUser currentUser, TimeProvider clock) : INotificationService
{
    public async Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(NotificationQuery query, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var notifications = db.Notifications.AsNoTracking().Where(n => n.UserId == userId);

        if (query.UnreadOnly)
        {
            notifications = notifications.Where(n => !n.IsRead);
        }

        return await notifications
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                Link = n.Link,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToPagedResultAsync(query, ct);
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var count = await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);
        return new UnreadCountDto { Count = count };
    }

    public async Task MarkAsReadAsync(int id, CancellationToken ct = default)
    {
        var notification = await GetOwnedAsync(id, ct);
        if (notification.IsRead) return;

        notification.IsRead = true;
        notification.ReadAt = AppTime.UtcNow(clock);
        await db.SaveChangesAsync(ct);
    }

    public async Task<int> MarkAllAsReadAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var unread = await db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync(ct);
        var now = AppTime.UtcNow(clock);

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
        }

        await db.SaveChangesAsync(ct);
        return unread.Count;
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var notification = await GetOwnedAsync(id, ct);
        db.Notifications.Remove(notification);
        await db.SaveChangesAsync(ct);
    }

    private async Task<Domain.Entities.Notification> GetOwnedAsync(int id, CancellationToken ct)
    {
        var userId = currentUser.GetRequiredUserId();
        var notification = await db.Notifications.FirstOrDefaultAsync(n => n.Id == id, ct)
            ?? throw new NotFoundException("Notificação não encontrada.");

        if (notification.UserId != userId)
        {
            throw new ForbiddenException("Esta notificação pertence a outro usuário.");
        }

        return notification;
    }
}
