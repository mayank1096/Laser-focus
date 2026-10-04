/** The course's विघ्न सूची (distraction checklist), in two groups. */
export const CHECKLIST: { group: string; items: string[] }[] = [
  {
    group: 'Outside',
    items: [
      'Phone out of the room',
      'Only the tabs you need',
      'Desk clear, door closed',
      'Food outside',
    ],
  },
  {
    group: 'Inside',
    items: [
      'Ate lightly, water nearby',
      'Face washed if sleepy',
      'Spine straight',
    ],
  },
];

export const PRAYERS = [
  {
    name: 'Guru pranam',
    text: 'ॐ अज्ञान तिमिरान्धस्य ज्ञानाञ्जन शलाकया ।\nचक्षुरुन्मीलितं येन तस्मै श्री गुरवे नमः ॥',
    meaning:
      'To the Guru who opened my eyes, blinded by ignorance, with the light of knowledge — I bow.',
  },
  {
    name: 'Govind pranam',
    text: 'मूकं करोति वाचालं पंगुं लंघयते गिरिम् ।\nयत्कृपा तमहं वन्दे परमानन्द माधवम् ॥',
    meaning:
      'His grace makes the mute speak and the lame cross mountains. I bow to Madhava, the highest joy.',
  },
  {
    name: 'Saraswati pranam',
    text: 'या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता ।\nसा मां पातु सरस्वती भगवती निःशेषजाड्यापहा ॥',
    meaning:
      'White as jasmine, moon and snow, robed in white — may Saraswati protect me and clear every dullness.',
  },
];

/** Attention stages from the course, with the minute each begins. */
export const STAGES = [
  {
    from: 0,
    name: 'Restless',
    line: 'Tantrums. The hand reaches for the phone.\nLet it reach. Stay.',
  },
  {
    from: 5,
    name: 'Settling',
    line: 'The bargaining stops.\nThings begin to make sense.',
  },
  {
    from: 10,
    name: 'Steady',
    line: 'Thoughts are still there.\nThey don’t control you anymore.',
  },
  {
    from: 20,
    name: 'Clear',
    line: 'The noise has cleared.\nOnly the thoughts you choose stay.',
  },
  { from: 30, name: 'Immersed', line: 'This is the flow.\nStay in.' },
];

export const RITUAL_STEPS = [
  'Clear',
  'Breathe',
  'Pray',
  'Values',
  'Tratak',
  'Begin',
];
