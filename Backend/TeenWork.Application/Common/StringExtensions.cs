namespace TeenWork.Application.Common;

public static class StringExtensions
{
    public static string? TrimToNull(this string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static string? ToUpperTrimmed(this string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();
}
