type Competition = {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: number;
  bestOf: number;
  members: CompetitionMember[];
  matches: Match[];
};

type League = Competition;

type Tournament = Competition & {
  playerCount: number;
  winnerUserId?: string;
};

type CompetitionMember = {
  competitionId: string;
  userId: string;
  displayName: string;
  dateJoined: Date;
  isAdmin: boolean;
  seed?: number;
  imageUrl?: string;
  isGuest?: boolean;
};

type User = {
  id: string;
  email?: string;
  displayName: string;
  imageUrl?: string;
  isGuest?: boolean;
};

type Match = {
  completed: boolean;
  competitionId: string;
  bracketNumber: number;
  matchNumber: number;
  winnerUserId?: string;
  registeredTime?: Date;
  playerOne?: Player;
  playerTwo?: Player;
  rounds: Round[];
};

type Player = {
  userId: string;
  displayName: string;
  dateJoined: Date;
  seed?: number;
  isGuest?: boolean;
};

type Round = {
  competitionId: string;
  bracketNumber: number;
  matchNumber: number;
  roundNumber: number;
  completed: boolean;
  winnerUserId?: string;
  registeredTime?: Date;
  playerOneCharacterId?: string;
  playerOneCharacter?: Character;
  playerTwoCharacterId?: string;
  playerTwoCharacter?: Character;
};

type Character = {
  id: string;
  fullName: string;
  shorthandName: string;
  imageUrl: string;
};

type LeaderboardUser = {
  wins: number;
  losses: number;
  flawless: number;
  points: number;
  displayName: string;
  userId?: string;
  isGuest?: boolean;
};
