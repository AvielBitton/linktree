import { motion } from 'framer-motion'

const gearItems = [
  {
    id: 'watch',
    category: 'Watch',
    name: 'Garmin Forerunner 970',
    description: 'GPS running watch with advanced training metrics',
    image: '/images/gear/Forerunner970_SoftGold2.jpg',
    link: 'https://www.garmin.com/en-US/search/?query=forerunner+970'
  },
  {
    id: 'headphones',
    category: 'Audio',
    name: 'Shokz OpenRun Pro 2',
    description: 'Bone conduction headphones for safe outdoor running',
    image: '/images/gear/shokz.jpg',
    link: 'https://shokz.com/products/openrunpro2'
  },
  {
    id: 'shoes',
    category: 'Shoes',
    name: 'Adidas Adizero Adios Pro 4',
    description: 'Elite carbon racing shoes for marathon performance',
    image: '/images/gear/adidaspro4.jpg',
    link: 'https://www.adidas.com/us/adizero-adios-pro-4-shoes/JR7088.html'
  },
  {
    id: 'stryd',
    category: 'Power Meter',
    name: 'Stryd',
    description: 'Running power meter for precise pace and effort tracking',
    image: '/images/gear/stryd.png',
    link: 'https://buy.stryd.com/gl/en/store'
  }
]

function GearCard({ item, index }) {
  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="block group"
    >
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden hover:bg-white/[0.05] transition-colors">
        <div className="relative h-32 overflow-hidden">
          <img 
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <span className="bg-black/40 backdrop-blur-sm text-white/70 text-[10px] font-medium px-2 py-1 rounded-full">
              {item.category}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-1">{item.name}</h3>
          <p className="text-white/25 text-xs leading-relaxed mb-3">{item.description}</p>
          
          <div className="flex items-center gap-1.5 text-white/30 text-xs font-medium group-hover:text-white/50 transition-colors">
            <span>View Product</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </motion.a>
  )
}

function GearSection() {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="text-white/25 text-[11px] uppercase tracking-wider font-medium">My Running Gear</h2>
        <p className="text-white/15 text-xs mt-0.5">Equipment I use for training & racing</p>
      </div>
      
      <div className="space-y-2.5">
        {gearItems.map((item, index) => (
          <GearCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  )
}

export default GearSection
