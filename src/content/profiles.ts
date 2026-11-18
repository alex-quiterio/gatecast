import type { ProfileContent } from './schema';

/** Content for the 12 profiles, keyed like `5/1` (personality line / design line). */
export const PROFILES: Readonly<Record<string, ProfileContent>> = {
  '1/3': {
    name: 'Investigator / Martyr',
    summary:
      'A need for a solid foundation of knowledge, combined with learning by trial and error. You tend to study things closely and then test them for yourself.',
  },
  '1/4': {
    name: 'Investigator / Opportunist',
    summary:
      'A researcher who builds security through knowledge and shares it within a trusted network. You tend to make a lasting impression through the people you know.',
  },
  '2/4': {
    name: 'Hermit / Opportunist',
    summary:
      'Natural talent that shows up best when you have time alone, and then relationships that call it out. You tend to be pulled out of solitude by people who value what you do.',
  },
  '2/5': {
    name: 'Hermit / Heretic',
    summary:
      'A private person with natural gifts whom others may look to for practical help. Others often project expectations onto you, so honest boundaries matter.',
  },
  '3/5': {
    name: 'Martyr / Heretic',
    summary:
      'Learning through experiments and mistakes, then turning what you learn into practical solutions for others. You tend to be resilient and adaptable.',
  },
  '3/6': {
    name: 'Martyr / Role Model',
    summary:
      'A life in three phases: early experimentation, a period of reflection, and then living what you have learned. You tend to grow wise through experience.',
  },
  '4/6': {
    name: 'Opportunist / Role Model',
    summary:
      'A network-driven life that matures into leading by example. You tend to build trust through friendships and, later, stand back as someone others look to.',
  },
  '4/1': {
    name: 'Opportunist / Investigator',
    summary:
      'A fixed, grounded character with a strong need for friendship and a solid base. You tend to be dependable within your circle.',
  },
  '5/1': {
    name: 'Heretic / Investigator',
    summary:
      'A practical problem-solver backed by careful research. Others may expect solutions from you, so reliable foundations are important.',
  },
  '5/2': {
    name: 'Heretic / Hermit',
    summary:
      'A natural who is called out to help others, but who needs time alone to recharge. You tend to be seen as capable, whether or not you feel ready.',
  },
  '6/2': {
    name: 'Role Model / Hermit',
    summary:
      'Someone who becomes a quiet example over time, with natural gifts that surface when called on. You tend to step back, observe, and then lead by being yourself.',
  },
  '6/3': {
    name: 'Role Model / Martyr',
    summary:
      'A path of experimentation, with plenty of ups and downs, that gradually becomes wisdom. You tend to learn by doing and later offer perspective from what you have lived.',
  },
};
