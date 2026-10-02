namespace TeenWork.Application.Auth;

public sealed class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>STUDENT ou COMPANY.</summary>
    public string UserType { get; set; } = string.Empty;

    public string? City { get; set; }
    public string? State { get; set; }

    /// <summary>Somente estudantes.</summary>
    public string? School { get; set; }
    /// <summary>Somente estudantes.</summary>
    public string? Course { get; set; }

    /// <summary>Obrigatório para empresas.</summary>
    public string? CompanyName { get; set; }
    /// <summary>Opcional para empresas (com ou sem máscara).</summary>
    public string? Cnpj { get; set; }

    public bool AcceptTerms { get; set; }
}

public sealed class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public sealed class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>Dados públicos do usuário autenticado. Nunca expõe PasswordHash.</summary>
public sealed class UserDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    /// <summary>STUDENT, COMPANY ou ADMIN.</summary>
    public string Role { get; init; } = string.Empty;
    public string? ProfileImage { get; init; }
    /// <summary>Id do StudentProfile ou CompanyProfile, conforme o tipo.</summary>
    public int? ProfileId { get; init; }
    public string? CompanyName { get; init; }
    public string? CompanyLogo { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class AuthResponse
{
    public string Token { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public UserDto User { get; init; } = new();
}
