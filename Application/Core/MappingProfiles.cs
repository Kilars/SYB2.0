using System;
using Application.Leagues.DTOs;
using Application.Matches.DTOs;
using Application.Tournaments.DTOs;
using AutoMapper;
using Domain;

namespace Application.Core;

public class MappingProfiles : Profile
{

    public MappingProfiles()
    {
        CreateMap<CreateLeagueDto, League>();
        CreateMap<CreateMemberDto, CompetitionMember>();
        CreateMap<User, UserDto>();
        CreateMap<League, LeagueDto>();
        CreateMap<Tournament, TournamentDto>();
        CreateMap<CreateTournamentDto, Tournament>();
        CreateMap<CompetitionMember, CompetitionMemberDto>()
            .ForMember(x => x.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(x => x.IsGuest, o => o.MapFrom(s => s.User.IsGuest));
        CreateMap<Match, MatchDto>();
        CreateMap<Round, RoundDto>();
        // Reverse map: guard NEW Three/Four character fields to prevent silent null overwrites on
        // partial updates. PlayerOne/Two are intentionally UNGUARDED so the existing form can still
        // clear a character selection by setting it to null.
        CreateMap<RoundDto, Round>()
            .ForMember(d => d.PlayerThreeCharacterId, o => o.Condition(s => s.PlayerThreeCharacterId != null))
            .ForMember(d => d.PlayerFourCharacterId, o => o.Condition(s => s.PlayerFourCharacterId != null));
    }
}
