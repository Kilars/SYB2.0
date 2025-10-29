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
}
type User = {
    id: string
    email: string
    displayName: string
    imageUrl?: string
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
}