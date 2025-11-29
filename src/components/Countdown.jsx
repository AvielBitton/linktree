import { useState, useEffect } from 'react'

// Parse date string like "27 December 2024" to Date object
function parseDate(dateString) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  }
  
  const parts = dateString.split(' ')
  const day = parseInt(parts[0], 10)
  const month = months[parts[1]]
  const year = parseInt(parts[2], 10)
  
  return new Date(year, month, day, 23, 59, 59) // End of day
}

function Countdown({ date }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const raceDate = parseDate(date)
      const difference = raceDate - now

      if (difference <= 0) {
        setIsPast(true)
        setTimeLeft(null)
        return
      }

      setIsPast(false)

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

      setTimeLeft({ days, hours, minutes })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [date])

  if (isPast) {
    return (
      <p className="text-gray-500 text-xs mt-1">
        Completed
      </p>
    )
  }

  if (!timeLeft) {
    return null
  }

  const parts = []
  if (timeLeft.days > 0) parts.push(`${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''}`)
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours} hour${timeLeft.hours !== 1 ? 's' : ''}`)
  if (timeLeft.minutes > 0 || parts.length === 0) parts.push(`${timeLeft.minutes} minute${timeLeft.minutes !== 1 ? 's' : ''}`)

  return (
    <p className="text-white/60 text-xs mt-1">
      {parts.join(' • ')} left
    </p>
  )
}

export default Countdown

// Export parseDate for use in sorting
export { parseDate }
