using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;

namespace TeenWork.Application.Media;

public sealed class ImageUploadResult
{
    public string Url { get; init; } = string.Empty;
}

public interface IMediaService
{
    Task<ImageUploadResult> UploadProfilePhotoAsync(Stream content, long length, CancellationToken ct = default);
    Task RemoveProfilePhotoAsync(CancellationToken ct = default);
    Task<ImageUploadResult> UploadCompanyLogoAsync(Stream content, long length, CancellationToken ct = default);
    Task RemoveCompanyLogoAsync(CancellationToken ct = default);
}

/// <summary>
/// Upload de foto de perfil e logo. O tipo do arquivo é identificado pelos bytes iniciais
/// (assinatura), não pela extensão ou Content-Type enviados pelo cliente.
/// </summary>
public sealed class MediaService(IAppDbContext db, ICurrentUser currentUser, IFileStorage storage) : IMediaService
{
    public const long MaxImageBytes = 2 * 1024 * 1024;

    public async Task<ImageUploadResult> UploadProfilePhotoAsync(Stream content, long length, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("Usuário não encontrado.");

        var url = await SaveImageAsync(content, length, "avatars", ct);
        var previous = user.ProfileImage;
        user.ProfileImage = url;
        await db.SaveChangesAsync(ct);
        storage.Delete(previous);

        return new ImageUploadResult { Url = url };
    }

    public async Task RemoveProfilePhotoAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("Usuário não encontrado.");

        var previous = user.ProfileImage;
        user.ProfileImage = null;
        await db.SaveChangesAsync(ct);
        storage.Delete(previous);
    }

    public async Task<ImageUploadResult> UploadCompanyLogoAsync(Stream content, long length, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var company = await db.CompanyProfiles.FirstOrDefaultAsync(c => c.UserId == userId, ct)
            ?? throw new ForbiddenException("Esta ação é exclusiva para contas de empresa.");

        var url = await SaveImageAsync(content, length, "logos", ct);
        var previous = company.Logo;
        company.Logo = url;
        await db.SaveChangesAsync(ct);
        storage.Delete(previous);

        return new ImageUploadResult { Url = url };
    }

    public async Task RemoveCompanyLogoAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var company = await db.CompanyProfiles.FirstOrDefaultAsync(c => c.UserId == userId, ct)
            ?? throw new ForbiddenException("Esta ação é exclusiva para contas de empresa.");

        var previous = company.Logo;
        company.Logo = null;
        await db.SaveChangesAsync(ct);
        storage.Delete(previous);
    }

    private async Task<string> SaveImageAsync(Stream content, long length, string folder, CancellationToken ct)
    {
        if (length <= 0)
        {
            throw new BadRequestException("Selecione uma imagem.");
        }

        if (length > MaxImageBytes)
        {
            throw new BadRequestException("A imagem deve ter no máximo 2 MB.");
        }

        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, ct);
        if (buffer.Length > MaxImageBytes)
        {
            throw new BadRequestException("A imagem deve ter no máximo 2 MB.");
        }

        var extension = DetectImageExtension(buffer.GetBuffer().AsSpan(0, (int)Math.Min(buffer.Length, 16)))
            ?? throw new BadRequestException("Formato não suportado. Envie uma imagem JPG, PNG ou WEBP.");

        buffer.Position = 0;
        return await storage.SaveAsync(buffer, extension, folder, ct);
    }

    internal static string? DetectImageExtension(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return ".jpg";

        if (header.Length >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            return ".png";

        if (header.Length >= 12 &&
            header[..4].SequenceEqual("RIFF"u8) &&
            header.Slice(8, 4).SequenceEqual("WEBP"u8))
            return ".webp";

        return null;
    }
}
