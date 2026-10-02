using TeenWork.Application.Common.Exceptions;

namespace TeenWork.Application.Common.Interfaces;

/// <summary>
/// Usuário autenticado, sempre obtido a partir do JWT — nunca de IDs enviados pelo cliente.
/// </summary>
public interface ICurrentUser
{
    int? UserId { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}

public static class CurrentUserExtensions
{
    public static int GetRequiredUserId(this ICurrentUser currentUser) =>
        currentUser.UserId ?? throw new UnauthorizedException("Sessão inválida. Faça login novamente.");
}
