import './sidebar.css';
import { NavLink } from "react-router-dom";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useEffect, useRef, useState } from "react";

function Sidebar() {

    const [visibleCount, setVisibleCount] = useState(6);
    const [moreOpen, setMoreOpen] = useState(false);

    const navRef = useRef(null);
    const measureRef = useRef(null);

    const navItems = [
        { name: "Overview", path: "/overview" },
        { name: "My Skill Map", path: "/my-skill-map" },
        { name: "Recommendations", path: "/recommendations" },
        { name: "Activity", path: "/activity" },
        { name: "Settings", path: "/setting" }
    ];

    useEffect(() => {

        const calculateLinks = () => {

            if (!navRef.current || !measureRef.current) return;

            const availableWidth = navRef.current.clientWidth - 100;

            const links = measureRef.current.children;

            let totalWidth = 0;
            let count = 0;

            for (let i = 0; i < links.length; i++) {

                const width = links[i].offsetWidth + 40;

                if (totalWidth + width <= availableWidth) {
                    totalWidth += width;
                    count++;
                } else {
                    break;
                }
            }

            setVisibleCount(count);
        };

        calculateLinks();

        window.addEventListener("resize", calculateLinks);

        return () => {
            window.removeEventListener("resize", calculateLinks);
        };

    }, []);

    const visibleItems = navItems.slice(0, visibleCount);
    const hiddenItems = navItems.slice(visibleCount);

    return (
        <nav className="navigation" ref={navRef}>

            {/* Hidden measurement area */}
            <div
                className="measurement-links"
                ref={measureRef}
            >
                {navItems.map((item) => (
                    <span key={item.path}>
                        {item.name}
                    </span>
                ))}
            </div>


            {/* Visible links */}
            <div className="navigation-links">

                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                    >
                        {item.name}
                    </NavLink>
                ))}


                {/* More */}
                {hiddenItems.length > 0 && (

                    <div className="more-menu">

                        <button
                            className="more-button"
                            onClick={() => setMoreOpen(!moreOpen)}
                        >
                            More
                            <MdKeyboardArrowDown />
                        </button>

                        {moreOpen && (
                            <div className="more-dropdown">

                                {hiddenItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMoreOpen(false)}
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}

                            </div>
                        )}

                    </div>

                )}

            </div>

        </nav>
    );
}

export default Sidebar;