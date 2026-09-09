import TopBar from './TopBar';
import NavSection from './NavSection';
import ScreenBezel from './ScreenBezel';
import StatsScreens from '../display/stats/StatsScreens';

function ConsoleShell() {
  return (
    <div className="silver-body min-h-screen flex flex-col p-3 md:p-4 lg:p-6">
      <TopBar />
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[48px_1fr_180px] lg:grid-cols-[56px_1fr_240px] gap-3 md:gap-4">
        <NavSection />
        <div className="flex flex-col gap-3 min-h-0">
          <ScreenBezel />
        </div>
        <StatsScreens />
      </div>
    </div>
  );
}

export default ConsoleShell;
