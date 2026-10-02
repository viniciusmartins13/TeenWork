using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class SavedJobConfiguration : IEntityTypeConfiguration<SavedJob>
{
    public void Configure(EntityTypeBuilder<SavedJob> builder)
    {
        builder.ToTable("SavedJobs");
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => new { s.StudentId, s.JobId }).IsUnique();
        builder.HasIndex(s => s.JobId);

        builder.HasOne(s => s.Student)
            .WithMany(st => st.SavedJobs)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
