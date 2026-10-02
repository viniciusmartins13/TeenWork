namespace TeenWork.Infrastructure.Persistence;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>Versão do servidor MySQL (evita conexão extra de auto-detecção na inicialização).</summary>
    public string MySqlVersion { get; set; } = "8.0.36";

    /// <summary>Aplica as migrations pendentes ao iniciar a API.</summary>
    public bool ApplyMigrationsOnStartup { get; set; } = true;

    /// <summary>Popula o banco vazio com dados de demonstração.</summary>
    public bool SeedDemoData { get; set; } = true;
}
