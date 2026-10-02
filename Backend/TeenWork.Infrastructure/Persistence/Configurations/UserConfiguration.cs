using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name).HasMaxLength(120).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(180).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(100).IsRequired();
        builder.Property(u => u.UserType).IsRequired();
        builder.Property(u => u.ProfileImage).HasMaxLength(300);
        builder.Property(u => u.IsActive).IsRequired();
        builder.Property(u => u.PasswordResetTokenHash).HasMaxLength(64);

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.UserType);

        builder.HasOne(u => u.StudentProfile)
            .WithOne(s => s.User)
            .HasForeignKey<StudentProfile>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.CompanyProfile)
            .WithOne(c => c.User)
            .HasForeignKey<CompanyProfile>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.Notifications)
            .WithOne(n => n.User)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
