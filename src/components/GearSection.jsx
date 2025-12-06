const gearItems = [
  {
    id: 'watch',
    title: 'Garmin Forerunner 970',
    description: 'GPS running watch with advanced training metrics',
    image: './images/gear/Forerunner970_SoftGold2.jpg',
    url: 'https://www.garmin.com/en-US/p/1462801/',
    category: 'Watch'
  },
  {
    id: 'headphones',
    title: 'Shokz OpenRun Pro 2',
    description: 'Bone conduction headphones for safe outdoor running',
    image: './images/gear/shokz.jpg',
    url: 'https://shokz.com/products/openrunpro2?variant=44043747786952',
    category: 'Audio'
  },
  {
    id: 'shoes',
    title: 'Adidas Adizero Adios Pro 4',
    description: 'Elite carbon racing shoes for marathon performance',
    image: './images/gear/adidaspro4.jpg',
    url: 'https://www.adidas.com/us/adizero-adios-pro-4-shoes/JR1094.html',
    category: 'Shoes'
  }
]

function GearCard({ title, description, image, url, category }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[rgba(25,25,25,0.85)] backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(35,35,35,0.9)] hover:shadow-xl group"
    >
      {/* Image Container */}
      <div className="relative h-32 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-contain p-3 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        />
        {/* Category Badge */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-full">
          {category}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-[15px] mb-1 group-hover:text-white/90">
          {title}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed mb-3">
          {description}
        </p>
        
        {/* View Product Link */}
        <div className="flex items-center text-white/60 text-xs group-hover:text-white/80 transition-colors">
          <span>View Product</span>
          <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </a>
  )
}

function GearSection() {
  return (
    <div className="space-y-3">
      {gearItems.map((item) => (
        <GearCard
          key={item.id}
          title={item.title}
          description={item.description}
          image={item.image}
          url={item.url}
          category={item.category}
        />
      ))}
    </div>
  )
}

export default GearSection
