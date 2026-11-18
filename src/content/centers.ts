import type { CenterName } from '@/types';
import type { CenterContent } from './schema';

/** Content for the nine centers. */
export const CENTERS: Readonly<Record<CenterName, CenterContent>> = {
  Head: {
    title: 'Head',
    motor: false,
    function: 'Inspiration and mental pressure: the urge to wonder and ask questions.',
    theme: 'Questions and inspiration',
    defined:
      'A steady source of mental pressure and curiosity. You tend to find your own questions and may be a consistent source of inspiration for others.',
    open: "You tend to take in other people's questions and pressure to figure things out. Learning to choose which questions are really yours can turn this into a flexible, wide-ranging curiosity.",
    question: 'Am I thinking about the right things?',
  },
  Ajna: {
    title: 'Ajna',
    motor: false,
    function: 'Conceptualizing: processing, analyzing and forming ideas and opinions.',
    theme: 'Understanding and certainty',
    defined:
      'A reliable way of thinking that you tend to return to. Your mind processes in a consistent fashion, and you are often comfortable holding a fixed viewpoint.',
    open: 'Your mind can be flexible, seeing many sides of an idea. It may also pretend to be certain when it is not, so being comfortable with "I\'m not sure" is a useful skill.',
    question: 'Am I certain, and do I have the right answer?',
  },
  Throat: {
    title: 'Throat',
    motor: false,
    function: 'Expression and manifestation: speaking, acting and making things happen.',
    theme: 'Communication and action',
    defined:
      'A consistent way of expressing yourself and acting. What you say or do tends to carry a familiar tone that others can recognize.',
    open: 'Your voice adapts to who you are with. The pull to be noticed can lead to over-talking, so waiting for a natural opening often makes your words land more clearly.',
    question: 'How do I get noticed, and what should I say?',
  },
  G: {
    title: 'G',
    motor: false,
    function: 'Identity, direction and love: the sense of who you are and where you are going.',
    theme: 'Identity, love and direction',
    defined:
      'A stable sense of self and direction. You tend to know who you are and bring that steadiness to others, who may feel anchored by it.',
    open: 'Your sense of identity and direction is flexible and shaped by place and people. The right environment and company often matter a great deal, and you can be wise about what suits others.',
    question: 'Who am I, where do I belong, and am I loved?',
  },
  Heart: {
    title: 'Heart',
    motor: true,
    function: 'Willpower: the drive to commit, to keep promises and to prove worth.',
    theme: 'Willpower, worth and promises',
    defined:
      'A dependable store of willpower. You tend to keep your word and can push through when something matters to you, but you do best when you rest in between.',
    open: 'You have no fixed measure of worth or willpower, so you may promise too much or feel a need to prove yourself. Recognizing that you already have value can ease that pressure.',
    question: 'Am I enough, and do I need to prove myself?',
  },
  Spleen: {
    title: 'Spleen',
    motor: false,
    function: "Intuition, immunity and survival: the body's instant awareness of what is healthy.",
    theme: 'Intuition, health and safety',
    defined:
      'A reliable, quiet instinct about what is safe and healthy in the moment. It speaks once and softly, and you tend to bring a sense of steadiness to others.',
    open: "You tend to absorb other people's fears and may hold on to things past their time. Learning to notice the difference between your own safety signals and borrowed ones is an ongoing practice.",
    question: 'Am I safe, and can I let go?',
  },
  SolarPlexus: {
    title: 'Solar Plexus',
    motor: true,
    function: 'Emotions and feelings: waves of mood, desire and sensitivity.',
    theme: 'Emotional awareness',
    defined:
      'Emotional energy that moves in waves between highs and lows. Clarity tends to come with time rather than in the first moment, and others may feel your emotional presence.',
    open: 'You pick up and amplify the feelings of the people around you. Taking time away from others can show you which emotions are yours, and it often makes you a good listener.',
    question: 'How can I avoid conflict and discomfort?',
  },
  Sacral: {
    title: 'Sacral',
    motor: true,
    function: 'Life-force: the energy for work, sexuality and sustained effort.',
    theme: 'Energy and response',
    defined:
      'A renewable source of life-force that responds to what shows up. You tend to have stamina for what you are drawn to, and need regular rest to match it.',
    open: 'You do not have a steady supply of this energy and can borrow it from others, which may lead to overdoing it. Noticing when you are tired and resting before you push is a useful habit.',
    question: 'How much is enough, and when do I stop?',
  },
  Root: {
    title: 'Root',
    motor: true,
    function: 'Pressure and stress: the adrenaline that drives action and the urge to get going.',
    theme: 'Pressure and drive',
    defined:
      'A consistent way of handling stress and pressure. You tend to use the push of deadlines as fuel and can stay steady while others rush.',
    open: 'You take in the pressure of the people around you and may hurry to get rid of it. Learning to pace yourself, rather than rushing to be done, turns this into a good sense of timing.',
    question: 'How do I get rid of this pressure?',
  },
};
