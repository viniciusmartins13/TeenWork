using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Students;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Entities;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.JobApplications;

public sealed class JobApplicationService(
    IAppDbContext db,
    ICurrentUser currentUser,
    TimeProvider clock) : IJobApplicationService
{
    public async Task<MyApplicationDto> ApplyAsync(
        int jobId,
        ApplyRequest request,
        CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();

        var student = await db.StudentProfiles
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, ct)
            ?? throw new ForbiddenException(
                "Somente estudantes podem se candidatar a vagas.");

        var job = await db.Jobs
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct)
            ?? throw new NotFoundException("Vaga não encontrada.");

        if (!job.IsOpenForApplications(AppTime.Today(clock)))
        {
            throw new BusinessRuleException(
                "Esta vaga não está mais recebendo candidaturas.");
        }

        var existing = await db.Applications
            .FirstOrDefaultAsync(
                a => a.JobId == jobId && a.StudentId == student.Id,
                ct);

        JobApplication application;

        if (existing is null)
        {
            application = new JobApplication
            {
                JobId = job.Id,
                StudentId = student.Id,
                Status = ApplicationStatus.Pending,
                CoverLetter = request.CoverLetter.TrimToNull()
            };

            db.Applications.Add(application);
        }
        else if (existing.Status == ApplicationStatus.Cancelled)
        {
            application = existing;
            application.Status = ApplicationStatus.Pending;
            application.CoverLetter = request.CoverLetter.TrimToNull();
            application.CompanyFeedback = null;
        }
        else
        {
            throw new ConflictException(
                "Você já se candidatou a esta vaga.");
        }

        var notification = new Notification
        {
            UserId = job.Company.UserId,
            Title = "Nova candidatura recebida",
            Message =
                $"{student.User.Name} se candidatou à vaga \"{job.Title}\".",
            Type = NotificationType.ApplicationReceived
        };

        db.Notifications.Add(notification);

        await db.SaveChangesAsync(ct);

        notification.Link =
            $"/empresa/candidatos/{application.Id}";

        await db.SaveChangesAsync(ct);

        return await ProjectMine(
            db.Applications.Where(a => a.Id == application.Id)
        ).FirstAsync(ct);
    }

    public async Task<PagedResult<MyApplicationDto>> GetMyApplicationsAsync(
        MyApplicationsQuery query,
        CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(
            currentUser.GetRequiredUserId(),
            ct);

        var applications = db.Applications
            .AsNoTracking()
            .Where(a => a.StudentId == studentId);

        if (query.Status is { } status)
        {
            applications = applications
                .Where(a => a.Status == status);
        }

        return await ProjectMine(
                applications
                    .OrderByDescending(a => a.UpdatedAt)
                    .ThenByDescending(a => a.Id))
            .ToPagedResultAsync(query, ct);
    }

    public async Task<PagedResult<ReceivedApplicationDto>> GetForJobAsync(
        int jobId,
        ReceivedApplicationsQuery query,
        CancellationToken ct = default)
    {
        var companyId = await db.GetCompanyIdAsync(
            currentUser.GetRequiredUserId(),
            ct);

        var jobCompanyId = await db.Jobs
            .Where(j => j.Id == jobId)
            .Select(j => (int?)j.CompanyId)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Vaga não encontrada.");

        if (jobCompanyId != companyId)
        {
            throw new ForbiddenException(
                "Você só pode ver candidaturas das vagas da sua empresa.");
        }

        query.JobId = jobId;

        return await QueryReceivedAsync(companyId, query, ct);
    }

    public async Task<PagedResult<ReceivedApplicationDto>> GetReceivedAsync(
        ReceivedApplicationsQuery query,
        CancellationToken ct = default)
    {
        var companyId = await db.GetCompanyIdAsync(
            currentUser.GetRequiredUserId(),
            ct);

        return await QueryReceivedAsync(companyId, query, ct);
    }

    public async Task<ApplicationDetailsDto> GetByIdAsync(
        int id,
        CancellationToken ct = default)
    {
        var application = await LoadDetailsAsync(id, ct);

        EnsureCanView(application);

        return ToDetailsDto(application);
    }

    public async Task<ApplicationDetailsDto> UpdateStatusAsync(
        int id,
        UpdateApplicationStatusRequest request,
        CancellationToken ct = default)
    {
        var companyId = await db.GetCompanyIdAsync(
            currentUser.GetRequiredUserId(),
            ct);

        var application = await db.Applications
            .Include(a => a.Job)
            .Include(a => a.Student)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException(
                "Candidatura não encontrada.");

        if (application.Job.CompanyId != companyId)
        {
            throw new ForbiddenException(
                "Você só pode gerenciar candidaturas das vagas da sua empresa.");
        }

        if (application.Status == ApplicationStatus.Cancelled)
        {
            throw new BusinessRuleException(
                "Esta candidatura foi cancelada pelo estudante e não pode mais ser alterada.");
        }

        if (request.Status == ApplicationStatus.Cancelled)
        {
            throw new BusinessRuleException(
                "Somente o candidato pode cancelar a própria candidatura.");
        }

        var statusChanged =
            application.Status != request.Status;

        var feedback =
            request.Feedback.TrimToNull();

        var feedbackChanged =
            feedback is not null &&
            feedback != application.CompanyFeedback;

        application.Status = request.Status;

        if (feedback is not null)
        {
            application.CompanyFeedback = feedback;
        }

        if (statusChanged || feedbackChanged)
        {
            db.Notifications.Add(new Notification
            {
                UserId = application.Student.UserId,
                Title = StatusNotificationTitle(request.Status),
                Message =
                    $"Sua candidatura para \"{application.Job.Title}\" está agora: {StatusLabel(request.Status)}."
                    + (feedback is not null
                        ? $" Mensagem da empresa: {feedback}"
                        : string.Empty),
                Type = NotificationType.ApplicationStatusChanged,
                Link = "/aluno/candidaturas"
            });
        }

        await db.SaveChangesAsync(ct);

        var details = await LoadDetailsAsync(id, ct);

        return ToDetailsDto(details);
    }

    public async Task CancelAsync(
        int id,
        CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(
            currentUser.GetRequiredUserId(),
            ct);

        var application = await db.Applications
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Student)
                .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException(
                "Candidatura não encontrada.");

        if (application.StudentId != studentId)
        {
            throw new ForbiddenException(
                "Você só pode cancelar as suas próprias candidaturas.");
        }

        if (!application.CanBeCancelledByStudent)
        {
            throw new BusinessRuleException(
                application.Status == ApplicationStatus.Cancelled
                    ? "Esta candidatura já foi cancelada."
                    : "Não é possível cancelar uma candidatura que já foi finalizada pela empresa.");
        }

        application.Status = ApplicationStatus.Cancelled;

        db.Notifications.Add(new Notification
        {
            UserId = application.Job.Company.UserId,
            Title = "Candidatura cancelada",
            Message =
                $"{application.Student.User.Name} cancelou a candidatura para \"{application.Job.Title}\".",
            Type = NotificationType.ApplicationCancelled,
            Link = $"/empresa/candidatos/{application.Id}"
        });

        await db.SaveChangesAsync(ct);
    }

    private async Task<PagedResult<ReceivedApplicationDto>> QueryReceivedAsync(
        int companyId,
        ReceivedApplicationsQuery query,
        CancellationToken ct)
    {
        var applications = db.Applications
            .AsNoTracking()
            .Where(a => a.Job.CompanyId == companyId);

        if (query.JobId is { } jobId)
        {
            applications = applications
                .Where(a => a.JobId == jobId);
        }

        if (query.Status is { } status)
        {
            applications = applications
                .Where(a => a.Status == status);
        }

        if (query.Search.TrimToNull() is { } search)
        {
            applications = applications.Where(a =>
                a.Student.User.Name.Contains(search) ||
                (a.Student.School != null &&
                 a.Student.School.Contains(search)) ||
                (a.Student.Course != null &&
                 a.Student.Course.Contains(search)) ||
                (a.Student.Skills != null &&
                 a.Student.Skills.Contains(search)));
        }

        var page = await applications
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .Select(a => new
            {
                a.Id,
                a.JobId,
                JobTitle = a.Job.Title,
                a.StudentId,
                StudentName = a.Student.User.Name,
                StudentPhoto = a.Student.User.ProfileImage,
                a.Student.City,
                a.Student.State,
                a.Student.School,
                a.Student.Course,
                a.Student.SchoolYear,
                a.Student.Skills,
                a.Status,
                a.CoverLetter,
                a.CreatedAt,
                a.UpdatedAt
            })
            .ToPagedResultAsync(query, ct);

        return page.Map(a => new ReceivedApplicationDto
        {
            Id = a.Id,
            JobId = a.JobId,
            JobTitle = a.JobTitle,
            StudentId = a.StudentId,
            StudentName = a.StudentName,
            StudentPhoto = a.StudentPhoto,
            City = a.City,
            State = a.State,
            School = a.School,
            Course = a.Course,
            SchoolYear = a.SchoolYear,
            Skills = SkillsParser.Split(a.Skills),
            Status = a.Status,
            CoverLetter = a.CoverLetter,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        });
    }

    private static IQueryable<MyApplicationDto> ProjectMine(
        IQueryable<JobApplication> applications) =>
        applications.Select(a => new MyApplicationDto
        {
            Id = a.Id,
            JobId = a.JobId,
            JobTitle = a.Job.Title,
            CompanyId = a.Job.CompanyId,
            CompanyName = a.Job.Company.CompanyName,
            CompanyLogo = a.Job.Company.Logo,
            City = a.Job.City,
            State = a.Job.State,
            WorkModel = a.Job.WorkModel,
            JobType = a.Job.JobType,
            JobStatus = a.Job.Status,
            Status = a.Status,
            CoverLetter = a.CoverLetter,
            CompanyFeedback = a.CompanyFeedback,
            CanCancel =
                a.Status == ApplicationStatus.Pending ||
                a.Status == ApplicationStatus.UnderReview,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        });

    private async Task<JobApplication> LoadDetailsAsync(
        int id,
        CancellationToken ct)
    {
        var application = await db.Applications
            .AsNoTracking()
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.Student)
                .ThenInclude(s => s.User)
            .Include(a => a.Student)
                .ThenInclude(s => s.Experiences)
            .FirstOrDefaultAsync(
                a => a.Id == id,
                ct);

        return application
            ?? throw new NotFoundException(
                "Candidatura não encontrada.");
    }

    private void EnsureCanView(JobApplication application)
    {
        var userId = currentUser.GetRequiredUserId();

        var isStudentOwner =
            currentUser.IsInRole(Roles.Student) &&
            application.Student.UserId == userId;

        var isCompanyOwner =
            currentUser.IsInRole(Roles.Company) &&
            application.Job.Company.UserId == userId;

        if (!isStudentOwner &&
            !isCompanyOwner &&
            !currentUser.IsInRole(Roles.Admin))
        {
            throw new ForbiddenException(
                "Você não tem permissão para ver esta candidatura.");
        }
    }

    private static ApplicationDetailsDto ToDetailsDto(
        JobApplication a) =>
        new()
        {
            Id = a.Id,
            Status = a.Status,
            CoverLetter = a.CoverLetter,
            CompanyFeedback = a.CompanyFeedback,
            CanCancel = a.CanBeCancelledByStudent,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,

            Job = new ApplicationJobDto
            {
                Id = a.Job.Id,
                Title = a.Job.Title,
                CompanyId = a.Job.CompanyId,
                CompanyName = a.Job.Company.CompanyName,
                CompanyLogo = a.Job.Company.Logo,
                Status = a.Job.Status
            },

            Student = StudentService.ToDto(a.Student)
        };

    internal static string StatusLabel(
        ApplicationStatus status) =>
        status switch
        {
            ApplicationStatus.Pending =>
                "Pendente",

            ApplicationStatus.UnderReview =>
                "Em análise",

            ApplicationStatus.Accepted =>
                "Aceita",

            ApplicationStatus.Rejected =>
                "Não selecionada",

            ApplicationStatus.Cancelled =>
                "Cancelada",

            _ =>
                status.ToString()
        };

    private static string StatusNotificationTitle(
        ApplicationStatus status) =>
        status switch
        {
            ApplicationStatus.Accepted =>
                "Parabéns! Você foi aprovado(a)",

            ApplicationStatus.Rejected =>
                "Atualização do processo seletivo",

            ApplicationStatus.UnderReview =>
                "Sua candidatura está em análise",

            _ =>
                "Status da candidatura atualizado"
        };
}