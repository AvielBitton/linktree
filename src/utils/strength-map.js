// Manual mapping: Runna planned strength workout (by ordinal) -> gym template id
// Key = ordinal position among all future Strength workouts sorted by date
// Value = gym template id
//
// ABC Recomp cycle: abc_upper -> abc_lower -> abc_full -> repeat
// Using ordinal keys so the mapping survives if Runna shifts dates.
// Only breaks if Runna changes the total number or reorders workouts.

const STRENGTH_MAP = {
  1: 'abc_upper',  // Week 1 - Day A
  2: 'abc_lower',  // Week 1 - Day B
  3: 'abc_full',   // Week 1 - Day C

  4: 'abc_upper',  // Week 2 - Day A
  5: 'abc_lower',  // Week 2 - Day B
  6: 'abc_full',   // Week 2 - Day C

  7: 'abc_upper',  // Week 3 - Day A
  8: 'abc_lower',  // Week 3 - Day B
  9: 'abc_full',   // Week 3 - Day C

  10: 'abc_upper', // Week 4 - Day A
  11: 'abc_lower', // Week 4 - Day B
  12: 'abc_full',  // Week 4 - Day C
}

export default STRENGTH_MAP
