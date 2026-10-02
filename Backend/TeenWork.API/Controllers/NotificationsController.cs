using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Notifications;

namespace TeenWork.API.Controllers;

/// <summary>Notificações do usuário logado.</summary>
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(INotificationService notificationService) : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromQuery] NotificationQuery query, CancellationToken ct) =>
        OkData(await notificationService.GetMyNotificationsAsync(query, ct));

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<UnreadCountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct) =>
        OkData(await notificationService.GetUnreadCountAsync(ct));

    [HttpPatch("{id:int}/read")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct)
    {
        await notificationService.MarkAsReadAsync(id, ct);
        return OkMessage("Notificação marcada como lida.");
    }

    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var count = await notificationService.MarkAllAsReadAsync(ct);
        return OkMessage(count == 0 ? "Nenhuma notificação pendente." : $"{count} notificação(ões) marcada(s) como lida(s).");
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await notificationService.DeleteAsync(id, ct);
        return NoContent();
    }
}
