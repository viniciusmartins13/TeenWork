namespace TeenWork.Application.Common;

/// <summary>
/// As habilidades são persistidas como texto separado por ";" e expostas como lista na API.
/// </summary>
public static class SkillsParser
{
    public const char Separator = ';';
    public const int MaxSkills = 30;

    public static IReadOnlyList<string> Split(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(Separator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public static List<string> Normalize(IEnumerable<string>? skills) =>
        skills?
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxSkills)
            .ToList() ?? [];

    public static string? Join(IEnumerable<string>? skills)
    {
        var normalized = Normalize(skills);
        return normalized.Count == 0 ? null : string.Join(Separator, normalized);
    }
}
