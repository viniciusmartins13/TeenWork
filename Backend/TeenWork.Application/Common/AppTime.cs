namespace TeenWork.Application.Common;

/// <summary>
/// Centraliza o cálculo de "hoje" no fuso de Brasília (UTC-3, sem horário de verão desde 2019),
/// usado para prazos de vagas. Datas/horas de auditoria continuam em UTC.
/// </summary>
public static class AppTime
{
    private static readonly TimeSpan BrasiliaOffset = TimeSpan.FromHours(-3);

    public static DateTime UtcNow(TimeProvider clock) => clock.GetUtcNow().UtcDateTime;

    public static DateOnly Today(TimeProvider clock) =>
        DateOnly.FromDateTime(clock.GetUtcNow().ToOffset(BrasiliaOffset).DateTime);
}
