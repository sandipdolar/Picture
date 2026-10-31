
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../Component/HeaderComponent/Header";
import Sidebar from "../Component/SidebarComponent/Sidebar";
import observeImages from "../../Observer";
import { getImages } from "../api/imageApi";

import { Download, X } from "lucide-react";

// Return a shuffled copy without changing the original array
function shuffleImages(images) {
  const shuffled = [...images];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function Gallery() {

  const navigate = useNavigate();

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
  });
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!notification.message) return;

    const timer = setTimeout(() => {
      setNotification({
        message: "",
        type: "success",
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification.message, notification.type]);

  // Fetch images from the backend API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getImages();
        setImages(shuffleImages(data));
      } catch (error) {
        console.error("Could not fetch images:", error);
        setError("Could not load images. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Convert API image records into the format used by the gallery
  const pins = useMemo(() => {
    return images.map((image) => ({
      id: image._id,
      image: image.imageUrl,
      title: image.title,
    }));
  }, [images]);

  const filteredPins = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return pins;
    }

    return pins.filter((pin) =>
      pin.title.toLowerCase().includes(query)
    );
  }, [pins, searchQuery]);

  // Preserve the existing lazy-loading observer
  useEffect(() => {
    return observeImages();
  }, [filteredPins]);

  const handleSave = async (pin) => {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error("Image clipboard is not supported by this browser.");
      }

      const response = await fetch(pin.image);

      if (!response.ok) {
        throw new Error("Failed to load image.");
      }

      const blob = await response.blob();

      let pngBlob = blob;

      if (blob.type !== "image/png") {
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");

        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        canvas.getContext("2d").drawImage(bitmap, 0, 0);
        bitmap.close();

        pngBlob = await new Promise((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Image conversion failed."));
            }
          }, "image/png");
        });
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);

      setNotification({
        message: "Image copied successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Could not copy image:", error);
      setNotification({
        message: "Could not copy image. Check browser permissions.",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="ml-0 min-h-screen md:ml-[84px]">
        <Header onSearch={setSearchQuery} />

        <main className="px-4 sm:px-6">
          <h2 className="mb-7 mt-6 w-fit border-b-2 border-black pb-2 font-medium meet">
            All
          </h2>

          {isLoading ? (
            <p className="py-8 text-center text-neutral-500">
              {searchQuery.trim()
                ? `No images found for "${searchQuery}".`
                : "No images were found."}
            </p>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-600">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredPins.length === 0 ? (
            <p className="py-8 text-center text-neutral-500">
              No images found. Upload your first image to get started.
            </p>
          ) : (
            <div className="mb-20 columns-2 gap-4 sm:mb-5 sm:columns-3 lg:mb-4 lg:columns-4 xl:mb-2 xl:columns-5">
              {filteredPins.map((pin) => (
                <article
                  key={pin.id}
                  className="mb-5 break-inside-avoid"
                >
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-neutral-100"
                    onContextMenu={(event) => event.preventDefault()}
                    onDragStart={(event) => event.preventDefault()}
                  >
                    <img
                      src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                      data-src={pin.image}
                      alt={pin.title}
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(event) => event.preventDefault()}
                      onDragStart={(event) => event.preventDefault()}
                      onClick={() => navigate(`/image/${pin.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/image/${pin.id}`);
                        }
                      }}
                      className="pin-image relative z-10 block h-auto w-full cursor-pointer select-none opacity-0 transition-opacity duration-300"
                      onLoad={(event) => {
                        event.currentTarget.classList.remove("opacity-0");

                        const skeleton =
                          event.currentTarget.parentElement.querySelector(".pin-skeleton");

                        skeleton?.classList.add("hidden");
                      }}
                      onError={(event) => {
                        event.currentTarget.classList.remove("opacity-0");

                        const skeleton =
                          event.currentTarget.parentElement.querySelector(".pin-skeleton");

                        skeleton?.classList.add("hidden");
                      }}
                    />

                    <div
                      aria-hidden="true"
                      className="pin-skeleton absolute inset-0 z-0 animate-pulse bg-neutral-200"
                    />

                    <div className="absolute right-2 top-2 z-20 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" >
                      <button
                        type="button"
                        aria-label={`Copy ${pin.title}`}
                        title="Copy image"
                        onClick={(event) => {
                          event.currentTarget.blur();
                          handleSave(pin);
                        }}
                        className="flex h-8 items-center justify-center rounded-full bg-red-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      
      {notification.message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 sm:bottom-6"
        >
          <div
            className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:px-5 ${
              notification.type === "success"
                ? "border-green-100"
                : "border-red-100"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                notification.type === "success"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {notification.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                {notification.type === "success" ? "Success" : "Something went wrong"}
              </p>

              <p className="mt-0.5 break-words text-xs leading-5 text-neutral-500 sm:text-sm">
                {notification.message}
              </p>
            </div>

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() =>
                setNotification({ message: "", type: "success" })
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Gallery;
