using System;

namespace Application;

public class UserDto
{

    public required string Id { get; set; }
    public required string DisplayName { get; set; }
    public required string ImageUrl { get; set; }
    public string? Bio { get; set; }
    public bool IsGuest { get; set; }
}
