using TeenWork.Domain.Enums;

namespace TeenWork.Domain.Constants;

/// <summary>
/// Nomes das roles usadas no JWT e nos atributos [Authorize(Roles = ...)].
/// </summary>
public static class Roles
{
    public const string Student = "STUDENT";
    public const string Company = "COMPANY";
    public const string Admin = "ADMIN";

    public static string FromUserType(UserType userType) => userType switch
    {
        UserType.Student => Student,
        UserType.Company => Company,
        UserType.Admin => Admin,
        _ => throw new ArgumentOutOfRangeException(nameof(userType), userType, "Tipo de usuário desconhecido.")
    };

    public static bool TryParse(string? value, out UserType userType)
    {
        switch (value?.Trim().ToUpperInvariant())
        {
            case Student:
                userType = UserType.Student;
                return true;
            case Company:
                userType = UserType.Company;
                return true;
            case Admin:
                userType = UserType.Admin;
                return true;
            default:
                userType = default;
                return false;
        }
    }
}
