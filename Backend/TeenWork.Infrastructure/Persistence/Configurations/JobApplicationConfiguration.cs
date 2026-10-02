using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class JobApplicationConfiguration : IEntityTypeConfiguration<JobApplication>
{
    public void Configure(EntityTypeBuilder<JobApplication> builder)
    {
        builder.ToTable("Applications");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Status).IsRequired();
        builder.Property(a => a.CoverLetter).HasColumnType("text");
        builder.Property(a => a.CompanyFeedback).HasMaxLength(1000);

        // Regra de negócio garantida também pelo banco: um aluno só tem uma candidatura por vaga.
        builder.HasIndex(a => new { a.JobId, a.StudentId }).IsUnique();
        builder.HasIndex(a => new { a.StudentId, a.Status });

        builder.HasOne(a => a.Student)
            .WithMany(s => s.Applications)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
