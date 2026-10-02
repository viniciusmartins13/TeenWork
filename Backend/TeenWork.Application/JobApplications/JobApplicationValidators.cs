using FluentValidation;
using TeenWork.Application.Common.Validation;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.JobApplications;

public sealed class ApplyRequestValidator : AbstractValidator<ApplyRequest>
{
    public ApplyRequestValidator()
    {
        RuleFor(x => x.CoverLetter)
            .MaximumLength(2000).WithMessage("A mensagem deve ter no máximo {MaxLength} caracteres.");
    }
}

public sealed class UpdateApplicationStatusRequestValidator : AbstractValidator<UpdateApplicationStatusRequest>
{
    public UpdateApplicationStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status inválido.")
            .NotEqual(ApplicationStatus.Cancelled).WithMessage("Somente o candidato pode cancelar a própria candidatura.");
        RuleFor(x => x.Feedback)
            .MaximumLength(1000).WithMessage("O feedback deve ter no máximo {MaxLength} caracteres.");
    }
}

public sealed class MyApplicationsQueryValidator : PaginationQueryValidator<MyApplicationsQuery>
{
    public MyApplicationsQueryValidator()
    {
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("Status inválido.");
    }
}

public sealed class ReceivedApplicationsQueryValidator : PaginationQueryValidator<ReceivedApplicationsQuery>
{
    public ReceivedApplicationsQueryValidator()
    {
        RuleFor(x => x.JobId).GreaterThan(0).When(x => x.JobId.HasValue).WithMessage("Vaga inválida.");
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("Status inválido.");
        RuleFor(x => x.Search).MaximumLength(100).WithMessage("A pesquisa deve ter no máximo {MaxLength} caracteres.");
    }
}
