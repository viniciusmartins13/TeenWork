using FluentValidation;
using TeenWork.Application.Common.Validation;

namespace TeenWork.Application.Companies;

public sealed class UpdateCompanyProfileRequestValidator : AbstractValidator<UpdateCompanyProfileRequest>
{
    public UpdateCompanyProfileRequestValidator()
    {
        RuleFor(x => x.ResponsibleName)
            .NotEmpty().WithMessage("O nome do responsável é obrigatório.")
            .MaximumLength(120).WithMessage("O nome do responsável deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("O nome da empresa é obrigatório.")
            .MaximumLength(150).WithMessage("O nome da empresa deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Description).MaximumLength(3000).WithMessage("A descrição deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Cnpj)
            .Must(c => string.IsNullOrWhiteSpace(c) || CnpjValidator.IsValid(c))
            .WithMessage("Informe um CNPJ válido.");
        RuleFor(x => x.Industry).MaximumLength(80).WithMessage("O setor deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.City).MaximumLength(100).WithMessage("A cidade deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.State).OptionalState();
        RuleFor(x => x.Website).OptionalUrl();
    }
}

public sealed class CompanyQueryValidator : PaginationQueryValidator<CompanyQuery>
{
    public CompanyQueryValidator()
    {
        RuleFor(x => x.Search).MaximumLength(100).WithMessage("A pesquisa deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.State).OptionalState();
    }
}
