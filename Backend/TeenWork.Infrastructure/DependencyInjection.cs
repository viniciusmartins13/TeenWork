using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Infrastructure.Email;
using TeenWork.Infrastructure.Persistence;
using TeenWork.Infrastructure.Security;
using TeenWork.Infrastructure.Storage;

namespace TeenWork.Infrastructure;

public static class DependencyInjection
{
    public const string ConnectionStringName = "DefaultConnection";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddOptions<DatabaseOptions>().BindConfiguration(DatabaseOptions.SectionName);
        services.AddOptions<StorageOptions>().BindConfiguration(StorageOptions.SectionName);
        services.AddOptions<EmailOptions>().BindConfiguration(EmailOptions.SectionName);
        services.AddOptions<FrontendOptions>().BindConfiguration(FrontendOptions.SectionName);

        services.AddOptions<JwtOptions>()
            .BindConfiguration(JwtOptions.SectionName)
            .Validate(o => !string.IsNullOrWhiteSpace(o.Key) && Encoding.UTF8.GetByteCount(o.Key) >= 32,
                "Configure Jwt:Key (variável de ambiente Jwt__Key) com pelo menos 32 caracteres.")
            .Validate(o => o.ExpirationMinutes is > 0 and <= 10080,
                "Jwt:ExpirationMinutes deve estar entre 1 e 10080.")
            .ValidateOnStart();

        // A connection string é lida sob demanda (não no registro) para permitir sobrescrita por
        // variáveis de ambiente (ConnectionStrings__DefaultConnection) e pelos testes de integração.
        services.AddDbContext<AppDbContext>((provider, options) =>
        {
            var configuration = provider.GetRequiredService<IConfiguration>();
            var database = provider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
            var connectionString = configuration.GetConnectionString(ConnectionStringName);

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    $"Connection string '{ConnectionStringName}' não configurada. " +
                    "Defina ConnectionStrings:DefaultConnection no appsettings ou a variável ConnectionStrings__DefaultConnection.");
            }

            options.UseMySql(
                connectionString,
                new MySqlServerVersion(Version.Parse(database.MySqlVersion)),
                mysql => mysql.EnableRetryOnFailure(maxRetryCount: 3));

            // A migration inicial foi escrita à mão junto com o snapshot; esta verificação do EF 9
            // é desativada para que pequenas diferenças de anotação não impeçam a inicialização.
            options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        });

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddSingleton<IEmailSender, EmailSender>();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((bearer, jwtOptions) =>
            {
                var jwt = jwtOptions.Value;
                bearer.MapInboundClaims = false;
                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = JwtTokenService.CreateSigningKey(jwt.Key),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = AppClaimTypes.Name,
                    RoleClaimType = AppClaimTypes.Role
                };
            });

        return services;
    }
}
