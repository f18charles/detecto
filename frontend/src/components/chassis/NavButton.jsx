function NavButton({ icon: Icon, active = false, label }) {
    return (
        <div className="relative flex items-center">
            <button type="button" tabIndex={-1} aria-label={label} aria-pressed={active} className={`silver-btn w-11 h-11 rounded-xl flex items-center justify-center ${active ? 'silver-btn-active' : ''}`}>
                <Icon className={active ? 'text-[#1c1d1f]' : 'text-[1c1d1f]/80'}
                width={18}
                height={18}
                strokeWidth={2.2} />
            </button>
        </div>
    )
}

export default NavButton