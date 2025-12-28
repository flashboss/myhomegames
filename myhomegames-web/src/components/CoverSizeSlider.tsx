type CoverSizeSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export default function CoverSizeSlider({ value, onChange, min = 100, max = 200 }: CoverSizeSliderProps) {
  return (
    <div className="flex items-center gap-3" style={{ paddingRight: '0px' }}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cover-size-slider"
        style={{
          width: '60px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
          appearance: 'none'
        }}
      />
      <style>{`
        .cover-size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
        }
        .cover-size-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}

