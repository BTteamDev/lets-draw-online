export interface SocialLink {
    icon: string;
    url: string;
    label: string;
}

export interface CreditMember {
    userId: string;
    position: string;
    socials: SocialLink[];
}

export const credits: CreditMember[] = [
    {
        userId: "69c542537059afa59cfe8b9e",
        position: "Team Lead / Lead Fullstack Developer",
        socials: [
            { icon: "fa-brands fa-github", url: "https://github.com/BTteamDev", label: "GitHub" },
            { icon: "fa-solid fa-envelope", url: "mailto:bogdantorr@gmail.com", label: "Email" }
        ]
    },
];