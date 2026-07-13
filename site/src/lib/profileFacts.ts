import type { About } from './strapi';

export interface ProfileFact {
  label: string;
  value: string;
}

// Playful profile facts; CMS fills in the boring true ones. Shared by the
// About page (all rows) and the homepage teaser (a subset).
export function profileFacts(about: About | null): ProfileFact[] {
  return [
    { label: 'Field', value: 'CompSci, Statistics, ML, Proxmox' },
    { label: 'Based in', value: about?.location ?? 'a home lab somewhere' },
    { label: 'Coffee intake', value: 'i lost track' },
    { label: 'Supervisors', value: 'cats' },
    { label: 'Uptime', value: 'better than your ISP’s' },
  ];
}
