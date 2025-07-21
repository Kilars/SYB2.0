using System;
using System.Security.Cryptography.X509Certificates;
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
            .ForMember(x => x.Id, o => o.MapFrom(
                s => $"{s.UserId}_{s.LeagueId}"
            ));
        CreateMap<Match, MatchDto>()
            .ForMember(x => x.Id, o => o.MapFrom(
                s => $"{s.LeagueId}_{s.Split}_{s.MatchIndex}"
            ));
    }
}
