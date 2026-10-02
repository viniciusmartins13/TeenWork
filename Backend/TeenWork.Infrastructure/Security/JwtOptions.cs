namespace TeenWork.Infrastructure.Security;

/// <summary>
/// Configuração "Jwt" do appsettings. A chave NUNCA deve ficar versionada em produção:
/// use a variável de ambiente Jwt__Key (mínimo de 32 caracteres).
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "TeenWork.API";
    public string Audience { get; set; } = "TeenWork.Frontend";
    public string Key { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 480;
}
