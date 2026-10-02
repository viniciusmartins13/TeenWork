using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Infrastructure.Persistence.Seed;

namespace TeenWork.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    private const int MaxAttempts = 10;
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(3);

    /// <summary>
    /// Aplica migrations e seed. Tenta novamente algumas vezes porque, no Docker,
    /// o MySQL pode demorar alguns segundos para aceitar conexões.
    /// </summary>
    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;
        var options = provider.GetRequiredService<IOptions<DatabaseOptions>>().Value;
        var logger = provider.GetRequiredService<ILoggerFactory>().CreateLogger("TeenWork.Database");
        var db = provider.GetRequiredService<AppDbContext>();

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                if (db.Database.IsRelational())
                {
                    if (options.ApplyMigrationsOnStartup)
                    {
                        await db.Database.MigrateAsync(ct);
                        logger.LogInformation("Migrations aplicadas com sucesso.");
                    }
                }
                else
                {
                    await db.Database.EnsureCreatedAsync(ct);
                }

                break;
            }
            catch (Exception ex) when (attempt < MaxAttempts && db.Database.IsRelational() && ex is not OperationCanceledException)
            {
                logger.LogWarning("Banco de dados indisponível (tentativa {Attempt}/{Max}): {Message}", attempt, MaxAttempts, ex.Message);
                await Task.Delay(RetryDelay, ct);
            }
        }

        if (options.SeedDemoData)
        {
            var hasher = provider.GetRequiredService<IPasswordHasher>();
            await DbSeeder.SeedAsync(db, hasher, logger, ct);
        }
    }
}
