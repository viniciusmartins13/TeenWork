using FluentValidation;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Validation;

namespace TeenWork.Application.Jobs;

public sealed class JobRequestValidator : AbstractValidator<JobRequest>
{
    public JobRequestValidator(TimeProvider clock)
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("A vaga precisa ter um título.")
            .Must(t => t is not null && t.Trim().Length >= 5).WithMessage("O título deve ter pelo menos 5 caracteres.")
            .MaximumLength(150).WithMessage("O título deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("A descrição é obrigatória.")
            .Must(d => d is not null && d.Trim().Length >= 30).WithMessage("Descreva a vaga com pelo menos 30 caracteres.")
            .MaximumLength(4000).WithMessage("A descrição deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.Requirements).MaximumLength(3000).WithMessage("Os requisitos devem ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Benefits).MaximumLength(2000).WithMessage("Os benefícios devem ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.Area)
            .NotEmpty().WithMessage("Informe a área da vaga (ex.: Tecnologia, Administração).")
            .MaximumLength(80).WithMessage("A área deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Informe a cidade da vaga.")
            .MaximumLength(100).WithMessage("A cidade deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("Informe a UF da vaga.")
            .Must(BrazilianStates.IsValid).WithMessage("Informe uma UF válida (ex.: SP).");

        RuleFor(x => x.WorkModel).IsInEnum().WithMessage("Modalidade inválida.");
        RuleFor(x => x.JobType).IsInEnum().WithMessage("Tipo de vaga inválido.");

        RuleFor(x => x.Salary)
            .InclusiveBetween(0m, 100_000m).When(x => x.Salary.HasValue)
            .WithMessage("Informe um valor de remuneração entre R$ 0 e R$ 100.000.");

        RuleFor(x => x.Workload).MaximumLength(60).WithMessage("A carga horária deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.Vacancies)
            .InclusiveBetween(1, 100).WithMessage("O número de vagas deve estar entre 1 e 100.");

        RuleFor(x => x.Deadline)
            .Must(d => d is null || d.Value >= AppTime.Today(clock))
            .WithMessage("O prazo de inscrição não pode estar no passado.");
    }
}

public sealed class UpdateJobStatusRequestValidator : AbstractValidator<UpdateJobStatusRequest>
{
    public UpdateJobStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum().WithMessage("Status inválido. Use Active, Inactive ou Closed.");
    }
}

public sealed class JobQueryValidator : PaginationQueryValidator<JobQuery>
{
    public JobQueryValidator()
    {
        RuleFor(x => x.Search).MaximumLength(100).WithMessage("A pesquisa deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.City).MaximumLength(100);
        RuleFor(x => x.Area).MaximumLength(80);
        RuleFor(x => x.State).OptionalState();
        RuleFor(x => x.WorkModel).IsInEnum().When(x => x.WorkModel.HasValue).WithMessage("Modalidade inválida.");
        RuleFor(x => x.JobType).IsInEnum().When(x => x.JobType.HasValue).WithMessage("Tipo de vaga inválido.");
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0m).When(x => x.MinSalary.HasValue)
            .WithMessage("O salário mínimo não pode ser negativo.");
        RuleFor(x => x.MaxSalary)
            .GreaterThanOrEqualTo(x => x.MinSalary!.Value)
            .When(x => x.MaxSalary.HasValue && x.MinSalary.HasValue)
            .WithMessage("O salário máximo deve ser maior ou igual ao mínimo.");
        RuleFor(x => x.CompanyId).GreaterThan(0).When(x => x.CompanyId.HasValue).WithMessage("Empresa inválida.");
        RuleFor(x => x.Sort)
            .Must(s => string.IsNullOrWhiteSpace(s) || JobSortOptions.All.Contains(s.Trim()))
            .WithMessage("Ordenação inválida. Use: recent, oldest, salary_desc, salary_asc ou deadline.");
    }
}

public sealed class CompanyJobQueryValidator : PaginationQueryValidator<CompanyJobQuery>
{
    public CompanyJobQueryValidator()
    {
        RuleFor(x => x.Search).MaximumLength(100);
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("Status inválido.");
    }
}
