using System;
using Domain;

namespace Persistence;

public class SeasonOneLeague
{
    public static League GetSeasonOne()
    {
        var matches = GetMatches();
        var league = new League
        {
            Id = "season-one-league-id",
            Title = "Syb Season One (Trondhomies)",
            Description = "epic! Ble spilt V23/H24. Kjent som 'Sesong OPP B'",
            Status = LeagueStatus.Active,
            Members = [.. GetUsers().Select(u => new LeagueMember
            {
                UserId = u.Id,
            })],
            StartDate = new DateTime(2023, 11, 10),
            Matches = matches
        };

        return league;
    }
    public static List<Match> GetMatches()
    {
        var leagueId = "season-one-league-id";
        var split = 1;
        var matchesCore = GetMatchesCore();
        var matches = matchesCore.Select((mc, index) => new Match
        {
            LeagueId = leagueId,
            Completed = true,
            PlayerOneUserId = mc.P1,
            PlayerTwoUserId = mc.P2,
            WinnerUserId = mc.W,
            Split = split,
            MatchNumber = index + 1,
            RegisteredTime = DateTime.UtcNow,
            Rounds = [.. mc.R.Select((r, roundIndex) => new Round
            {
                LeagueId = leagueId,
                MatchNumber = index + 1,
                Split = split,
                RoundNumber = roundIndex + 1,
                PlayerOneCharacterId = r.Item1,
                PlayerTwoCharacterId = r.Item2,
                WinnerUserId = r.Item3,
                Completed = true
            })]
        }).ToList();

        return matches;
    }
    public class MatchCore
    {
        public required string P1 { get; set; }
        public required string P2 { get; set; }
        public required string W { get; set; }
        public required (string, string, string)[] R { get; set; } // (char1, char2, winner)
    }
    public static List<MatchCore> GetMatchesCore()
    {
        // Each match: p1 = player one, p2 = player two, w = winner, r = rounds (array of tuples)
        var matches = new List<MatchCore>
        {
            new() {
                P1 = "matias",
                P2 = "bh",
                W = "matias",
                R = [
                    ("king_k_rool", "samus", "matias"),
                    ("ness", "villager", "matias"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "denix",
                W = "denix",
                R = [
                    ("yoshi", "king_k_rool", "denix"),
                    ("ness", "hero", "denix"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "larsski",
                W = "hansemann",
                R = [
                    ("yoshi", "pyra_mythra", "larsski"),
                    ("incineroar", "joker", "hansemann"),
                    ("ness", "king_k_rool", "hansemann"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "bennern",
                W = "hansemann",
                R = [
                    ("yoshi", "zelda", "hansemann"),
                    ("ness", "inkling", "hansemann"),
                ]
            },
            new() {
                P1 = "bennern",
                P2 = "bh",
                W = "bh",
                R = [
                    ("villager", "samus", "bh"),
                    ("inkling", "villager", "bennern"),
                    ("bowser_jr", "dark_pit", "bh"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "bennern",
                W = "denix",
                R = [
                    ("king_k_rool", "inkling", "bennern"),
                    ("incineroar", "peach", "denix"),
                    ("hero", "mario", "denix"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "bennern",
                W = "bennern",
                R = [
                    ("villager", "min_min", "bennern"),
                    ("link", "bowser_jr", "bennern"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "denix",
                W = "denix",
                R = [
                    ("min_min", "incineroar", "timmeehh"),
                    ("byleth", "king_k_rool", "denix"),
                    ("sora", "hero", "denix"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "bennern",
                W = "bennern",
                R = [
                    ("byleth", "inkling", "bennern"),
                    ("luigi", "zelda", "sander"),
                    ("ness", "king_dededede", "bennern"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "larsski",
                W = "timmeehh",
                R = [
                    ("min_min", "pyra_mythra", "timmeehh"),
                    ("byleth", "joker", "larsski"),
                    ("sora", "captain_falcon", "timmeehh"),
                ]
            },
            // 10+ vvv
            new() {
                P1 = "eirik",
                P2 = "oliver",
                W = "oliver",
                R = [
                    ("sephiroth", "duck_hunt_duo", "oliver"),
                    ("ridley", "sora", "eirik"),
                    ("palutena", "joker", "oliver"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "oliver",
                W = "oliver",
                R = [
                    ("byleth", "joker", "oliver"),
                    ("toon_link", "duck_hunt_duo", "oliver"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "cpu",
                W = "sander",
                R = [
                    ("byleth", "king_dededede", "sander"),
                    ("donkey_kong", "king_dededede", "cpu"),
                    ("corrin", "king_dededede", "sander"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "larsski",
                W = "denix",
                R = [
                    ("king_k_rool", "captain_falcon", "denix"),
                    ("incineroar", "joker", "denix"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "larsski",
                W = "sander",
                R = [
                    ("byleth", "joker", "sander"),
                    ("luigi", "pyra_mythra", "sander"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "cpu",
                W = "timmeehh",
                R = [
                    ("min_min", "king_dededede", "cpu"),
                    ("byleth", "king_dededede", "timmeeh"),
                    ("link", "king_dededede", "timmeeh"),
                ]
            },
            new() {
                P1 = "matias",
                P2 = "cpu",
                W = "matias",
                R = [
                    ("king_k_rool", "king_dededede", "matias"),
                    ("piranha_plant", "king_dededede", "matias"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "cpu",
                W = "eirik",
                R = [
                    ("palutena", "king_dededede", "eirik"),
                    ("ridley", "king_dededede", "eirik"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "matias",
                W = "eirik",
                R = [
                    ("palutena", "dark_samus", "eirik"),
                    ("isabelle", "ness", "eirik"),
                ]
            },
            //20+ vv
            new() {
                P1 = "matias",
                P2 = "larsski",
                W = "larsski",
                R = [
                    ("king_k_rool", "joker", "matias"),
                    ("incineroar", "captain_falcon", "larsski"),
                    ("piranha_plant", "pyra_mythra", "larsski"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "bh",
                W = "denix",
                R = [
                    ("king_k_rool", "incineroar", "denix"),
                    ("hero", "dark_samus", "bh"),
                    ("incineroar", "dark_pit", "denix"),
                ]
            },
            new() {
                P1 = "larsengstad",
                P2 = "cpu",
                W = "larsengstad",
                R = [
                    ("link", "king_dededede", "larsengstad"),
                    ("donkey_kong", "king_dededede", "larsengstad"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "bh",
                W = "eirik",
                R = [
                    ("ridley", "samus", "eirik"),
                    ("sephiroth", "cloud", "eirik"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "larsengstad",
                W = "larsengstad",
                R = [
                    ("min_min", "wii_fit_trainer", "timmeehh"),
                    ("byleth", "captain_falcon", "larsengstad"),
                    ("link", "piranha_plant", "larsengstad"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "bh",
                W = "bh",
                R = [
                    ("byleth", "samus", "bh"),
                    ("min_min", "cloud", "timmeeh"),
                    ("ganondorf", "incineroar", "bh"),
                ]
            },
            new() {
                P1 = "larsengstad",
                P2 = "bh",
                W = "bh",
                R = [
                    ("isabelle", "dark_pit", "bh"),
                    ("piranha_plant", "samus", "bh"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "sander",
                W = "sander",
                R = [
                    ("ganondorf", "byleth", "sander"),
                    ("min_min", "robin", "timmeeh"),
                    ("sora", "donkey_kong", "sander"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "timmeehh",
                W = "hansemann",
                R = [
                    ("yoshi", "min_min", "hansemann"),
                    ("ness", "captain_falcon", "hansemann"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "larsengstad",
                W = "eirik",
                R = [
                    ("sephiroth", "captain_falcon", "eirik"),
                    ("ridley", "link", "eirik"),
                ]
            },
            //30+ vv
            new() {
                P1 = "sander",
                P2 = "bh",
                W = "sander",
                R = [
                    ("byleth", "incineroar", "sander"),
                    ("mario", "samus", "bh"),
                    ("luigi", "villager", "sander"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "bh",
                W = "hansemann",
                R = [
                    ("yoshi", "samus", "hansemann"),
                    ("ness", "dark_pit", "hansemann"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "larsengstad",
                W = "larsengstad",
                R = [
                    ("luigi", "link", "larsengstad"),
                    ("ness", "piranha_plant", "larsengstad"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "timmeehh",
                W = "timmeehh",
                R = [
                    ("isabelle", "min_min", "timmeehh"),
                    ("palutena", "byleth", "timmeehh"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "larsski",
                W = "eirik",
                R = [
                    ("sephiroth", "joker", "eirik"),
                    ("mewtwo", "pyra_mythra", "eirik"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "matias",
                W = "matias",
                R = [
                    ("captain_falcon", "king_k_rool", "matias"),
                    ("min_min", "ness", "matias"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "cpu",
                W = "denix",
                R = [
                    ("king_k_rool", "king_dededede", "denix"),
                    ("incineroar", "king_dededede", "denix"),
                ]
            },
            new() {
                P1 = "larsski",
                P2 = "cpu",
                W = "cpu",
                R = [
                    ("pyra_mythra", "king_dededede", "larsski"),
                    ("joker", "king_dededede", "cpu"),
                    ("captain_falcon", "king_dededede", "cpu"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "denix",
                W = "eirik",
                R = [
                    ("sephiroth", "hero", "eirik"),
                    ("ridley", "king_k_rool", "eirik"),
                ]
            },
            new() {
                P1 = "bh",
                P2 = "cpu",
                W = "cpu",
                R = [
                    ("samus", "king_dededede", "bh"),
                    ("cloud", "king_dededede", "cpu"),
                    ("king_k_rool", "king_dededede", "cpu"),
                ]
            },
            //40+ vv
            new() {
                P1 = "hansemann",
                P2 = "sander",
                W = "sander",
                R = [
                    ("ness", "luigi", "hansemann"),
                    ("yoshi", "byleth", "sander"),
                    ("incineroar", "corrin", "sander"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "matias",
                W = "hansemann",
                R = [
                    ("cloud", "ness", "hansemann"),
                    ("ness", "king_k_rool", "hansemann"),
                ]
            },
            new() {
                P1 = "larsengstad",
                P2 = "oliver",
                W = "larsengstad",
                R = [
                    ("isabelle", "duck_hunt_duo", "larsengstad"),
                    ("captain_falcon", "joker", "larsengstad"),
                ]
            },
            new() {
                P1 = "matias",
                P2 = "sander",
                W = "sander",
                R = [
                    ("ness", "ness", "sander"),
                    ("piranha_plant", "mario", "sander"),
                ]
            },
            new() {
                P1 = "oliver",
                P2 = "bh",
                W = "oliver",
                R = [
                    ("joker", "banjoo_and_kazooie", "oliver"),
                    ("pikachu", "samus", "oliver"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "sander",
                W = "eirik",
                R = [
                    ("palutena", "luigi", "sander"),
                    ("ridley", "byleth", "eirik"),
                    ("sephiroth", "donkey_kong", "eirik"),
                ]
            },
            new() {
                P1 = "larsengstad",
                P2 = "bennern",
                W = "larsengstad",
                R = [
                    ("link", "isabelle", "larsengstad"),
                    ("piranha_plant", "inkling", "bennern"),
                    ("captain_falcon", "zelda", "larsengstad"),
                ]
            },
            new() {
                P1 = "matias",
                P2 = "denix",
                W = "matias",
                R = [
                    ("ness", "mr_game_watch", "matias"),
                    ("lucas", "king_k_rool", "denix"),
                    ("piranha_plant", "incineroar", "matias"),
                ]
            },
            new() {
                P1 = "matias",
                P2 = "oliver",
                W = "oliver",
                R = [
                    ("ness", "joker", "oliver"),
                    ("lucas", "corrin", "oliver"),
                ]
            },
            new() {
                P1 = "oliver",
                P2 = "larsski",
                W = "oliver",
                R = [
                    ("joker", "captain_falcon", "oliver"),
                    ("duck_hunt_duo", "pyra_mythra", "oliver"),
                ]
            },
            //50+ vv
            new() {
                P1 = "bennern",
                P2 = "larsski",
                W = "larsski",
                R = [
                    ("inkling", "king_k_rool", "bennern"),
                    ("king_dededede", "joker", "larsski"),
                    ("zelda", "pyra_mythra", "larsski"),
                ]
            },
            new() {
                P1 = "larsski",
                P2 = "bh",
                W = "bh",
                R = [
                    ("joker", "dark_pit", "bh"),
                    ("pyra_mythra", "samus", "bh"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "eirik",
                W = "hansemann",
                R = [
                    ("yoshi", "mr_game_watch", "hansemann"),
                    ("ness", "falco", "hansemann"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "oliver",
                W = "denix",
                R = [
                    ("hero", "joker", "denix"),
                    ("king_k_rool", "duck_hunt_duo", "denix"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "larsengstad",
                W = "denix",
                R = [
                    ("incineroar", "isabelle", "denix"),
                    ("king_k_rool", "captain_falcon", "larsengstad"),
                    ("hero", "piranha_plant", "denix"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "denix",
                W = "denix",
                R = [
                    ("ness", "hero", "sander"),
                    ("mario", "king_k_rool", "denix"),
                    ("bowser", "mewtwo", "denix"),
                ]
            },
        };
        return matches;
    }
    public static List<User> GetUsers()
    {
        return
        [
            new() { Id = "denix", DisplayName = "Denix", UserName = "denix@test.com", Email = "denix@test.com" },
            new() { Id = "eirik", DisplayName = "Eirik", UserName = "eirik@test.com", Email = "eirik@test.com" },
            new() { Id = "hansemann", DisplayName = "Hansemann", UserName = "hansemann@test.com", Email = "hansemann@test.com" },
            new() { Id = "sander", DisplayName = "Sander", UserName = "sander@test.com", Email = "sander@test.com" },
            new() { Id = "oliver", DisplayName = "Oliver", UserName = "oliver@test.com", Email = "oliver@test.com" },
            new() { Id = "larsengstad", DisplayName = "Larsengstad", UserName = "larsengstad@test.com", Email = "larsengstad@test.com" },
            new() { Id = "matias", DisplayName = "Matias", UserName = "matias@test.com", Email = "matias@test.com" },
            new() { Id = "bh", DisplayName = "Bh", UserName = "bh@test.com", Email = "bh@test.com" },
            new() { Id = "timmeehh", DisplayName = "Timmeehh", UserName = "timmeehh@test.com", Email = "timmeehh@test.com" },
            new() { Id = "bennern", DisplayName = "Bennern", UserName = "bennern@test.com", Email = "bennern@test.com" },
            new() { Id = "larsski", DisplayName = "Larsski", UserName = "larsski@test.com", Email = "larsski@test.com" },
            new() { Id = "cpu", DisplayName = "CPU-LVL-9", UserName = "cpu@test.com", Email = "cpu@test.com" },
        ];
    }

}
