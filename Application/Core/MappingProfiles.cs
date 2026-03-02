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
        CreateMap<RoundDto, Round>();
    }
}
