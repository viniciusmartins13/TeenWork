using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeenWork.Domain.Entities;

namespace TeenWork.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title).HasMaxLength(150).IsRequired();
        builder.Property(n => n.Message).HasMaxLength(1500).IsRequired();
        builder.Property(n => n.Type).IsRequired();
        builder.Property(n => n.Link).HasMaxLength(300);

        builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
    }
}
