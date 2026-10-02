using TeenWork.Application.Jobs;

namespace TeenWork.Application.Students;

public interface IStudentService
{
    Task<StudentProfileDto> GetMyProfileAsync(CancellationToken ct = default);
    Task<StudentProfileDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<StudentProfileDto> UpdateProfileAsync(UpdateStudentProfileRequest request, CancellationToken ct = default);
    Task<ExperienceDto> AddExperienceAsync(ExperienceRequest request, CancellationToken ct = default);
    Task<ExperienceDto> UpdateExperienceAsync(int experienceId, ExperienceRequest request, CancellationToken ct = default);
    Task DeleteExperienceAsync(int experienceId, CancellationToken ct = default);
    Task<IReadOnlyList<JobSummaryDto>> GetRecommendedJobsAsync(int limit, CancellationToken ct = default);
}
