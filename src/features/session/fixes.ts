/** What pulled you away, and the course's answer to each. */
export const PROBLEMS = [
  {
    id: 'phone',
    label: 'Phone was within reach',
    module: 'From module 2',
    title: 'Distance beats discipline.',
    body: 'Before the next ritual, the phone goes to another room. Not face down. Another room.',
    rows: [['Phone in another room', 'Next session']],
    failureMode: 'Phone within reach',
  },
  {
    id: 'stimulation',
    label: 'My mind wanted stimulation',
    module: 'From module 3',
    title: 'The mind is a spoiled child. Say no until it listens.',
    body: 'Sit one hour tomorrow with nothing. No phone, no music, no food. Boredom is the training.',
    rows: [['Boredom hour', 'Tomorrow · 5:00 PM']],
    failureMode: 'Craving stimulation',
  },
  {
    id: 'unclear',
    label: 'The task wasn’t clear',
    module: 'From module 4',
    title: 'Clarity kills resistance.',
    body: 'Tonight, write a sharper outcome: what, where, how much. A vague sheet is an open door.',
    rows: [['Sharper outcome', 'Tonight’s sheet']],
    failureMode: 'Unclear outcome',
  },
  {
    id: 'body',
    label: 'I was tired or hungry',
    module: 'From module 3',
    title: 'Hunger comes in waves. So does sleep.',
    body: 'Eat light before you sit. Water on the desk. Cold water on the face if you are sleepy.',
    rows: [['Light meal, water ready', 'Before the ritual']],
    failureMode: 'Tired or hungry',
  },
];

export type ProblemId = (typeof PROBLEMS)[number]['id'];
