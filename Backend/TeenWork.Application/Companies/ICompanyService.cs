using TeenWork.Application.Common.Models;

namespace TeenWork.Application.Companies;

public interface ICompanyService
{
    Task<PagedResult<CompanySummaryDto>> SearchAsync(CompanyQuery query, CancellationToken ct = default);
    Task<CompanyProfileDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CompanyProfileDto> GetMyProfileAsync(CancellationToken ct = default);
    Task<CompanyProfileDto> UpdateProfileAsync(UpdateCompanyProfileRequest request, CancellationToken ct = default);
}
