type League = {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    status: number;
    members: LeagueMember[]
    matches: Match[]
}

type LeagueMember = {
    Leagueid: string;
    userId: string;
    displayName: string;
    dateJoined: Date;
    isAdmin: boolean;
    imageUrl?: string;
    isGuest?: boolean;
}
type User = {
    id: string
    email?: string
    displayName: string
    imageUrl?: string
    isGuest?: boolean
}
type Match = {
  completed: boolean;
  leagueId: string;
  split: number;
  matchNumber: number;
  winnerUserId?: string;
  registeredTime?: Date;
  playerOne: Player;
  playerTwo: Player;
  rounds: Round[];
}

type Player = {
  userId: string
  displayName: string
  dateJoined: Date
  isGuest?: boolean
}

type Round = {
  leagueId: string;
  split: number;
  matchNumber: number;
  roundNumber: number
  completed: boolean
  winnerUserId?: string
  registeredTime?: Date
  playerOneCharacterId?: string
  playerOneCharacter?: Character
  playerTwoCharacterId?: string
  playerTwoCharacter?: Character
}

type Character = {
	id: string;
	fullName: string;
  shorthandName: string;
	imageUrl: string;
}
type LeaderboardUser =
{
  wins: number;
  losses: number;
  flawless: number;
  points: number;
  displayName: string;
  userId?: string;
  isGuest?: boolean;
}

type Tournament = {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: number;
  bestOf: number;
  playerCount: number;
  winnerUserId?: string;
  members: TournamentMember[];
  matches: TournamentMatch[];
}

type TournamentMember = {
  tournamentId: string;
  userId: string;
  displayName: string;
  dateJoined: Date;
  isAdmin: boolean;
  seed: number;
  isGuest?: boolean;
}

type TournamentMatch = {
  completed: boolean;
  tournamentId: string;
  bracketRound: number;
  bracketPosition: number;
  matchNumber: number;
  winnerUserId?: string;
  registeredTime?: Date;
  playerOne?: TournamentPlayer;
  playerTwo?: TournamentPlayer;
  rounds: TournamentRound[];
}

type TournamentPlayer = {
  userId: string;
  displayName: string;
  dateJoined: Date;
  seed: number;
  isGuest?: boolean;
}

type TournamentRound = {
  tournamentId: string;
  matchNumber: number;
  roundNumber: number;
  completed: boolean;
  winnerUserId?: string;
  playerOneCharacterId?: string;
  playerOneCharacter?: Character;
  playerTwoCharacterId?: string;
  playerTwoCharacter?: Character;
}