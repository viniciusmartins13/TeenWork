namespace TeenWork.Application.Common.Models;

/// <summary>Parâmetros comuns de paginação (?page=1&amp;pageSize=10).</summary>
public abstract class PaginationQuery
{
    public const int MaxPageSize = 50;

    /// <summary>Página atual (a partir de 1).</summary>
    public int Page { get; set; } = 1;

    /// <summary>Itens por página (1 a 50).</summary>
    public int PageSize { get; set; } = 10;

    public int GetSkip() => (Page - 1) * PageSize;
}
