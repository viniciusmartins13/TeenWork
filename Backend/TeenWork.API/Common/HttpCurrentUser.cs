using System.Security.Claims;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Interfaces;

namespace TeenWork.API.Common;

/// <summary>Lê o usuário autenticado exclusivamente das claims do JWT validado.</summary>
public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public int? UserId =>
        IsAuthenticated && int.TryParse(Principal!.FindFirst(AppClaimTypes.UserId)?.Value, out var id) ? id : null;

    public string? Role => IsAuthenticated ? Principal!.FindFirst(AppClaimTypes.Role)?.Value : null;

    public bool IsInRole(string role) => IsAuthenticated && Principal!.IsInRole(role);
}
