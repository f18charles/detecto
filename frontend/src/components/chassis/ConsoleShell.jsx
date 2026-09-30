import TopBar from './TopBar';
import NavSection from './NavSection';
import ScreenBezel from './ScreenBezel';
import StatsScreens from '../display/stats/StatsScreens';
import PowerButton from './PowerButton';

function ConsoleShell() {
  // Fixed to the viewport from md up so the screen can never stretch with
  // content; on small screens the console stacks and scrolls normally.
  return (
    <div className="silver-body min-h-screen md:h-screen md:overflow-hidden flex flex-col p-3 md:p-4 lg:p-6">
      <TopBar />
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[48px_1fr_180px] lg:grid-cols-[56px_1fr_240px] gap-3 md:gap-4">
        <NavSection />
        <div className="flex flex-col justify-between gap-3 min-h-0">
          <ScreenBezel />
          <div className="flex justify-center items-center pt-2 pb-1">
            <PowerButton />
          </div>
        </div>
        <StatsScreens />
      </div>
    </div>
  );
}

export default ConsoleShell;
