using System;
using System.Text.Json.Serialization;

namespace Domain;

public class Character
{
    public string Id { get; set; } = new Guid().ToString();
    public required string FullName { get; set; }
    public required string ShorthandName { get; set; }
    public string? ImageUrl { get; set; }

    //Nav properties
    [JsonIgnore]
    public ICollection<Round> RoundsAsPlayerOne { get; set; } = [];
    [JsonIgnore]
    public ICollection<Round> RoundsAsPlayerTwo { get; set; } = [];
}
