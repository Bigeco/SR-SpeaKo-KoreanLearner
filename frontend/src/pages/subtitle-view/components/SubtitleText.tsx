import { useSubtitleStore } from '../../../stores/subtitleStore';

export const SubtitleText: React.FC = () => {
  const currentText = useSubtitleStore((state) => state.currentText);
  
  return (
    <div className="subtitle-text">
      {currentText}
    </div>
  );
};
  