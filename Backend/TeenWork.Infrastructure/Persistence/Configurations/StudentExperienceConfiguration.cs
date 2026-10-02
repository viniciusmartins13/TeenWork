using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class StudentExperienceConfiguration : IEntityTypeConfiguration<StudentExperience>
{
    public void Configure(EntityTypeBuilder<StudentExperience> builder)
    {
        builder.ToTable("StudentExperiences");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title).HasMaxLength(120).IsRequired();
        builder.Property(e => e.Organization).HasMaxLength(150).IsRequired();
        builder.Property(e => e.Type).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(1500);

        builder.HasIndex(e => e.StudentId);
    }
}
