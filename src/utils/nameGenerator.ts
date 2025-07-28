export const funnyNames = [
  'Captain Chaos',
  'Sir Reginald Von Squiggle',
  'The Dotted Line Duke',
  'Count von Count',
  'Professor Polygon',
  'Doctor Dot',
  'The Grid Goblin',
  'Square Squasher',
  'Line Lord',
  'The Box Bandit',
  'Agent Angle',
  'Duchess of Dots',
  'Baron Von Box',
  'The Point Prince',
  'Lady Linetracer'
]

export function getRandomFunnyName() {
  const randomIndex = Math.floor(Math.random() * funnyNames.length)
  return funnyNames[randomIndex]
} 