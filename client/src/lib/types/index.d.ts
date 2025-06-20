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
    displayName: string;
    dateJoined: Date;
    isAdmin: boolean;
}