export interface Stat {
  value: string;
  label: string;
}

export interface Feature {
  icon: string;
  bgColor: string;
  title: string;
  description: string;
}

export interface Step {
  title: string;
  description: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}
