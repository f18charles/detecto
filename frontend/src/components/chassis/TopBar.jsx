const TopBar = ({online = true}) => {
    return (
        <div className="flex items-center w-full justify-between px-2 pb-4 mb-4 border-b border-black/25">
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-[15px] font-semibold tracking-wide text-chassis-text leading-none">
                        LOOKOUT
                    </h1>
                    <p className="text-[10px] font-mono text-chassis-muted mt-1">Station 01-072-073</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded full ${online ? 'bg-display-green shadow-[0_0_6px_#3ddc97]' : 'bg-gray'}`} />
                <span className="text-[10px] font-mono text-chassis-muted">
                    System Online
                </span>
            </div>
        </div>
    )
}

export default TopBar;