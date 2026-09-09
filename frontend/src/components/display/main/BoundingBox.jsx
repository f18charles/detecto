

const BoundingBox = ({x1, y1, x2, y2, confidence, index=0, delayMs = 0}) => {
    return (
        <div className="box"
            style={{
                left: `${x1 * 100}%`,
                top: `${y1 * 100}%`,
                width: `${(x2 - x1) * 100}%`,
                height: `${(y2 - y1) * 100}%`,
                animationDelay: `${delayMs}ms`,
            }}
        >
            <span className="box-label">
                {`person_${String(index+1).padStart(2, '0')} ${Math.round(confidence * 100)}%`}
            </span>
        </div>
    )
}

export default BoundingBox