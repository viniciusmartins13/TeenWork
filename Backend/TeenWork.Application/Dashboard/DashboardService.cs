using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.JobApplications;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Dashboard;

public interface IDashboardService
{
    Task<StudentDashboardDto> GetStudentDashboardAsync(CancellationToken ct = default);
    Task<CompanyDashboardDto> GetCompanyDashboardAsync(CancellationToken ct = default);
}

public sealed class DashboardService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IJobApplicationService applicationService) : IDashboardService
{
    public async Task<StudentDashboardDto> GetStudentDashboardAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var student = await db.StudentProfiles
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .Select(s => new
            {
                s.Id,
                s.User.Name,
                s.User.ProfileImage,
                s.School,
                s.Course,
                s.City,
                s.State,
                s.Bio,
                s.Skills,
                ExperiencesCount = s.Experiences.Count
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new ForbiddenException("Esta área é exclusiva para estudantes.");

        var counts = await db.Applications
            .AsNoTracking()
            .Where(a => a.StudentId == student.Id)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var savedJobs = await db.SavedJobs.CountAsync(s => s.StudentId == student.Id, ct);
        var unread = await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

        var recent = await applicationService.GetMyApplicationsAsync(new MyApplicationsQuery { Page = 1, PageSize = 5 }, ct);

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(student.ProfileImage)) missing.Add("photo");
        if (string.IsNullOrWhiteSpace(student.School)) missing.Add("school");
        if (string.IsNullOrWhiteSpace(student.Course)) missing.Add("course");
        if (string.IsNullOrWhiteSpace(student.City) || string.IsNullOrWhiteSpace(student.State)) missing.Add("location");
        if (string.IsNullOrWhiteSpace(student.Bio)) missing.Add("bio");
        if (SkillsParser.Split(student.Skills).Count < 3) missing.Add("skills");
        if (student.ExperiencesCount == 0) missing.Add("experience");

        const int totalItems = 7;
        var byStatus = ToStatusCounts(counts.Select(c => (c.Status, c.Count)));

        return new StudentDashboardDto
        {
            Name = student.Name,
            ProfileImage = student.ProfileImage,
            School = student.School,
            Course = student.Course,
            City = student.City,
            State = student.State,
            ProfileCompletion = new ProfileCompletionDto
            {
                Percentage = (int)Math.Round((totalItems - missing.Count) * 100.0 / totalItems),
                MissingItems = missing
            },
            TotalApplications = counts.Where(c => c.Status != ApplicationStatus.Cancelled).Sum(c => c.Count),
            ApplicationsByStatus = byStatus,
            SavedJobsCount = savedJobs,
            UnreadNotifications = unread,
            RecentApplications = recent.Items
        };
    }

    public async Task<CompanyDashboardDto> GetCompanyDashboardAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var company = await db.CompanyProfiles
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .Select(c => new { c.Id, c.CompanyName, c.Logo })
            .FirstOrDefaultAsync(ct)
            ?? throw new ForbiddenException("Esta área é exclusiva para empresas.");

        var jobCounts = await db.Jobs
            .AsNoTracking()
            .Where(j => j.CompanyId == company.Id)
            .GroupBy(j => j.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var applicationCounts = await db.Applications
            .AsNoTracking()
            .Where(a => a.Job.CompanyId == company.Id)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var topJobs = await db.Jobs
            .AsNoTracking()
            .Where(j => j.CompanyId == company.Id && j.Status == JobStatus.Active)
            .OrderByDescending(j => j.Applications.Count(a => a.Status != ApplicationStatus.Cancelled))
            .ThenByDescending(j => j.CreatedAt)
            .Take(5)
            .Select(j => new TopJobDto
            {
                Id = j.Id,
                Title = j.Title,
                ApplicationsCount = j.Applications.Count(a => a.Status != ApplicationStatus.Cancelled),
                PendingCount = j.Applications.Count(a => a.Status == ApplicationStatus.Pending)
            })
            .ToListAsync(ct);

        var unread = await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);
        var recent = await applicationService.GetReceivedAsync(new ReceivedApplicationsQuery { Page = 1, PageSize = 6 }, ct);

        int JobsWith(JobStatus status) => jobCounts.Where(j => j.Status == status).Sum(j => j.Count);

        return new CompanyDashboardDto
        {
            CompanyName = company.CompanyName,
            Logo = company.Logo,
            TotalJobs = jobCounts.Sum(j => j.Count),
            ActiveJobs = JobsWith(JobStatus.Active),
            InactiveJobs = JobsWith(JobStatus.Inactive),
            ClosedJobs = JobsWith(JobStatus.Closed),
            TotalApplications = applicationCounts.Where(a => a.Status != ApplicationStatus.Cancelled).Sum(a => a.Count),
            ApplicationsByStatus = ToStatusCounts(applicationCounts.Select(a => (a.Status, a.Count))),
            UnreadNotifications = unread,
            RecentApplications = recent.Items,
            TopJobs = topJobs
        };
    }

    private static ApplicationStatusCountsDto ToStatusCounts(IEnumerable<(ApplicationStatus Status, int Count)> counts)
    {
        var map = counts.ToDictionary(c => c.Status, c => c.Count);
        return new ApplicationStatusCountsDto
        {
            Pending = map.GetValueOrDefault(ApplicationStatus.Pending),
            UnderReview = map.GetValueOrDefault(ApplicationStatus.UnderReview),
            Accepted = map.GetValueOrDefault(ApplicationStatus.Accepted),
            Rejected = map.GetValueOrDefault(ApplicationStatus.Rejected),
            Cancelled = map.GetValueOrDefault(ApplicationStatus.Cancelled)
        };
    }
}
