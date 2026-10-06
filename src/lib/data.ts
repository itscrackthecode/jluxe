export const services = [
  { title:'Real Estate', kicker:'01', description:'Property sales, marketing and channel partnership for real opportunities.', href:'/services/real-estate', tone:'land' },
  { title:'Business Solutions', kicker:'02', description:'Marketing, branding, lead generation and business development support.', href:'/services/business-solutions', tone:'business' },
  { title:'Recruitment & Training', kicker:'03', description:'Recruitment, staffing and practical training for people and organisations.', href:'/services/talent-training', tone:'training' },
  { title:'Interiors & Design', kicker:'04', description:'Interior design solutions that turn spaces into purposeful environments.', href:'/services/interiors-design', tone:'interior' },
  { title:'Boutique', kicker:'05', description:'A new JLUXE venture currently in development.', href:'/contact', tone:'boutique' },
];

export const siteConfig = {
  brand: 'JLUXE',
  url: 'https://jluxe-seven.vercel.app',
  contact: {
    email: 'your-email@jluxe.example',
    instagram: 'https://www.instagram.com/your-handle',
    whatsapp: 'https://wa.me/00000000000',
    whatsappNumber: '+00 00000 00000',
  },
  nav: {
    about: '/about',
    work: '/our-work',
    contact: '/contact',
  },
};

export type WorkCategory = 'Real Estate' | 'Business Solutions' | 'Talent & Training' | 'Interiors & Design';

export type WorkItem = {
  id: string;
  title: string;
  category: WorkCategory;
  description: string;
  image?: string;
  location?: string;
  year?: string;
  featured?: boolean;
};

export const workItems: WorkItem[] = [];

export const heroSlides = [
  { eyebrow:'JLUXE', title:'Building relationships. Creating possibilities.', body:'Connecting people, services and opportunities across real estate, business, talent and design.', cta:'Explore JLUXE', href:'/about', theme:'land', backgroundImage:'/assets/images/jluxe-hero-bg.png' },
  { eyebrow:'REAL ESTATE', title:'Find the right space. Make the right move.', body:'Property opportunities for buyers, sellers and partners, supported by JLUXE’s real estate network.', cta:'Explore Real Estate', href:'/services/real-estate', theme:'land', backgroundImage:'/assets/images/real-estate.png' },
  { eyebrow:'BUSINESS SOLUTIONS', title:'Ideas that move business forward.', body:'Marketing, branding, lead generation, sales and business development solutions built around real requirements.', cta:'Explore Business Solutions', href:'/services/business-solutions', theme:'business', backgroundImage:'/assets/images/business-solutions.png' },
  { eyebrow:'RECRUITMENT & TRAINING', title:'Connecting talent with opportunity.', body:'Recruitment, staffing, corporate training, college training and career counselling.', cta:'Explore Recruitment & Training', href:'/services/talent-training', theme:'training', backgroundImage:'/assets/images/talent-training.png' },
  { eyebrow:'INTERIORS & DESIGN', title:'Spaces designed around you.', body:'Interior designing focused on creating functional, thoughtful and distinctive spaces.', cta:'Explore Interiors & Design', href:'/services/interiors-design', theme:'interior', backgroundImage:'/assets/images/interiors-designs.png' },
];

export const realEstateCapabilities = [
  {
    number: '01',
    title: 'Real Estate Sales',
    description: 'Help connect relevant property opportunities with potential buyers.',
  },
  {
    number: '02',
    title: 'Real Estate Marketing',
    description: 'Support property visibility and marketing for sellers and partners.',
  },
  {
    number: '03',
    title: 'Channel Partner',
    description: 'Work with property owners and developers to connect opportunities with potential buyers.',
  },
  {
    number: '04',
    title: 'Banking Services',
    description: 'Banking-related support offered through JLUXE.',
  },
];

export type RealEstateOpportunity = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

export const realEstateOpportunities: RealEstateOpportunity[] = [];

export const businessSolutionsServices = [
  {
    number: '01',
    title: 'Marketing Solutions',
    description: 'Marketing support shaped around business requirements.',
  },
  {
    number: '02',
    title: 'Branding Solutions',
    description: 'Branding support for businesses and organizations.',
  },
  {
    number: '03',
    title: 'Lead Generation',
    description: 'Lead generation support aligned with your business needs.',
  },
  {
    number: '04',
    title: 'Sales & Business Development',
    description: 'Sales and business development support for business requirements.',
  },
  {
    number: '05',
    title: 'Banking Services',
    description: 'Banking-related support offered through JLUXE.',
  },
  {
    number: '06',
    title: 'Event Management',
    description: 'Event management support for businesses and organizations.',
  },
];

export const businessSolutionsAudiences = ['Businesses', 'Corporates', 'Organizations'];

export const businessSolutionsContact = {
  heading: 'Have a business requirement?',
  description: 'Tell JLUXE what you need and start a conversation.',
  href: siteConfig.nav.contact,
};

export const talentTrainingServices = [
  {
    number: '01',
    title: 'Recruitment & Staffing',
    description: 'Support organisations in finding and engaging relevant talent.',
  },
  {
    number: '02',
    title: 'Corporate Training',
    description: 'Training support designed around organisational and workforce requirements.',
  },
  {
    number: '03',
    title: 'College Training',
    description: 'Training programs and support for educational institutions and students.',
  },
  {
    number: '04',
    title: 'Career Counselling',
    description: 'Guidance for individuals exploring career paths and opportunities.',
  },
  {
    number: '05',
    title: 'Careers',
    description: 'Explore opportunities with JLUXE when positions are available.',
  },
];

export const talentTrainingAudiences = [
  {
    title: 'Organisations',
    description: 'Recruitment, staffing and corporate training requirements.',
  },
  {
    title: 'Educational Institutions',
    description: 'College training and career-oriented programs.',
  },
  {
    title: 'Individuals',
    description: 'Career counselling and relevant opportunities.',
  },
];

export type TalentOpportunity = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

export const talentOpportunities: TalentOpportunity[] = [];

export const talentTrainingContact = {
  heading: 'Have a talent or training requirement?',
  description: 'Tell us what you need and start a conversation with JLUXE.',
  href: siteConfig.nav.contact,
};
