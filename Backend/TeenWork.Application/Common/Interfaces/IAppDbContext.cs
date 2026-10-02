using Microsoft.EntityFrameworkCore;
using TeenWork.Domain.Entities;

namespace TeenWork.Application.Common.Interfaces;

/// <summary>
/// Abstração do DbContext usada pelos serviços. O DbContext do EF Core já implementa
/// Unit of Work + Repository, então repositórios genéricos adicionais seriam redundantes.
/// </summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<StudentProfile> StudentProfiles { get; }
    DbSet<StudentExperience> StudentExperiences { get; }
    DbSet<CompanyProfile> CompanyProfiles { get; }
    DbSet<Job> Jobs { get; }
    DbSet<JobApplication> Applications { get; }
    DbSet<SavedJob> SavedJobs { get; }
    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
