using System;
using Domain;

namespace Persistence;

public static class AllCharacters
{

    public static List<Character> GetCharacterList()
    {
        var characters = new List<Character>()
        {
            new() {
                Id = "zero_suit_samus",
                FullName = "Zero Suit Samus",
                ShorthandName = "ZSS",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174165/Zero_suit_samus_gfgmco.webp"
            },
            new() {
                Id = "zelda",
                FullName = "Zelda",
                ShorthandName = "zelda",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174160/Zelda_m3zw5t.webp"
            },
            new() {
                Id = "young_link",
                FullName = "Young Link",
                ShorthandName = "Young Link",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174160/Young_Link_wuef05.webp"
            },
            new() {
                Id = "wolf",
                FullName = "Wolf",
                ShorthandName = "Wolf",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174159/Wolf_hyfp5i.webp"
            },
            new() {
                Id = "yoshi",
                FullName = "Yoshi",
                ShorthandName = "Yoshi",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174159/Yoshi_elftts.webp"
            },
            new() {
                Id = "wario",
                FullName = "Wario",
                ShorthandName = "Wario",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174159/Wario_qa6rvj.webp"
            },
            new() {
                Id = "wii_fit_trainer",
                FullName = "Wii fit trainer",
                ShorthandName = "Wii",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174159/Wii_fit_trainer_y22aap.webp"
            },
            new() {
                Id = "sora",
                FullName = "Sora",
                ShorthandName = "Sora",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174153/Sora_bzmg5y.webp"
            },
            new() {
                Id = "villager",
                FullName = "Villager",
                ShorthandName = "Villager",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174153/Villager_cyopjh.webp"
            },
            new() {
                Id = "toon_link",
                FullName = "Toon Link",
                ShorthandName = "Toon Link",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174153/Toon_Link_csw1bn.webp"
            },
            new() {
                Id = "terry",
                FullName = "Terry",
                ShorthandName = "Terry",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174152/Terry_wnyag1.webp"
            },
            new() {
                Id = "sheik",
                FullName = "Sheik",
                ShorthandName = "Sheik",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174146/Sheik_hfiulr.webp"
            },
            new() {
                Id = "shulk",
                FullName = "Shulk",
                ShorthandName = "Shulk",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174146/Shulk_zuenwa.webp"
            },
            new() {
                Id = "sonic",
                FullName = "Sonic",
                ShorthandName = "Sonic",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174152/Sonic_euzifs.webp"
            },
            new() {
                Id = "snake",
                FullName = "Snake",
                ShorthandName = "Snake",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174152/Snake_wpbvoi.webp"
            },
            new() {
                Id = "simon",
                FullName = "Simon",
                ShorthandName = "Simon",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174152/Simon_ljxbdf.webp"
            },
            new() {
                Id = "steve",
                FullName = "Steve",
                ShorthandName = "Steve",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174152/Steve_a9iolm.webp"
            },
            new() {
                Id = "sephiroth",
                FullName = "Sephiroth",
                ShorthandName = "Sephiroth",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174146/Sephiroth_hyukhw.webp"
            },
            new() {
                Id = "samus",
                FullName = "Samus",
                ShorthandName = "Samus",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174146/Samus_hdb5zf.webp"
            },
            new() {
                Id = "ryu",
                FullName = "Ryu",
                ShorthandName = "Ryu",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174145/Ryu_py8eei.webp"
            },
            new() {
                Id = "roy",
                FullName = "Roy",
                ShorthandName = "Roy",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174145/Roy_fkpzb0.webp"
            },
            new() {
                Id = "rosalina_luma",
                FullName = "Rosalina & Luma",
                ShorthandName = "Rosalina",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174139/Rosalina_and_luma_lelbtw.webp"
            },
            new() {
                Id = "rob",
                FullName = "Rob",
                ShorthandName = "Rob",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174139/Rob_zkchlo.webp"
            },
            new() {
                Id = "robin",
                FullName = "Robin",
                ShorthandName = "Robin",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174139/Robin_ysqcll.webp"
            },
            new() {
                Id = "ridley",
                FullName = "Ridley",
                ShorthandName = "Ridley",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174139/Ridley_oqespi.webp"
            },
            new() {
                Id = "richter",
                FullName = "Richter",
                ShorthandName = "Richter",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174139/Richter_jbbdte.webp"
            },
            new() {
                Id = "pyra_mythra",
                FullName = "Pyra (& mythra)",
                ShorthandName = "Pyra",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174138/Pyra_bomqew.webp"
            },
            new() {
                Id = "pit",
                FullName = "Pit",
                ShorthandName = "Pit",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174138/Pit_sem7mx.webp"
            },
            new() {
                Id = "piranha_plant",
                FullName = "Piranha Plant",
                ShorthandName = "Piranha",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174138/Piranha_Plant_ddinfz.webp"
            },
            new() {
                Id = "palutena",
                FullName = "Palutena",
                ShorthandName = "Palutena",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174131/Palutena_vbrc9z.webp"
            },
            new() {
                Id = "pikachu",
                FullName = "Pikachu",
                ShorthandName = "Pikachu",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174131/Pikachu_lmreou.webp"
            },
            new() {
                Id = "pichu",
                FullName = "Pichu",
                ShorthandName = "Pichu",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174131/Pichu_ygq9z9.webp"
            },
            new() {
                Id = "peach",
                FullName = "Peach",
                ShorthandName = "Peach",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174130/Peach_gjnflh.webp"
            },
            new() {
                Id = "olimar",
                FullName = "Olimar",
                ShorthandName = "Olimar",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174129/Olimar_q3ijms.webp"
            },
            new() {
                Id = "pac_man",
                FullName = "Pac Man",
                ShorthandName = "Pac Man",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174129/Pac_Man_gzry0b.webp"
            },
            new() {
                Id = "min_min",
                FullName = "Min Min",
                ShorthandName = "Min Min",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174129/Min_Min_h1h1r1.webp"
            },
            new() {
                Id = "ness",
                FullName = "Ness",
                ShorthandName = "Ness",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174129/Ness_b448jz.webp"
            },
            new() {
                Id = "mr_game_watch",
                FullName = "Mr. Game & Watch",
                ShorthandName = "Mr. Game",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174129/Mr_game_and_watch_yytsdb.webp"
            },
            new() {
                Id = "mewtwo",
                FullName = "Mewtwo",
                ShorthandName = "Mewtwo",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174122/Mewtwo_vshvvv.webp"
            },
            new() {
                Id = "meta_knight",
                FullName = "Meta Knight",
                ShorthandName = "Meta Knight",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174122/Meta_Knight_fe1hlf.webp"
            },
            new() {
                Id = "mega_man",
                FullName = "Mega Man",
                ShorthandName = "Mega Man",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174122/Mega_Man_ly3t8f.webp"
            },
            new() {
                Id = "marth",
                FullName = "Marth",
                ShorthandName = "Marth",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174122/Marth_fr9prv.webp"
            },
            new() {
                Id = "mario",
                FullName = "Mario",
                ShorthandName = "Mario",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174121/Mario_jb2f9j.webp"
            },
            new() {
                Id = "luigi",
                FullName = "Luigi",
                ShorthandName = "Luigi",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174115/Luigi_bspyrh.webp"
            },
            new() {
                Id = "lucas",
                FullName = "Lucas",
                ShorthandName = "Lucas",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174114/Lucas_fg0jkv.webp"
            },
            new() {
                Id = "lucina",
                FullName = "Lucina",
                ShorthandName = "Lucina",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174114/Lucina_chpv9r.webp"
            },
            new() {
                Id = "lucario",
                FullName = "Lucario",
                ShorthandName = "Lucario",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174114/Lucario_hwkntj.webp"
            },
            new() {
                Id = "little_mac",
                FullName = "Little Mac",
                ShorthandName = "Little Mac",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174114/Little_Mac_vfqors.webp"
            },
            new() {
                Id = "link",
                FullName = "Link",
                ShorthandName = "Link",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174114/Link_ekikfm.webp"
            },
            new() {
                Id = "king_dededede",
                FullName = "King Dededede",
                ShorthandName = "King Dedede",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174113/King_Dedede_gsxnxu.webp"
            },
            new() {
                Id = "kirby",
                FullName = "Kirby",
                ShorthandName = "Kirby",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174113/Kirby_ubwrsr.webp"
            },
            new() {
                Id = "king_k_rool",
                FullName = "King K Rool",
                ShorthandName = "King K Rool",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174113/King_K_Rool_ybhtom.webp"
            },
            new() {
                Id = "ken",
                FullName = "Ken",
                ShorthandName = "Ken",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174113/Ken_md8r2p.webp"
            },
            new() {
                Id = "kazuya",
                FullName = "Kazuya",
                ShorthandName = "Kazuya",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174108/Kazuya_pkdzos.webp"
            },
            new() {
                Id = "inkling",
                FullName = "Inkling",
                ShorthandName = "Inkling",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174108/Inkling_rgwa9i.webp"
            },
            new() {
                Id = "joker",
                FullName = "Joker",
                ShorthandName = "Joker",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174108/Joker_uyjzbr.webp"
            },
            new() {
                Id = "jigglypuff",
                FullName = "Jigglypuff",
                ShorthandName = "Jigglypuff",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174107/Jigglypuff_hysphf.webp"
            },
            new() {
                Id = "isabelle",
                FullName = "Isabelle",
                ShorthandName = "Isabelle",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174107/Isabelle_ucuywo.webp"
            },
            new() {
                Id = "ike",
                FullName = "Ike",
                ShorthandName = "Ike",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174107/Ike_tn0nzp.webp"
            },
            new() {
                Id = "incineroar",
                FullName = "Incineroar",
                ShorthandName = "Incineroar",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174107/Incineroar_w6dbjr.webp"
            },
            new() {
                Id = "ice_climbers",
                FullName = "Ice Climbers",
                ShorthandName = "Ice Climbers",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174107/Ice_Climbers_cqdzkk.webp"
            },
            new() {
                Id = "ganondorf",
                FullName = "Ganondorf",
                ShorthandName = "Ganondorf",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174102/Ganondorf_c3z0fe.webp"
            },
            new() {
                Id = "hero",
                FullName = "Hero",
                ShorthandName = "Hero",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174102/Hero_a34clz.webp"
            },
            new() {
                Id = "greninja",
                FullName = "Greninja",
                ShorthandName = "Greninja",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174102/Greninja_etg8ks.webp"
            },
            new() {
                Id = "fox",
                FullName = "Fox",
                ShorthandName = "Fox",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174102/Fox_wlsybt.webp"
            },
            new() {
                Id = "falco",
                FullName = "Falco",
                ShorthandName = "Falco",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174101/Falco_aughgj.webp"
            },
            new() {
                Id = "duck_hunt_duo",
                FullName = "Duck Hunt Duo",
                ShorthandName = "Duck Hunt",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174101/Duck_Hunt_tpkvih.webp"
            },
            new() {
                Id = "dr_mario",
                FullName = "Dr. Mario",
                ShorthandName = "Dr. Mario",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174101/Dr_Mario_ec38uo.webp"
            },
            new() {
                Id = "daisy",
                FullName = "Daisy",
                ShorthandName = "Daisy",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174093/Daisy_xj2xqr.webp"
            },
            new() {
                Id = "diddy_kong",
                FullName = "Diddy Kong",
                ShorthandName = "Diddy Kong",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174093/Diddy_Kong_nxaajp.webp"
            },
            new() {
                Id = "donkey_kong",
                FullName = "Donkey Kong",
                ShorthandName = "Donkey Kong",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174093/Donkey_Kong_uxerja.webp"
            },
            new() {
                Id = "dark_samus",
                FullName = "Dark Samus",
                ShorthandName = "Dark Samus",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174093/Dark_Samus_tm35qg.webp"
            },
            new() {
                Id = "corrin",
                FullName = "Corrin",
                ShorthandName = "Corrin",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Corrin_e1ta6t.webp"
            },
            new() {
                Id = "dark_pit",
                FullName = "Dark Pit",
                ShorthandName = "Dark Pit",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Dark_Pit_row2nc.webp"
            },
            new() {
                Id = "cloud",
                FullName = "Cloud",
                ShorthandName = "Cloud",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Cloud_jo43ou.webp"
            },
            new() {
                Id = "byleth",
                FullName = "Byleth",
                ShorthandName = "Byleth",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Byleth_lxaupr.webp"
            },
            new() {
                Id = "chrom",
                FullName = "Chrom",
                ShorthandName = "Chrom",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Chrom_m0ap1n.webp"
            },
            new() {
                Id = "captain_falcon",
                FullName = "Captain Falcon",
                ShorthandName = "Captain Falcon",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Captain_Falcon_nc5gdp.webp"
            },
            new() {
                Id = "bayonetta",
                FullName = "Bayonetta",
                ShorthandName = "Bayonetta",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Bowser_smmr0m.webp"
            },
            new() {
                Id = "bowser",
                FullName = "Bowser",
                ShorthandName = "Bowser",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Bayonetta_cornpk.webp"
            },
            new() {
                Id = "banjoo_and_kazooie",
                FullName = "Banjoo and Kazooie",
                ShorthandName = "Banjoo",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Banjo_and_kazooie_ktkis8.webp"
            },
            new() {
                Id = "bowser_jr",
                FullName = "Bowser jr.",
                ShorthandName = "Bowser jr.",
                ImageUrl = "https://res.cloudinary.com/dq1en6kue/image/upload/v1759174092/Bowser_jr_nqrllx.webp"
            },
        };
        return characters;
    }
}
