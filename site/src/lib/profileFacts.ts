import type { About } from './strapi';

export interface ProfileFact {
  label: string;
  value: string;
}

// Playful profile facts; CMS fills in the boring true ones. Shared by the
// About page (all rows) and the homepage teaser (a subset).
export function profileFacts(about: About | null): ProfileFact[] {
  return [
    { label: 'Field', value: 'Statistics & machine learning' },
    { label: 'Based in', value: about?.location ?? 'a home lab somewhere' },
    { label: 'Current obsession', value: 'Particle swarm optimization' },
    { label: 'Coffee intake', value: 'x̄ = 3.2 cups/day (σ = 0.8)' },
    { label: 'Supervisors', value: '6 cats, zero mercy' },
    { label: 'Uptime', value: 'better than the ISP’s' },
  ];
}
