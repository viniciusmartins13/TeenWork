using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Media;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

public sealed class ImageUploadForm
{
    /// <summary>Imagem JPG, PNG ou WEBP de até 2 MB.</summary>
    public IFormFile? File { get; set; }
}

/// <summary>Upload de foto de perfil e logo da empresa.</summary>
[Authorize]
public sealed class UploadsController(IMediaService mediaService) : ApiControllerBase
{
    private const long RequestLimit = 3 * 1024 * 1024;

    /// <summary>Envia a foto de perfil do usuário logado (campo "file").</summary>
    [HttpPost("api/users/me/photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(RequestLimit)]
    [ProducesResponseType(typeof(ApiResponse<ImageUploadResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadPhoto([FromForm] ImageUploadForm form, CancellationToken ct)
    {
        var file = RequireFile(form);
        await using var stream = file.OpenReadStream();
        return OkData(await mediaService.UploadProfilePhotoAsync(stream, file.Length, ct), "Foto atualizada.");
    }

    /// <summary>Remove a foto de perfil do usuário logado.</summary>
    [HttpDelete("api/users/me/photo")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemovePhoto(CancellationToken ct)
    {
        await mediaService.RemoveProfilePhotoAsync(ct);
        return NoContent();
    }

    /// <summary>Envia a logo da empresa logada (campo "file").</summary>
    [HttpPost("api/companies/me/logo")]
    [Authorize(Roles = Roles.Company)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(RequestLimit)]
    [ProducesResponseType(typeof(ApiResponse<ImageUploadResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadLogo([FromForm] ImageUploadForm form, CancellationToken ct)
    {
        var file = RequireFile(form);
        await using var stream = file.OpenReadStream();
        return OkData(await mediaService.UploadCompanyLogoAsync(stream, file.Length, ct), "Logo atualizada.");
    }

    /// <summary>Remove a logo da empresa logada.</summary>
    [HttpDelete("api/companies/me/logo")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveLogo(CancellationToken ct)
    {
        await mediaService.RemoveCompanyLogoAsync(ct);
        return NoContent();
    }

    private static IFormFile RequireFile(ImageUploadForm form) =>
        form.File is { Length: > 0 } file
            ? file
            : throw new BadRequestException("Selecione uma imagem para enviar.",
                [new ApiError("file", "Selecione uma imagem para enviar.")]);
}
