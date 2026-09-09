import { useDetectionStore } from '../../../stores/DetectionStore';
import StatScreen from './StatScreen';
import DirectionsPanel from './DirectionsPanel';
import StatePanel from './StatePanel';
import ToastScreen from './ToastScreen';
import PowerButton from '../../chassis/PowerButton';
import { formatConfidence, formatTime, padCount } from '../../../utils/format';

function StatsScreens() {
  const currentResult = useDetectionStore((s) => s.currentResult);

  const people = padCount(currentResult?.people);
  const conf = formatConfidence(currentResult?.avgConfidence);
  const time = formatTime(currentResult?.inferenceTimeMs);

  return (
    <div className="flex flex-col gap-2.5 self-start w-full">
      <StatScreen label="People" value={people} />
      <StatScreen label="Avg Conf" value={conf} muted />
      <StatScreen label="Processing" value={time} muted />
      <DirectionsPanel />
      <StatePanel />
      <ToastScreen />
      <div className="flex justify-end pt-1">
        <PowerButton />
      </div>
    </div>
  );
}

export default StatsScreens;
