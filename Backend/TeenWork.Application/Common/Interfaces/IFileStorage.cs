namespace TeenWork.Application.Common.Interfaces;

public interface IFileStorage
{
    /// <summary>Salva o conteúdo e retorna a URL relativa pública (ex.: /uploads/avatars/abc.png).</summary>
    Task<string> SaveAsync(Stream content, string extension, string folder, CancellationToken cancellationToken = default);

    /// <summary>Remove um arquivo salvo anteriormente. Ignora URLs externas ou inexistentes.</summary>
    void Delete(string? relativeUrl);
}
