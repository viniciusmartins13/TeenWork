namespace TeenWork.Application.Common.Validation;

/// <summary>Validação dos dígitos verificadores do CNPJ.</summary>
public static class CnpjValidator
{
    private static readonly int[] FirstMultipliers = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    private static readonly int[] SecondMultipliers = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var digits = new string(value.Where(char.IsDigit).ToArray());
        return digits.Length == 0 ? null : digits;
    }

    public static bool IsValid(string? value)
    {
        var digits = Normalize(value);
        if (digits is null || digits.Length != 14 || digits.Distinct().Count() == 1) return false;

        var firstDigit = CalculateDigit(digits, FirstMultipliers);
        if (digits[12] - '0' != firstDigit) return false;

        var secondDigit = CalculateDigit(digits, SecondMultipliers);
        return digits[13] - '0' == secondDigit;
    }

    private static int CalculateDigit(string digits, int[] multipliers)
    {
        var sum = 0;
        for (var i = 0; i < multipliers.Length; i++)
        {
            sum += (digits[i] - '0') * multipliers[i];
        }

        var remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}
