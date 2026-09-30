import { useNavigationStore } from "../../stores/NavigationStore";
import { LuLayoutDashboard, LuArchive, LuChartBar } from "react-icons/lu";
import NavButton from './NavButton'

const NavSection = () => {
    const page = useNavigationStore((s) => s.page);
    const selectPage = useNavigationStore((s) => s.selectPage);

    return (
        <div className="flex lg:flex-col items-center gap-2.5">
          <NavButton 
            icon={LuLayoutDashboard} 
            active={page === 0} 
            label='Detect' 
            onClick={() => selectPage(0)}
          />
          <NavButton
            icon={LuArchive}
            active={page === 1}
            label='History'
            onClick={() => selectPage(1)}
          />
          <NavButton
            icon={LuChartBar}
            active={page === 2}
            label='Stats'
            onClick={() => selectPage(2)}
          />
        </div>
    );
};

export default NavSection;