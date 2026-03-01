using System;
using Microsoft.AspNetCore.Identity;

namespace Domain;

public class User : IdentityUser
{

    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsGuest { get; set; } = false;

    // Nav properties
    public ICollection<LeagueMember> LeagueMembers { get; set; } = [];
}
