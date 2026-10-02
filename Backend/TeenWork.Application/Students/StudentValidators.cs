using FluentValidation;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Validation;

namespace TeenWork.Application.Students;

public sealed class UpdateStudentProfileRequestValidator : AbstractValidator<UpdateStudentProfileRequest>
{
    public UpdateStudentProfileRequestValidator(TimeProvider clock)
    {
        var currentYear = AppTime.Today(clock).Year;

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .Must(n => n is not null && n.Trim().Length >= 3).WithMessage("O nome deve ter pelo menos 3 caracteres.")
            .MaximumLength(120).WithMessage("O nome deve ter no máximo {MaxLength} caracteres.");

        RuleFor(x => x.School).MaximumLength(150).WithMessage("A escola deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Course).MaximumLength(120).WithMessage("O curso deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.SchoolYear).MaximumLength(40).WithMessage("A série deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.GraduationYear)
            .InclusiveBetween(currentYear - 10, currentYear + 8)
            .When(x => x.GraduationYear.HasValue)
            .WithMessage("Informe um ano de conclusão válido.");
        RuleFor(x => x.City).MaximumLength(100).WithMessage("A cidade deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.State).OptionalState();
        RuleFor(x => x.Bio).MaximumLength(1500).WithMessage("O texto \"Sobre\" deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.PortfolioUrl).OptionalUrl();

        RuleFor(x => x.Skills)
            .Must(s => s is null || s.Count <= SkillsParser.MaxSkills)
            .WithMessage($"Informe no máximo {SkillsParser.MaxSkills} habilidades.");
        RuleForEach(x => x.Skills)
            .Must(s => !string.IsNullOrWhiteSpace(s) && s.Trim().Length <= 40 && !s.Contains(SkillsParser.Separator))
            .WithMessage("Cada habilidade deve ter entre 1 e 40 caracteres e não pode conter \";\".");
    }
}

public sealed class ExperienceRequestValidator : AbstractValidator<ExperienceRequest>
{
    public ExperienceRequestValidator(TimeProvider clock)
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("O cargo/título é obrigatório.")
            .MaximumLength(120).WithMessage("O título deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Organization)
            .NotEmpty().WithMessage("Informe a empresa, escola ou organização.")
            .MaximumLength(150).WithMessage("A organização deve ter no máximo {MaxLength} caracteres.");
        RuleFor(x => x.Type).IsInEnum().WithMessage("Tipo de experiência inválido.");
        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Informe a data de início.")
            .Must(d => d <= AppTime.Today(clock)).WithMessage("A data de início não pode estar no futuro.");
        RuleFor(x => x.EndDate)
            .Must((req, end) => end is null || end.Value >= req.StartDate)
            .WithMessage("A data de término deve ser igual ou posterior à data de início.");
        RuleFor(x => x.Description).MaximumLength(1500).WithMessage("A descrição deve ter no máximo {MaxLength} caracteres.");
    }
}
