const StatScreen = ({ label, value, muted = false}) => {
    return (
        <div className="mini-frame">
            <div className="inset-panel rounded-xl px-3.5 py-2.5">
                <div className="text-[9px] font-mono text-chassis-dim tracking-wide mb-1">{label}</div>
                <div className={`font-mono font-semibold text-xl ${muted ? 'text-[#c8cace]': 'text-display-green'}`}>{value}</div>
            </div>
        </div>
    )
}

export default StatScreen