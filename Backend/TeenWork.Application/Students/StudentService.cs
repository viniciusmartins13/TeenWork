using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Jobs;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Entities;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Students;

public sealed class StudentService(IAppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IStudentService
{
    public async Task<StudentProfileDto> GetMyProfileAsync(CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(currentUser.GetRequiredUserId(), ct);
        return await LoadProfileAsync(studentId, ct);
    }

    public async Task<StudentProfileDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();

        var exists = await db.StudentProfiles.AnyAsync(s => s.Id == id, ct);
        if (!exists)
        {
            throw new NotFoundException("Estudante não encontrado.");
        }

        // Privacidade (LGPD — a maioria dos usuários é menor de idade):
        // o perfil completo só é visível para o próprio aluno, para administradores
        // e para empresas que receberam candidatura desse aluno.
        var canView = currentUser.IsInRole(Roles.Admin)
            || (currentUser.IsInRole(Roles.Student) && await db.StudentProfiles.AnyAsync(s => s.Id == id && s.UserId == userId, ct))
            || (currentUser.IsInRole(Roles.Company) && await db.Applications.AnyAsync(a =>
                a.StudentId == id && a.Job.Company.UserId == userId, ct));

        if (!canView)
        {
            throw new ForbiddenException("Você só pode visualizar perfis de estudantes que se candidataram às suas vagas.");
        }

        return await LoadProfileAsync(id, ct);
    }

    public async Task<StudentProfileDto> UpdateProfileAsync(UpdateStudentProfileRequest request, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var profile = await db.StudentProfiles
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, ct)
            ?? throw new ForbiddenException("Esta ação é exclusiva para contas de estudante.");

        profile.User.Name = request.Name.Trim();
        profile.School = request.School.TrimToNull();
        profile.Course = request.Course.TrimToNull();
        profile.SchoolYear = request.SchoolYear.TrimToNull();
        profile.GraduationYear = request.GraduationYear;
        profile.City = request.City.TrimToNull();
        profile.State = request.State.ToUpperTrimmed();
        profile.Bio = request.Bio.TrimToNull();
        profile.Skills = SkillsParser.Join(request.Skills);
        profile.PortfolioUrl = request.PortfolioUrl.TrimToNull();

        await db.SaveChangesAsync(ct);
        return await LoadProfileAsync(profile.Id, ct);
    }

    public async Task<ExperienceDto> AddExperienceAsync(ExperienceRequest request, CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(currentUser.GetRequiredUserId(), ct);

        var count = await db.StudentExperiences.CountAsync(e => e.StudentId == studentId, ct);
        if (count >= 20)
        {
            throw new BusinessRuleException("Você atingiu o limite de 20 experiências no perfil.");
        }

        var experience = new StudentExperience { StudentId = studentId };
        Apply(experience, request);

        db.StudentExperiences.Add(experience);
        await db.SaveChangesAsync(ct);

        return ToExperienceDto(experience);
    }

    public async Task<ExperienceDto> UpdateExperienceAsync(int experienceId, ExperienceRequest request, CancellationToken ct = default)
    {
        var experience = await GetOwnedExperienceAsync(experienceId, ct);
        Apply(experience, request);
        await db.SaveChangesAsync(ct);

        return ToExperienceDto(experience);
    }

    public async Task DeleteExperienceAsync(int experienceId, CancellationToken ct = default)
    {
        var experience = await GetOwnedExperienceAsync(experienceId, ct);
        db.StudentExperiences.Remove(experience);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Recomendação simples e explicável: pontua vagas abertas por localização,
    /// habilidades do aluno citadas na vaga e afinidade com o curso.
    /// </summary>
    public async Task<IReadOnlyList<JobSummaryDto>> GetRecommendedJobsAsync(int limit, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 20);
        var userId = currentUser.GetRequiredUserId();

        var student = await db.StudentProfiles
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .Select(s => new { s.Id, s.City, s.State, s.Skills, s.Course })
            .FirstOrDefaultAsync(ct)
            ?? throw new ForbiddenException("Esta ação é exclusiva para contas de estudante.");

        var today = AppTime.Today(clock);
        var candidates = JobService.OpenJobs(db.Jobs.AsNoTracking(), today)
            .Where(j => !j.Applications.Any(a => a.StudentId == student.Id && a.Status != ApplicationStatus.Cancelled))
            .OrderByDescending(j => j.CreatedAt)
            .Take(200);

        var jobs = await JobService.ProjectSummary(candidates, student.Id).ToListAsync(ct);

        var texts = await candidates
            .Select(j => new { j.Id, Text = j.Title + " " + j.Area + " " + (j.Requirements ?? string.Empty) })
            .ToDictionaryAsync(x => x.Id, x => x.Text, ct);

        var skills = SkillsParser.Split(student.Skills);
        var courseWords = (student.Course ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(w => w.Length >= 4)
            .ToList();

        int Score(JobSummaryDto job)
        {
            var score = 0;
            var text = texts.GetValueOrDefault(job.Id, string.Empty);

            if (student.City is not null && string.Equals(job.City, student.City, StringComparison.OrdinalIgnoreCase)) score += 4;
            else if (student.State is not null && string.Equals(job.State, student.State, StringComparison.OrdinalIgnoreCase)) score += 2;
            if (job.WorkModel == WorkModel.Remote) score += 1;

            score += 3 * skills.Count(skill => text.Contains(skill, StringComparison.OrdinalIgnoreCase));
            score += 2 * courseWords.Count(word => text.Contains(word, StringComparison.OrdinalIgnoreCase));
            return score;
        }

        return jobs
            .Select(job => (Job: job, Score: Score(job)))
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Job.CreatedAt)
            .Take(limit)
            .Select(x => x.Job)
            .ToList();
    }

    private async Task<StudentProfileDto> LoadProfileAsync(int studentId, CancellationToken ct)
    {
        var profile = await db.StudentProfiles
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Experiences)
            .FirstOrDefaultAsync(s => s.Id == studentId, ct)
            ?? throw new NotFoundException("Estudante não encontrado.");

        return ToDto(profile);
    }

    internal static StudentProfileDto ToDto(StudentProfile profile) => new()
    {
        Id = profile.Id,
        UserId = profile.UserId,
        Name = profile.User.Name,
        Email = profile.User.Email,
        ProfileImage = profile.User.ProfileImage,
        School = profile.School,
        Course = profile.Course,
        SchoolYear = profile.SchoolYear,
        GraduationYear = profile.GraduationYear,
        City = profile.City,
        State = profile.State,
        Bio = profile.Bio,
        Skills = SkillsParser.Split(profile.Skills),
        PortfolioUrl = profile.PortfolioUrl,
        Experiences = profile.Experiences
            .OrderByDescending(e => e.EndDate is null)
            .ThenByDescending(e => e.StartDate)
            .Select(ToExperienceDto)
            .ToList(),
        CreatedAt = profile.CreatedAt,
        UpdatedAt = profile.UpdatedAt
    };

    internal static ExperienceDto ToExperienceDto(StudentExperience e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Organization = e.Organization,
        Type = e.Type,
        StartDate = e.StartDate,
        EndDate = e.EndDate,
        IsCurrent = e.EndDate is null,
        Description = e.Description
    };

    private async Task<StudentExperience> GetOwnedExperienceAsync(int experienceId, CancellationToken ct)
    {
        var studentId = await db.GetStudentIdAsync(currentUser.GetRequiredUserId(), ct);
        var experience = await db.StudentExperiences.FirstOrDefaultAsync(e => e.Id == experienceId, ct)
            ?? throw new NotFoundException("Experiência não encontrada.");

        if (experience.StudentId != studentId)
        {
            throw new ForbiddenException("Você não pode alterar experiências de outro estudante.");
        }

        return experience;
    }

    private static void Apply(StudentExperience experience, ExperienceRequest request)
    {
        experience.Title = request.Title.Trim();
        experience.Organization = request.Organization.Trim();
        experience.Type = request.Type;
        experience.StartDate = request.StartDate;
        experience.EndDate = request.EndDate;
        experience.Description = request.Description.TrimToNull();
    }
}
