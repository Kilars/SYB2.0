using System;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;

namespace Application.Core;

public class MappingProfiles : Profile
{

    public MappingProfiles()
    {
        CreateMap<CreateLeagueDto, League>()
            .ForMember(x => x.Members, o => o.MapFrom(
                s => s.Members.Select(memberString => new LeagueMember { DisplayName = memberString })
            ));


    }
}
