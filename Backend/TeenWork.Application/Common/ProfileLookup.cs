using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Domain.Constants;

namespace TeenWork.Application.Common;

/// <summary>
/// Resolve o perfil (estudante/empresa) do usuário autenticado a partir do UserId do JWT.
/// </summary>
public static class ProfileLookup
{
    public static async Task<int> GetStudentIdAsync(this IAppDbContext db, int userId, CancellationToken ct)
    {
        var id = await db.StudentProfiles
            .Where(s => s.UserId == userId)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(ct);

        return id ?? throw new ForbiddenException("Esta ação é exclusiva para contas de estudante.");
    }

    public static async Task<int> GetCompanyIdAsync(this IAppDbContext db, int userId, CancellationToken ct)
    {
        var id = await db.CompanyProfiles
            .Where(c => c.UserId == userId)
            .Select(c => (int?)c.Id)
            .FirstOrDefaultAsync(ct);

        return id ?? throw new ForbiddenException("Esta ação é exclusiva para contas de empresa.");
    }

    /// <summary>Id do perfil de estudante quando o usuário logado é estudante; nulo caso contrário.</summary>
    public static async Task<int?> TryGetStudentIdAsync(this IAppDbContext db, ICurrentUser currentUser, CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId || !currentUser.IsInRole(Roles.Student))
        {
            return null;
        }

        return await db.StudentProfiles
            .Where(s => s.UserId == userId)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(ct);
    }
}
