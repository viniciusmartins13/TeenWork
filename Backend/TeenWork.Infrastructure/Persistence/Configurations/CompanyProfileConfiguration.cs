using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class CompanyProfileConfiguration : IEntityTypeConfiguration<CompanyProfile>
{
    public void Configure(EntityTypeBuilder<CompanyProfile> builder)
    {
        builder.ToTable("CompanyProfiles");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.CompanyName).HasMaxLength(150).IsRequired();
        builder.Property(c => c.Description).HasColumnType("text");
        builder.Property(c => c.Cnpj).HasMaxLength(14).IsFixedLength();
        builder.Property(c => c.Industry).HasMaxLength(80);
        builder.Property(c => c.City).HasMaxLength(100);
        builder.Property(c => c.State).HasMaxLength(2).IsFixedLength();
        builder.Property(c => c.Website).HasMaxLength(300);
        builder.Property(c => c.Logo).HasMaxLength(300);

        builder.HasIndex(c => c.UserId).IsUnique();
        builder.HasIndex(c => c.Cnpj).IsUnique();
        builder.HasIndex(c => c.CompanyName);

        builder.HasMany(c => c.Jobs)
            .WithOne(j => j.Company)
            .HasForeignKey(j => j.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
