// Manual mapping: Runna planned strength workout (by ordinal) -> gym template id
// Key = ordinal position among all future Strength workouts sorted by date
// Value = gym template id (push, pull, upper, lower)
//
// Using ordinal keys so the mapping survives if Runna shifts dates.
// Only breaks if Runna changes the total number or reorders workouts.

const STRENGTH_MAP = {
  1: 'lower',   // Sat  Apr 18 - max recovery day
  2: 'pull',    // Mon  Apr 21
  3: 'push',    // Tue  Apr 22
  4: 'upper',   // Wed  Apr 23
  5: 'lower',   // Fri  Apr 25

  6: 'push',    // Mon  Apr 28
  7: 'upper',   // Tue  Apr 29
  8: 'pull',    // Wed  Apr 30
  9: 'lower',   // Fri  May 2
}

export default STRENGTH_MAP
