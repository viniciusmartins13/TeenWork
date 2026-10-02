using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Common.Validation;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Admin;

public sealed class AdminStatsDto
{
    public int Students { get; init; }
    public int Companies { get; init; }
    public int Jobs { get; init; }
    public int ActiveJobs { get; init; }
    public int Applications { get; init; }
    public int AcceptedApplications { get; init; }
}

public sealed class AdminUserDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public UserType UserType { get; init; }
    public bool IsActive { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class AdminUserQuery : PaginationQuery
{
    public string? Search { get; set; }
    public UserType? UserType { get; set; }
}

public sealed class AdminUserQueryValidator : PaginationQueryValidator<AdminUserQuery>
{
    public AdminUserQueryValidator()
    {
        RuleFor(x => x.Search).MaximumLength(100);
        RuleFor(x => x.UserType).IsInEnum().When(x => x.UserType.HasValue).WithMessage("Tipo de usuário inválido.");
    }
}

public sealed class SetUserActiveRequest
{
    public bool IsActive { get; set; }
}

public interface IAdminService
{
    Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default);
    Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserQuery query, CancellationToken ct = default);
    Task SetUserActiveAsync(int userId, SetUserActiveRequest request, CancellationToken ct = default);
}

/// <summary>Base da área administrativa (estatísticas e moderação de contas).</summary>
public sealed class AdminService(IAppDbContext db, ICurrentUser currentUser) : IAdminService
{
    public async Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default) => new()
    {
        Students = await db.Users.CountAsync(u => u.UserType == UserType.Student, ct),
        Companies = await db.Users.CountAsync(u => u.UserType == UserType.Company, ct),
        Jobs = await db.Jobs.CountAsync(ct),
        ActiveJobs = await db.Jobs.CountAsync(j => j.Status == JobStatus.Active, ct),
        Applications = await db.Applications.CountAsync(a => a.Status != ApplicationStatus.Cancelled, ct),
        AcceptedApplications = await db.Applications.CountAsync(a => a.Status == ApplicationStatus.Accepted, ct)
    };

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserQuery query, CancellationToken ct = default)
    {
        var users = db.Users.AsNoTracking();

        if (query.Search.TrimToNull() is { } search)
        {
            users = users.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
        }

        if (query.UserType is { } type)
        {
            users = users.Where(u => u.UserType == type);
        }

        return await users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                UserType = u.UserType,
                IsActive = u.IsActive,
                LastLoginAt = u.LastLoginAt,
                CreatedAt = u.CreatedAt
            })
            .ToPagedResultAsync(query, ct);
    }

    public async Task SetUserActiveAsync(int userId, SetUserActiveRequest request, CancellationToken ct = default)
    {
        if (userId == currentUser.GetRequiredUserId())
        {
            throw new BusinessRuleException("Você não pode desativar a sua própria conta de administrador.");
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("Usuário não encontrado.");

        if (user.UserType == UserType.Admin && !currentUser.IsInRole(Roles.Admin))
        {
            throw new ForbiddenException("Operação não permitida.");
        }

        user.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
    }
}
