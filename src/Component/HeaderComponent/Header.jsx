
import { useState } from "react";
import {
  Search,
  Camera,
  Mic,
  ChevronDown,
  X,
} from "lucide-react";

export default function Header() {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      console.log("Search:", search.trim());
    }
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 w-full items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:h-[76px] lg:px-7">
        <form
          onSubmit={handleSearch}
          role="search"
          className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-neutral-200 bg-neutral-100 px-3 transition-colors focus-within:border-neutral-400 focus-within:bg-white hover:bg-neutral-50 sm:h-12 sm:rounded-2xl sm:px-4"
        >
          <Search
            size={20}
            strokeWidth={1.8}
            className="shrink-0 text-neutral-500"
          />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images, ideas..."
            aria-label="Search images and ideas"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 sm:px-3 sm:text-base"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-black"
            >
              <X size={17} />
            </button>
          )}

          <button
            type="button"
            aria-label="Visual search"
            title="Visual search"
            onClick={() => console.log("Visual search clicked")}
            className="ml-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-200 sm:flex"
          >
            <Camera size={21} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Voice search"
            title="Voice search"
            onClick={() => console.log("Voice search clicked")}
            className="ml-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-200 md:flex"
          >
            <Mic size={21} strokeWidth={1.8} />
          </button>
        </form>

        <div className="relative flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-neutral-200 p-1 pr-2 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:gap-2 sm:pr-3"
          >
            <img
              src="https://i.pravatar.cc/100?img=12"
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
            />

            <ChevronDown
              size={17}
              className={`text-neutral-600 transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={closeProfile}
              />

              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl sm:top-14">
                <div className="border-b border-neutral-100 px-3 py-3">
                  <p className="text-sm font-semibold text-neutral-900">
                    Your account
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Manage your profile
                  </p>
                </div>

                {["Profile", "Settings", "Log out"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      console.log(`${item} clicked`);
                      closeProfile();
                    }}
                    className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-black"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
