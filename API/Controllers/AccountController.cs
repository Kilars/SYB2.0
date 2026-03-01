using System;
using System.Linq;
using API.DTOs;
using Application;
using Application.Guests.Commands;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountController(SignInManager<User> signInManager) : BaseApiController
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult> RegisterUser(RegisterDto registerDto)
    {
        var user = new User
        {
            UserName = registerDto.Email,
            Email = registerDto.Email,
            DisplayName = registerDto.DisplayName
        };

        var result = await signInManager.UserManager.CreateAsync(user, registerDto.Password);

        if (result.Succeeded) return Ok();

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(error.Code, error.Description);
        }

        return ValidationProblem();
    }

    [HttpGet("users")]
    public async Task<ActionResult> GetUsers()
    {
        var users = await signInManager.UserManager.Users
            .Select(u => new UserDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName ?? "",
                ImageUrl = u.ImageUrl ?? "",
                IsGuest = u.IsGuest,
                Bio = u.Bio
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("guest")]
    public async Task<ActionResult> CreateGuest(CreateGuest.Command command)
    {
        return HandleResult(await Mediator.Send(command));
    }

    [HttpPost("merge-guest")]
    public async Task<ActionResult> MergeGuest(MergeGuest.Command command)
    {
        return HandleResult(await Mediator.Send(command));
    }

    [AllowAnonymous]
    [HttpGet("user-info")]
    public async Task<ActionResult> GetUserInfo()
    {
        if (User.Identity?.IsAuthenticated == false) return NoContent();

        var user = await signInManager.UserManager.GetUserAsync(User);

        if (user == null) return Unauthorized();

        return Ok(new
        {
            user.DisplayName,
            user.Email,
            user.Id,
            user.ImageUrl
        });
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return NoContent();
    }
}
