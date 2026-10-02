using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> builder)
    {
        builder.ToTable("StudentProfiles");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.School).HasMaxLength(150);
        builder.Property(s => s.Course).HasMaxLength(120);
        builder.Property(s => s.SchoolYear).HasMaxLength(40);
        builder.Property(s => s.City).HasMaxLength(100);
        builder.Property(s => s.State).HasMaxLength(2).IsFixedLength();
        builder.Property(s => s.Bio).HasMaxLength(1500);
        builder.Property(s => s.Skills).HasMaxLength(1300);
        builder.Property(s => s.PortfolioUrl).HasMaxLength(300);

        builder.HasIndex(s => s.UserId).IsUnique();

        builder.HasMany(s => s.Experiences)
            .WithOne(e => e.Student)
            .HasForeignKey(e => e.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
