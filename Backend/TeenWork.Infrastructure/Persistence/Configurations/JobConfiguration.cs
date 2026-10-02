using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class JobConfiguration : IEntityTypeConfiguration<Job>
{
    public void Configure(EntityTypeBuilder<Job> builder)
    {
        builder.ToTable("Jobs");
        builder.HasKey(j => j.Id);

        builder.Property(j => j.Title).HasMaxLength(150).IsRequired();
        builder.Property(j => j.Description).HasColumnType("text").IsRequired();
        builder.Property(j => j.Requirements).HasColumnType("text");
        builder.Property(j => j.Benefits).HasColumnType("text");
        builder.Property(j => j.Area).HasMaxLength(80).IsRequired();
        builder.Property(j => j.City).HasMaxLength(100).IsRequired();
        builder.Property(j => j.State).HasMaxLength(2).IsFixedLength().IsRequired();
        builder.Property(j => j.WorkModel).IsRequired();
        builder.Property(j => j.JobType).IsRequired();
        builder.Property(j => j.Salary).HasPrecision(10, 2);
        builder.Property(j => j.Workload).HasMaxLength(60);
        builder.Property(j => j.Vacancies).IsRequired();
        builder.Property(j => j.Status).IsRequired();

        builder.HasIndex(j => j.CompanyId);
        builder.HasIndex(j => new { j.Status, j.CreatedAt });
        builder.HasIndex(j => j.Area);
        builder.HasIndex(j => new { j.State, j.City });

        builder.HasMany(j => j.Applications)
            .WithOne(a => a.Job)
            .HasForeignKey(a => a.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(j => j.SavedBy)
            .WithOne(s => s.Job)
            .HasForeignKey(s => s.JobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
