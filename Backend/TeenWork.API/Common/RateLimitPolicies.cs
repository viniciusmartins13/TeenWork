namespace TeenWork.API.Common;

public static class RateLimitPolicies
{
    /// <summary>Limita tentativas de login/cadastro/recuperação de senha por IP.</summary>
    public const string Auth = "auth";
}
