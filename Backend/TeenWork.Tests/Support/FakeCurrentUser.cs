using TeenWork.Application.Common.Interfaces;

namespace TeenWork.Tests.Support;

/// <summary>Usuário logado controlável nos testes de serviço.</summary>
public sealed class FakeCurrentUser : ICurrentUser
{
    public int? UserId { get; private set; }
    public string? Role { get; private set; }
    public bool IsAuthenticated => UserId.HasValue;
    public bool IsInRole(string role) => IsAuthenticated && string.Equals(Role, role, StringComparison.Ordinal);

    public void SignIn(int userId, string role)
    {
        UserId = userId;
        Role = role;
    }

    public void SignOut()
    {
        UserId = null;
        Role = null;
    }
}
