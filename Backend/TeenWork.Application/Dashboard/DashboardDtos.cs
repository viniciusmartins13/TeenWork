using TeenWork.Application.JobApplications;

namespace TeenWork.Application.Dashboard;

public sealed class ApplicationStatusCountsDto
{
    public int Pending { get; init; }
    public int UnderReview { get; init; }
    public int Accepted { get; init; }
    public int Rejected { get; init; }
    public int Cancelled { get; init; }
}

public sealed class ProfileCompletionDto
{
    /// <summary>0 a 100.</summary>
    public int Percentage { get; init; }
    /// <summary>Itens pendentes: photo, school, course, location, bio, skills, experience.</summary>
    public IReadOnlyList<string> MissingItems { get; init; } = [];
}

public sealed class StudentDashboardDto
{
    public string Name { get; init; } = string.Empty;
    public string? ProfileImage { get; init; }
    public string? School { get; init; }
    public string? Course { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public ProfileCompletionDto ProfileCompletion { get; init; } = new();
    public int TotalApplications { get; init; }
    public ApplicationStatusCountsDto ApplicationsByStatus { get; init; } = new();
    public int SavedJobsCount { get; init; }
    public int UnreadNotifications { get; init; }
    public IReadOnlyList<MyApplicationDto> RecentApplications { get; init; } = [];
}

public sealed class TopJobDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public int ApplicationsCount { get; init; }
    public int PendingCount { get; init; }
}

public sealed class CompanyDashboardDto
{
    public string CompanyName { get; init; } = string.Empty;
    public string? Logo { get; init; }
    public int TotalJobs { get; init; }
    public int ActiveJobs { get; init; }
    public int InactiveJobs { get; init; }
    public int ClosedJobs { get; init; }
    public int TotalApplications { get; init; }
    public ApplicationStatusCountsDto ApplicationsByStatus { get; init; } = new();
    public int UnreadNotifications { get; init; }
    public IReadOnlyList<ReceivedApplicationDto> RecentApplications { get; init; } = [];
    public IReadOnlyList<TopJobDto> TopJobs { get; init; } = [];
}
