using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Common.Validation;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Companies;

public sealed class CompanyService(IAppDbContext db, ICurrentUser currentUser, TimeProvider clock) : ICompanyService
{
    public async Task<PagedResult<CompanySummaryDto>> SearchAsync(CompanyQuery query, CancellationToken ct = default)
    {
        var today = AppTime.Today(clock);
        var companies = db.CompanyProfiles.AsNoTracking().Where(c => c.User.IsActive);

        if (query.Search.TrimToNull() is { } search)
        {
            companies = companies.Where(c => c.CompanyName.Contains(search) || (c.Industry != null && c.Industry.Contains(search)));
        }

        if (query.State.ToUpperTrimmed() is { } state)
        {
            companies = companies.Where(c => c.State == state);
        }

        if (query.OnlyHiring)
        {
            companies = companies.Where(c => c.Jobs.Any(j =>
                j.Status == JobStatus.Active && (j.Deadline == null || j.Deadline >= today)));
        }

        return await companies
            .OrderByDescending(c => c.Jobs.Count(j => j.Status == JobStatus.Active && (j.Deadline == null || j.Deadline >= today)))
            .ThenBy(c => c.CompanyName)
            .Select(c => new CompanySummaryDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                Industry = c.Industry,
                City = c.City,
                State = c.State,
                Logo = c.Logo,
                Description = c.Description,
                ActiveJobsCount = c.Jobs.Count(j => j.Status == JobStatus.Active && (j.Deadline == null || j.Deadline >= today))
            })
            .ToPagedResultAsync(query, ct);
    }

    public async Task<CompanyProfileDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var dto = await ProjectAsync(id, ct) ?? throw new NotFoundException("Empresa não encontrada.");

        var canSeePrivate = currentUser.UserId is { } userId &&
            (dto.UserId == userId || currentUser.IsInRole(Roles.Admin));

        return canSeePrivate ? dto : WithoutPrivateData(dto);
    }

    public async Task<CompanyProfileDto> GetMyProfileAsync(CancellationToken ct = default)
    {
        var companyId = await db.GetCompanyIdAsync(currentUser.GetRequiredUserId(), ct);
        return await ProjectAsync(companyId, ct) ?? throw new NotFoundException("Empresa não encontrada.");
    }

    public async Task<CompanyProfileDto> UpdateProfileAsync(UpdateCompanyProfileRequest request, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var company = await db.CompanyProfiles
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct)
            ?? throw new ForbiddenException("Esta ação é exclusiva para contas de empresa.");

        var cnpj = CnpjValidator.Normalize(request.Cnpj);
        if (cnpj is not null && cnpj != company.Cnpj &&
            await db.CompanyProfiles.AnyAsync(c => c.Cnpj == cnpj && c.Id != company.Id, ct))
        {
            throw new ConflictException("Já existe uma empresa cadastrada com este CNPJ.");
        }

        company.User.Name = request.ResponsibleName.Trim();
        company.CompanyName = request.CompanyName.Trim();
        company.Description = request.Description.TrimToNull();
        company.Cnpj = cnpj;
        company.Industry = request.Industry.TrimToNull();
        company.City = request.City.TrimToNull();
        company.State = request.State.ToUpperTrimmed();
        company.Website = request.Website.TrimToNull();

        await db.SaveChangesAsync(ct);
        return await ProjectAsync(company.Id, ct) ?? throw new NotFoundException("Empresa não encontrada.");
    }

    private Task<CompanyProfileDto?> ProjectAsync(int companyId, CancellationToken ct)
    {
        var today = AppTime.Today(clock);
        return db.CompanyProfiles
            .AsNoTracking()
            .Where(c => c.Id == companyId)
            .Select(c => new CompanyProfileDto
            {
                Id = c.Id,
                UserId = c.UserId,
                CompanyName = c.CompanyName,
                ResponsibleName = c.User.Name,
                Email = c.User.Email,
                Description = c.Description,
                Cnpj = c.Cnpj,
                Industry = c.Industry,
                City = c.City,
                State = c.State,
                Website = c.Website,
                Logo = c.Logo,
                ActiveJobsCount = c.Jobs.Count(j => j.Status == JobStatus.Active && (j.Deadline == null || j.Deadline >= today)),
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync(ct);
    }

    private static CompanyProfileDto WithoutPrivateData(CompanyProfileDto dto) => new()
    {
        Id = dto.Id,
        UserId = dto.UserId,
        CompanyName = dto.CompanyName,
        ResponsibleName = dto.ResponsibleName,
        Email = null,
        Description = dto.Description,
        Cnpj = dto.Cnpj,
        Industry = dto.Industry,
        City = dto.City,
        State = dto.State,
        Website = dto.Website,
        Logo = dto.Logo,
        ActiveJobsCount = dto.ActiveJobsCount,
        CreatedAt = dto.CreatedAt
    };
}
