using System;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;

namespace Application.Core;

public class MappingProfiles : Profile
{

    public MappingProfiles()
    {
        CreateMap<CreateLeagueDto, League>();
        CreateMap<CreateLeagueMemberDto, LeagueMember>();
        CreateMap<User, UserDto>();
        CreateMap<League, LeagueDto>();
        CreateMap<LeagueMember, LeagueMemberDto>()
            .ForMember(x => x.DisplayName, o => o.MapFrom(s => s.User.DisplayName))
            .ForMember(x => x.IsGuest, o => o.MapFrom(s => s.User.IsGuest));
        CreateMap<Match, MatchDto>();
        CreateMap<Round, RoundDto>();
        CreateMap<RoundDto, Round>();
    }
}
