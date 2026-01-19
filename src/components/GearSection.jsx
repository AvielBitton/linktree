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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="block relative group"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Card */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden group-hover:border-violet-500/30 transition-all duration-300">
        {/* Image */}
        <div className="relative h-32 overflow-hidden">
        <img 
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
        {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/10 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-1 rounded-full">
              {item.category}
            </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
          <h3 className="text-white font-bold text-sm mb-1">
            {item.name}
        </h3>
          <p className="text-white/50 text-xs leading-relaxed mb-3">
            {item.description}
        </p>
        
          {/* View Product Button */}
          <div className="flex items-center gap-2 text-violet-400 text-xs font-medium group-hover:text-violet-300 transition-colors">
          <span>View Product</span>
            <motion.svg 
              className="w-3 h-3" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </div>
        </div>
      </div>
    </motion.a>
  )
}

function GearSection() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-1"
      >
        <h2 className="text-white/60 text-xs uppercase tracking-wider">My Running Gear</h2>
        <p className="text-white/30 text-xs mt-1">Equipment I use for training & racing</p>
      </motion.div>
      
      {/* Gear Cards */}
    <div className="space-y-3">
        {gearItems.map((item, index) => (
          <GearCard key={item.id} item={item} index={index} />
      ))}
      </div>
    </div>
  )
}

export default GearSection
