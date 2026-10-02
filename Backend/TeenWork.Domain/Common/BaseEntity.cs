namespace TeenWork.Domain.Common;

/// <summary>
/// Base para todas as entidades persistidas. As datas são gravadas em UTC
/// e preenchidas automaticamente pelo DbContext.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
