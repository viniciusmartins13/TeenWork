using TeenWork.Application.Common.Models;

namespace TeenWork.Application.Jobs;

public interface IJobService
{
    Task<PagedResult<JobSummaryDto>> SearchAsync(JobQuery query, CancellationToken ct = default);
    Task<JobFilterOptionsDto> GetFilterOptionsAsync(CancellationToken ct = default);
    Task<JobDetailsDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PagedResult<CompanyJobDto>> GetMyCompanyJobsAsync(CompanyJobQuery query, CancellationToken ct = default);
    Task<JobDetailsDto> CreateAsync(JobRequest request, CancellationToken ct = default);
    Task<JobDetailsDto> UpdateAsync(int id, JobRequest request, CancellationToken ct = default);
    Task<JobDetailsDto> UpdateStatusAsync(int id, UpdateJobStatusRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
