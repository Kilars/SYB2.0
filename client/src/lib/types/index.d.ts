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
    id: string;
    userId: string;
    displayName: string;
    dateJoined: Date;
    isAdmin: boolean;
    imageUrl?: string
}
type User = {
    id: string
    email: string
    displayName: string
    imageUrl?: string
}
type Match = {
  id: string
  completed: boolean
  split: number
  matchIndex: number
  winnerUserId?: string
  registeredTime?: Date
  playerOne: Player
  playerTwo: Player
  rounds: Round[]
}

type Player = {
  userId: string
  displayName: string
  dateJoined: Date
}

type Round = {
  id: string
  roundNumber: number
  completed: boolean
  winnerUserId?: string
  registeredTime?: Date
  playerOneCharacterId?: string
  playerTwoCharacterId?: string
}