using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TeenWork.Infrastructure.Persistence;

namespace TeenWork.Tests.Integration;

/// <summary>
/// Sobe a API real em memória (TestServer), trocando o MySQL por EF Core InMemory.
/// </summary>
public sealed class TeenWorkApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"teenwork-api-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "chave-dos-testes-de-integracao-teenwork-2026",
            ["Jwt:Issuer"] = "TeenWork.Tests",
            ["Jwt:Audience"] = "TeenWork.Tests",
            ["ConnectionStrings:DefaultConnection"] = "Server=nao-usado;Database=nao-usado;",
            ["Database:ApplyMigrationsOnStartup"] = "false",
            ["Database:SeedDemoData"] = "false",
            ["RateLimiting:AuthPermitLimit"] = "1000",
            ["Swagger:Enabled"] = "false",
            ["Storage:UploadsPath"] = Path.Combine(Path.GetTempPath(), "teenwork-tests-uploads")
        }));

        builder.ConfigureServices(services =>
        {
            // Remove todas as configurações do provedor MySQL registradas para o AppDbContext
            // (inclui IDbContextOptionsConfiguration<AppDbContext> do EF Core 9).
            var mysqlDescriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                            || d.ServiceType == typeof(DbContextOptions)
                            || (d.ServiceType.IsGenericType && d.ServiceType.GetGenericArguments().Contains(typeof(AppDbContext))))
                .ToList();

            foreach (var descriptor in mysqlDescriptors)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_databaseName));
        });
    }
}
