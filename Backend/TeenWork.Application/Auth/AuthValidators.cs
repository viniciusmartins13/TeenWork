using FluentValidation;
using TeenWork.Application.Common.Validation;
using TeenWork.Domain.Constants;

namespace TeenWork.Application.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .Must(n => n is not null && n.Trim().Length >= 3).WithMessage("O nome deve ter pelo menos 3 caracteres.")
            .MaximumLength(120).WithMessage("O nome deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.Email).ValidEmail();
        RuleFor(x => x.Password).StrongPassword();

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("As senhas não conferem.");

        RuleFor(x => x.UserType)
            .Must(t => t?.Trim().ToUpperInvariant() is Roles.Student or Roles.Company)
            .WithMessage("Escolha o tipo de conta: STUDENT (estudante) ou COMPANY (empresa).");

        RuleFor(x => x.City).MaximumLength(100).WithMessage("A cidade deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.State).OptionalState();
        RuleFor(x => x.School).MaximumLength(150).WithMessage("A escola deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Course).MaximumLength(120).WithMessage("O curso deve ter no máximo {MaxLength} caracteres.");

        When(x => x.UserType?.Trim().ToUpperInvariant() == Roles.Company, () =>
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().WithMessage("O nome da empresa é obrigatório.")
                .MaximumLength(150).WithMessage("O nome da empresa deve ter no máximo {MaxLength} caracteres.");

            RuleFor(x => x.Cnpj)
                .Must(c => string.IsNullOrWhiteSpace(c) || CnpjValidator.IsValid(c))
                .WithMessage("Informe um CNPJ válido.");
        });

        RuleFor(x => x.AcceptTerms)
            .Equal(true).WithMessage("Você precisa aceitar os termos de uso e a política de privacidade.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Informe seu e-mail.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Informe sua senha.");
    }
}

public sealed class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).ValidEmail();
    }
}

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email).ValidEmail();
        RuleFor(x => x.Token).NotEmpty().WithMessage("O link de redefinição é inválido.");
        RuleFor(x => x.NewPassword).StrongPassword();
        RuleFor(x => x.ConfirmPassword).Equal(x => x.NewPassword).WithMessage("As senhas não conferem.");
    }
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Informe sua senha atual.");
        RuleFor(x => x.NewPassword)
            .StrongPassword()
            .NotEqual(x => x.CurrentPassword).WithMessage("A nova senha deve ser diferente da atual.");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.NewPassword).WithMessage("As senhas não conferem.");
    }
}
