'use client'

const MACRO_COLORS = {
  kcal: '#3B82F6',
  protein: '#22C55E',
  carbs: '#F97316',
  fat: '#EC4899',
}

function MacroBar({ macros }) {
  const items = [
    { key: 'kcal', label: macros.kcal + 'kcal', value: macros.kcal },
    { key: 'protein', label: macros.protein + 'g', value: macros.protein },
    { key: 'carbs', label: macros.carbs + 'g', value: macros.carbs },
    { key: 'fat', label: macros.fat + 'g', value: macros.fat },
  ]

  return (
    <div className="flex items-center gap-3 mt-1">
      {items.map((item) => (
        <div key={item.key} className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-white/40 font-medium">{item.label}</span>
          <div className="w-8 h-0.5 rounded-full overflow-hidden bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: MACRO_COLORS[item.key], width: '100%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default MacroBar
