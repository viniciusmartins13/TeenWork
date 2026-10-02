using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TeenWork.Application.Common.Interfaces;

namespace TeenWork.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";
    public const string PublicRequestPath = "/uploads";

    /// <summary>Pasta física dos uploads. Relativa à raiz do projeto (ContentRoot) quando não for absoluta.</summary>
    public string UploadsPath { get; set; } = "uploads";

    public string ResolveRoot(string contentRootPath)
    {
        var root = Path.IsPathRooted(UploadsPath) ? UploadsPath : Path.Combine(contentRootPath, UploadsPath);
        return Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar);
    }
}

/// <summary>Armazena arquivos no disco local, servidos pela API em /uploads.</summary>
public sealed class LocalFileStorage(IOptions<StorageOptions> options, IHostEnvironment environment) : IFileStorage
{
    private readonly string _root = options.Value.ResolveRoot(environment.ContentRootPath);

    public async Task<string> SaveAsync(Stream content, string extension, string folder, CancellationToken cancellationToken = default)
    {
        var safeFolder = new string(folder.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        var safeExtension = "." + new string(extension.TrimStart('.').Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        if (safeFolder.Length == 0 || safeExtension.Length < 2)
        {
            throw new ArgumentException("Pasta ou extensão inválida.");
        }

        var directory = Path.Combine(_root, safeFolder);
        Directory.CreateDirectory(directory);

        var fileName = $"{Guid.NewGuid():N}{safeExtension}";
        var fullPath = Path.Combine(directory, fileName);

        await using (var file = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(file, cancellationToken);
        }

        return $"{StorageOptions.PublicRequestPath}/{safeFolder}/{fileName}";
    }

    public void Delete(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl) ||
            !relativeUrl.StartsWith(StorageOptions.PublicRequestPath + "/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var relative = relativeUrl[(StorageOptions.PublicRequestPath.Length + 1)..].Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_root, relative));

        // Impede path traversal: o arquivo precisa estar dentro da pasta de uploads.
        if (!fullPath.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal)) return;

        try
        {
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch (IOException)
        {
            // Falha ao remover arquivo antigo não deve quebrar a operação principal.
        }
    }
}
