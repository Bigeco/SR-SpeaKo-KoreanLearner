import { useSubtitleStore } from '../../../stores/subtitleStore';

export const SubtitleControls: React.FC = () => {
  const { isPlaying, togglePlaying } = useSubtitleStore();
  
  return (
    <div className="subtitle-controls">
      <button onClick={togglePlaying}>
        {isPlaying ? '일시정지' : '재생'}
      </button>
      {/* 다른 컨트롤 버튼들 */}
    </div>
  );
};
