import Countdown from './Countdown'

function RaceCard({ name, distance, date, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full bg-[rgba(25,25,25,0.85)] backdrop-blur-sm rounded-2xl px-5 py-3 hover:bg-[rgba(40,40,40,0.9)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-[15px]">
            {name}
          </h3>
          <p className="text-white/70 text-sm mt-0.5">
            {distance}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-400 text-xs">
              {date}
            </p>
            <Countdown date={date} />
          </div>
        </div>
        <div className="text-white/40 ml-3">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </div>
      </div>
    </a>
  )
}

export default RaceCard
