interface ProfileLink {
  label: string;
  href: `https://${string}`;
}

interface SiteSettings {
  url: `https://${string}`;
  language: string;
  description: string;
  blogDescription: string;
  profile: {
    name: string;
    bio: string;
    linksPlaceholder: string;
    links: ProfileLink[];
    image: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
  };
}

export const site: SiteSettings = {
  url: "https://chardon.dev",
  language: "en",
  description: "[Add a short description of your profile and website.]",
  blogDescription: "[Describe the topics you plan to write about.]",
  profile: {
    name: "[Name]",
    bio: "[Write a short bio: your work, interests, and what you want to share here.]",
    linksPlaceholder: "[Add links to your work or other profiles.]",
    links: [],
    image: {
      src: "/profile-placeholder.svg",
      alt: "",
      width: 192,
      height: 192,
    },
  },
};
