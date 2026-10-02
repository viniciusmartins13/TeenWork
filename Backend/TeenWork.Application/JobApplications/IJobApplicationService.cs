using TeenWork.Application.Common.Models;

namespace TeenWork.Application.JobApplications;

public interface IJobApplicationService
{
    Task<MyApplicationDto> ApplyAsync(int jobId, ApplyRequest request, CancellationToken ct = default);
    Task<PagedResult<MyApplicationDto>> GetMyApplicationsAsync(MyApplicationsQuery query, CancellationToken ct = default);
    Task<PagedResult<ReceivedApplicationDto>> GetForJobAsync(int jobId, ReceivedApplicationsQuery query, CancellationToken ct = default);
    Task<PagedResult<ReceivedApplicationDto>> GetReceivedAsync(ReceivedApplicationsQuery query, CancellationToken ct = default);
    Task<ApplicationDetailsDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ApplicationDetailsDto> UpdateStatusAsync(int id, UpdateApplicationStatusRequest request, CancellationToken ct = default);
    Task CancelAsync(int id, CancellationToken ct = default);
}
