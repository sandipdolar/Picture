
import { useState } from "react";
import {
  House,
  Compass,
  PanelsTopLeft,
  Plus,
  Bell,
  MessageCircleMore,
  Settings,
} from "lucide-react";

const menuItems = [
  { id: "Home", icon: House, label: "Home" },
  { id: "Explore", icon: Compass, label: "Explore" },
  { id: "Layout", icon: PanelsTopLeft, label: "Collections" },
  { id: "Create", icon: Plus, label: "Create" },
  { id: "Notifications", icon: Bell, label: "Notifications" },
  { id: "Messages", icon: MessageCircleMore, label: "Messages" },
];

const settingsItem = {
  id: "Settings",
  icon: Settings,
  label: "Settings",
};

export default function Sidebar({ onNavigate }) {
  const [activeItem, setActiveItem] = useState("Home");

  const handleNavigation = (item) => {
    setActiveItem(item.id);

    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavigation(item)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        title={item.label}
        className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:h-11 sm:w-11 md:h-12 md:w-12 ${
          isActive
            ? "bg-neutral-900 text-white"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
        }`}
      >
        <Icon
          size={22}
          strokeWidth={isActive ? 2.3 : 1.8}
          className="transition-transform duration-200 group-hover:scale-105"
        />

        <span className="pointer-events-none absolute left-[58px] top-1/2 z-[60] hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 md:block">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[68px] w-full items-center justify-around border-t border-neutral-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:inset-y-0 md:left-0 md:right-auto md:h-screen md:w-[76px] md:flex-col md:justify-start md:gap-5 md:border-r md:border-t-0 md:px-0 md:py-5"
    >
      <nav
        aria-label="Main navigation"
        className="flex w-full items-center justify-around gap-0 md:flex-1 md:flex-col md:justify-start md:gap-5"
      >
        {menuItems.map(renderMenuItem)}
      </nav>

      <div className="hidden md:flex md:mt-auto md:flex-col md:items-center">
        {renderMenuItem(settingsItem)}
      </div>
    </aside>
  );
}
