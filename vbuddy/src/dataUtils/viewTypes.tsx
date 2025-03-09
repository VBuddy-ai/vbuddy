export interface Testimonial {
  name: string;
  role: string;
  text: string;
  image: string;
}

export interface TrustIndicator {
  value: string;
  label: string;
}

export interface CategoryCard {
  title: string;
  rate: string;
  skills: string[];
}

export interface ProcessStep {
  title: string;
  desc: string;
}

export interface RateData {
  role: string;
  entry: number;
  mid: number;
  expert: number;
  color: string;
}
