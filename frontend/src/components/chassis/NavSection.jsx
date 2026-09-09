import { useNavigationStore } from "../../stores/NavigationStore";
import { LuLayoutDashboard, LuArchive } from "react-icons/lu";
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
        </div>
    );
};

export default NavSection;