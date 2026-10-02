using FluentValidation;
using TeenWork.Application.Common.Models;

namespace TeenWork.Application.Common.Validation;

public static class ValidationExtensions
{
    private const string EmailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";

    public static IRuleBuilderOptions<T, string> ValidEmail<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("O e-mail é obrigatório.")
            .MaximumLength(180).WithMessage("O e-mail deve ter no máximo {MaxLength} caracteres.")
            .Matches(EmailPattern).WithMessage("Informe um e-mail válido.");

    /// <summary>Mínimo de 8 caracteres com maiúscula, minúscula e número. Máximo de 72 (limite do BCrypt).</summary>
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("A senha é obrigatória.")
            .MinimumLength(8).WithMessage("A senha deve ter pelo menos {MinLength} caracteres.")
            .MaximumLength(72).WithMessage("A senha deve ter no máximo {MaxLength} caracteres.")
            .Matches("[A-Z]").WithMessage("A senha deve conter pelo menos uma letra maiúscula.")
            .Matches("[a-z]").WithMessage("A senha deve conter pelo menos uma letra minúscula.")
            .Matches("[0-9]").WithMessage("A senha deve conter pelo menos um número.");

    public static IRuleBuilderOptions<T, string?> OptionalState<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(state => string.IsNullOrWhiteSpace(state) || BrazilianStates.IsValid(state))
            .WithMessage("Informe uma UF válida (ex.: SP).");

    public static IRuleBuilderOptions<T, string?> OptionalUrl<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(url => string.IsNullOrWhiteSpace(url) || IsHttpUrl(url))
            .WithMessage("Informe um endereço válido começando com http:// ou https://.")
            .MaximumLength(300).WithMessage("O endereço deve ter no máximo {MaxLength} caracteres.");

    private static bool IsHttpUrl(string value) =>
        Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}

/// <summary>Regras de paginação reaproveitadas por todos os validadores de consulta.</summary>
public abstract class PaginationQueryValidator<T> : AbstractValidator<T> where T : PaginationQuery
{
    protected PaginationQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("A página deve ser maior ou igual a 1.");
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, PaginationQuery.MaxPageSize)
            .WithMessage($"O tamanho da página deve estar entre 1 e {PaginationQuery.MaxPageSize}.");
    }
}
