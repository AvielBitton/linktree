function AsteriskButton() {
  return (
    <button
      className="fixed top-6 left-6 z-20 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 float-animation"
      aria-label="Menu"
      onClick={() => {
        // Could open a modal or menu
        console.log('Asterisk button clicked')
      }}
    >
      <span className="text-black text-2xl font-light leading-none select-none" style={{ marginTop: '-2px' }}>
        ✳
      </span>
    </button>
  )
}

export default AsteriskButton

