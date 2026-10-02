using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Entities;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Jobs;

public sealed class JobService(IAppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IJobService
{
    public async Task<PagedResult<JobSummaryDto>> SearchAsync(JobQuery query, CancellationToken ct = default)
    {
        var today = AppTime.Today(clock);
        var studentId = await db.TryGetStudentIdAsync(currentUser, ct);

        var jobs = OpenJobs(db.Jobs.AsNoTracking(), today);

        if (query.Search.TrimToNull() is { } search)
        {
            jobs = jobs.Where(j =>
                j.Title.Contains(search) ||
                j.Area.Contains(search) ||
                j.Description.Contains(search) ||
                j.Company.CompanyName.Contains(search));
        }

        if (query.City.TrimToNull() is { } city)
        {
            jobs = jobs.Where(j => j.City.Contains(city));
        }

        if (query.State.ToUpperTrimmed() is { } state)
        {
            jobs = jobs.Where(j => j.State == state);
        }

        if (query.Area.TrimToNull() is { } area)
        {
            jobs = jobs.Where(j => j.Area == area);
        }

        if (query.WorkModel is { } workModel)
        {
            jobs = jobs.Where(j => j.WorkModel == workModel);
        }

        if (query.JobType is { } jobType)
        {
            jobs = jobs.Where(j => j.JobType == jobType);
        }

        if (query.MinSalary is { } minSalary)
        {
            jobs = jobs.Where(j => j.Salary != null && j.Salary >= minSalary);
        }

        if (query.MaxSalary is { } maxSalary)
        {
            jobs = jobs.Where(j => j.Salary != null && j.Salary <= maxSalary);
        }

        if (query.CompanyId is { } companyId)
        {
            jobs = jobs.Where(j => j.CompanyId == companyId);
        }

        jobs = ApplySort(jobs, query.Sort);

        return await ProjectSummary(jobs, studentId).ToPagedResultAsync(query, ct);
    }

    public async Task<JobFilterOptionsDto> GetFilterOptionsAsync(CancellationToken ct = default)
    {
        var today = AppTime.Today(clock);
        var openJobs = OpenJobs(db.Jobs.AsNoTracking(), today);

        var areas = await openJobs
            .Select(j => j.Area)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync(ct);

        var groupedLocations = await openJobs
            .GroupBy(j => new { j.City, j.State })
            .Select(g => new { g.Key.City, g.Key.State, Count = g.Count() })
            .ToListAsync(ct);

        var locations = groupedLocations
            .OrderByDescending(l => l.Count)
            .ThenBy(l => l.City)
            .Select(l => new JobLocationDto { City = l.City, State = l.State, JobsCount = l.Count })
            .ToList();

        var maxSalary = await openJobs.MaxAsync(j => j.Salary, ct);

        return new JobFilterOptionsDto { Areas = areas, Locations = locations, MaxSalary = maxSalary };
    }

    public async Task<JobDetailsDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var job = await db.Jobs
            .AsNoTracking()
            .Include(j => j.Company)
            .FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw new NotFoundException("Vaga não encontrada.");

        return await BuildDetailsAsync(job, ct);
    }

    public async Task<PagedResult<CompanyJobDto>> GetMyCompanyJobsAsync(CompanyJobQuery query, CancellationToken ct = default)
    {
        var companyId = await db.GetCompanyIdAsync(currentUser.GetRequiredUserId(), ct);
        var today = AppTime.Today(clock);

        var jobs = db.Jobs.AsNoTracking().Where(j => j.CompanyId == companyId);

        if (query.Search.TrimToNull() is { } search)
        {
            jobs = jobs.Where(j => j.Title.Contains(search) || j.Area.Contains(search));
        }

        if (query.Status is { } status)
        {
            jobs = jobs.Where(j => j.Status == status);
        }

        return await jobs
            .OrderByDescending(j => j.CreatedAt)
            .ThenByDescending(j => j.Id)
            .Select(j => new CompanyJobDto
            {
                Id = j.Id,
                Title = j.Title,
                Area = j.Area,
                City = j.City,
                State = j.State,
                WorkModel = j.WorkModel,
                JobType = j.JobType,
                Salary = j.Salary,
                Vacancies = j.Vacancies,
                Status = j.Status,
                Deadline = j.Deadline,
                IsExpired = j.Deadline != null && j.Deadline < today,
                ApplicationsCount = j.Applications.Count(a => a.Status != ApplicationStatus.Cancelled),
                PendingApplicationsCount = j.Applications.Count(a => a.Status == ApplicationStatus.Pending),
                CreatedAt = j.CreatedAt,
                UpdatedAt = j.UpdatedAt
            })
            .ToPagedResultAsync(query, ct);
    }

    public async Task<JobDetailsDto> CreateAsync(JobRequest request, CancellationToken ct = default)
    {
        var companyId = await db.GetCompanyIdAsync(currentUser.GetRequiredUserId(), ct);

        var job = new Job { CompanyId = companyId, Status = JobStatus.Active };
        Apply(job, request);

        db.Jobs.Add(job);
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(job.Id, ct);
    }

    public async Task<JobDetailsDto> UpdateAsync(int id, JobRequest request, CancellationToken ct = default)
    {
        var job = await GetOwnedJobAsync(id, ct);
        Apply(job, request);
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(job.Id, ct);
    }

    public async Task<JobDetailsDto> UpdateStatusAsync(int id, UpdateJobStatusRequest request, CancellationToken ct = default)
    {
        var job = await GetOwnedJobAsync(id, ct);

        if (request.Status == JobStatus.Active && job.Deadline is { } deadline && deadline < AppTime.Today(clock))
        {
            throw new BusinessRuleException("O prazo desta vaga já passou. Edite a vaga e defina um novo prazo antes de reativá-la.");
        }

        job.Status = request.Status;
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(job.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var job = await GetOwnedJobAsync(id, ct);

        var hasApplications = await db.Applications
            .AnyAsync(a => a.JobId == job.Id && a.Status != ApplicationStatus.Cancelled, ct);

        if (hasApplications)
        {
            throw new ConflictException(
                "Esta vaga já recebeu candidaturas e não pode ser excluída. Encerre ou desative a vaga para preservar o histórico dos candidatos.");
        }

        db.Jobs.Remove(job);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Vagas visíveis na busca: ativas e dentro do prazo.</summary>
    internal static IQueryable<Job> OpenJobs(IQueryable<Job> jobs, DateOnly today) =>
        jobs.Where(j => j.Status == JobStatus.Active && (j.Deadline == null || j.Deadline >= today));

    /// <summary>Projeção inline (traduzível pelo EF Core) para o card de vaga.</summary>
    internal static IQueryable<JobSummaryDto> ProjectSummary(IQueryable<Job> jobs, int? studentId) =>
        jobs.Select(j => new JobSummaryDto
        {
            Id = j.Id,
            Title = j.Title,
            CompanyId = j.CompanyId,
            CompanyName = j.Company.CompanyName,
            CompanyLogo = j.Company.Logo,
            Area = j.Area,
            City = j.City,
            State = j.State,
            WorkModel = j.WorkModel,
            JobType = j.JobType,
            Salary = j.Salary,
            Vacancies = j.Vacancies,
            Status = j.Status,
            Deadline = j.Deadline,
            CreatedAt = j.CreatedAt,
            IsSaved = studentId != null && j.SavedBy.Any(s => s.StudentId == studentId),
            HasApplied = studentId != null && j.Applications.Any(a =>
                a.StudentId == studentId && a.Status != ApplicationStatus.Cancelled)
        });

    private static IQueryable<Job> ApplySort(IQueryable<Job> jobs, string? sort) =>
        sort?.Trim().ToLowerInvariant() switch
        {
            JobSortOptions.Oldest => jobs.OrderBy(j => j.CreatedAt).ThenBy(j => j.Id),
            JobSortOptions.SalaryDesc => jobs.OrderByDescending(j => j.Salary != null)
                .ThenByDescending(j => j.Salary).ThenByDescending(j => j.CreatedAt),
            JobSortOptions.SalaryAsc => jobs.OrderByDescending(j => j.Salary != null)
                .ThenBy(j => j.Salary).ThenByDescending(j => j.CreatedAt),
            JobSortOptions.Deadline => jobs.OrderByDescending(j => j.Deadline != null)
                .ThenBy(j => j.Deadline).ThenByDescending(j => j.CreatedAt),
            _ => jobs.OrderByDescending(j => j.CreatedAt).ThenByDescending(j => j.Id)
        };

    private async Task<JobDetailsDto> BuildDetailsAsync(Job job, CancellationToken ct)
    {
        var today = AppTime.Today(clock);
        var isOwner = false;
        int? applicationsCount = null;
        var isSaved = false;
        MyApplicationSnapshotDto? myApplication = null;

        if (currentUser.UserId is { } userId)
        {
            if (currentUser.IsInRole(Roles.Company) && job.Company.UserId == userId)
            {
                isOwner = true;
                applicationsCount = await db.Applications
                    .CountAsync(a => a.JobId == job.Id && a.Status != ApplicationStatus.Cancelled, ct);
            }
            else if (currentUser.IsInRole(Roles.Student))
            {
                var studentId = await db.TryGetStudentIdAsync(currentUser, ct);
                if (studentId is { } sid)
                {
                    isSaved = await db.SavedJobs.AnyAsync(s => s.JobId == job.Id && s.StudentId == sid, ct);
                    myApplication = await db.Applications
                        .AsNoTracking()
                        .Where(a => a.JobId == job.Id && a.StudentId == sid && a.Status != ApplicationStatus.Cancelled)
                        .Select(a => new MyApplicationSnapshotDto { Id = a.Id, Status = a.Status, CreatedAt = a.CreatedAt })
                        .FirstOrDefaultAsync(ct);
                }
            }
        }

        return new JobDetailsDto
        {
            Id = job.Id,
            Title = job.Title,
            Description = job.Description,
            Requirements = job.Requirements,
            Benefits = job.Benefits,
            Area = job.Area,
            City = job.City,
            State = job.State,
            WorkModel = job.WorkModel,
            JobType = job.JobType,
            Salary = job.Salary,
            Workload = job.Workload,
            Vacancies = job.Vacancies,
            Status = job.Status,
            Deadline = job.Deadline,
            CreatedAt = job.CreatedAt,
            UpdatedAt = job.UpdatedAt,
            IsOpenForApplications = job.IsOpenForApplications(today),
            Company = new JobCompanyDto
            {
                Id = job.Company.Id,
                CompanyName = job.Company.CompanyName,
                Logo = job.Company.Logo,
                Industry = job.Company.Industry,
                City = job.Company.City,
                State = job.Company.State,
                Website = job.Company.Website,
                Description = job.Company.Description
            },
            IsOwner = isOwner,
            ApplicationsCount = applicationsCount,
            IsSaved = isSaved,
            MyApplication = myApplication
        };
    }

    /// <summary>Carrega a vaga garantindo que pertence à empresa logada (ownership).</summary>
    private async Task<Job> GetOwnedJobAsync(int id, CancellationToken ct)
    {
        var companyId = await db.GetCompanyIdAsync(currentUser.GetRequiredUserId(), ct);
        var job = await db.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw new NotFoundException("Vaga não encontrada.");

        if (job.CompanyId != companyId)
        {
            throw new ForbiddenException("Você não tem permissão para alterar esta vaga.");
        }

        return job;
    }

    private static void Apply(Job job, JobRequest request)
    {
        job.Title = request.Title.Trim();
        job.Description = request.Description.Trim();
        job.Requirements = request.Requirements.TrimToNull();
        job.Benefits = request.Benefits.TrimToNull();
        job.Area = request.Area.Trim();
        job.City = request.City.Trim();
        job.State = request.State.Trim().ToUpperInvariant();
        job.WorkModel = request.WorkModel;
        job.JobType = request.JobType;
        job.Salary = request.Salary is { } salary ? decimal.Round(salary, 2) : null;
        job.Workload = request.Workload.TrimToNull();
        job.Vacancies = request.Vacancies;
        job.Deadline = request.Deadline;
    }
}
