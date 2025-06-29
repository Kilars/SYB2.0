type League = {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    status: number;
    members: LeagueMember[]
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