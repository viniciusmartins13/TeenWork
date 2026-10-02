using TeenWork.Domain.Entities;

namespace TeenWork.Application.Common.Interfaces;

public sealed record TokenResult(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    TokenResult CreateToken(User user);
}
