using Microsoft.EntityFrameworkCore;

namespace TeenWork.Application.Common.Models;

public static class QueryableExtensions
{
    /// <summary>
    /// Executa a contagem total e a página solicitada. A consulta já deve estar ordenada.
    /// </summary>
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PaginationQuery pagination,
        CancellationToken cancellationToken = default)
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip(pagination.GetSkip())
            .Take(pagination.PageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<T>.Create(items, pagination.Page, pagination.PageSize, total);
    }

    /// <summary>Converte os itens de uma página já materializada, preservando os metadados.</summary>
    public static PagedResult<TOut> Map<TIn, TOut>(this PagedResult<TIn> page, Func<TIn, TOut> map) =>
        PagedResult<TOut>.Create(page.Items.Select(map).ToList(), page.Page, page.PageSize, page.TotalItems);
}
