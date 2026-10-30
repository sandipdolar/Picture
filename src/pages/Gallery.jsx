
import { useEffect, useMemo, useState } from "react";

import Header from "../Component/HeaderComponent/Header";
import Sidebar from "../Component/SidebarComponent/Sidebar";
import observeImages from "../../Observer";
import { getImages } from "../api/imageApi";

import { Download } from "lucide-react";

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
  const [notification, setNotification] = useState("");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [notification]);

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

  // Preserve the existing lazy-loading observer
  useEffect(() => {
    return observeImages();
  }, [pins]);

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

      setNotification("Image copied successfully!");
    } catch (error) {
      console.error("Could not copy image:", error);
      setNotification("Could not copy image. Check browser permissions.");
    }
  };

  const handleDownload = (pin) => {
    const link = document.createElement("a");

    link.href = pin.image;
    link.download = pin.title;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setNotification(`Image download started: ${pin.title}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="ml-0 min-h-screen md:ml-[84px]">
        <Header />

        <main className="px-4 sm:px-6">
          <h2 className="mb-7 mt-6 w-fit border-b-2 border-black pb-2 font-medium meet">
            All
          </h2>

          {isLoading ? (
            <p className="py-8 text-center text-neutral-500">
              Loading images...
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
          ) : pins.length === 0 ? (
            <p className="py-8 text-center text-neutral-500">
              No images found. Upload your first image to get started.
            </p>
          ) : (
            <div className="mb-20 columns-2 gap-4 sm:mb-5 sm:columns-3 lg:mb-4 lg:columns-4 xl:mb-2 xl:columns-5">
              {pins.map((pin) => (
                <article
                  key={pin.id}
                  className="mb-5 break-inside-avoid"
                >
                  <div className="group relative overflow-hidden rounded-2xl bg-neutral-100">
                    <img
                      src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                      data-src={pin.image}
                      alt={pin.title}
                      loading="lazy"
                      className="pin-image relative z-10 block h-auto w-full opacity-0 transition-opacity duration-300"
                      onLoad={(event) => {
                        event.currentTarget.classList.remove("opacity-0");
                        const skeleton =
                          event.currentTarget.parentElement.querySelector(
                            ".pin-skeleton"
                          );

                        skeleton?.classList.add("hidden");
                      }}
                      onError={(event) => {
                        event.currentTarget.classList.remove("opacity-0");

                        const skeleton =
                          event.currentTarget.parentElement.querySelector(
                            ".pin-skeleton"
                          );

                        skeleton?.classList.add("hidden");
                      }}
                    />

                    <div
                      aria-hidden="true"
                      className="pin-skeleton absolute inset-0 z-0 animate-pulse bg-neutral-200"
                    />

                    <div className="absolute right-2 top-2 z-20 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label={`Copy ${pin.title}`}
                        title="Copy image"
                        onClick={() => handleSave(pin)}
                        className="flex h-8 items-center justify-center rounded-full bg-red-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        aria-label={`Download ${pin.title}`}
                        title="Download image"
                        onClick={() => handleDownload(pin)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-100"
                      >
                        <Download className="text-black" size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-xl"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
            ✓
          </span>

          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}

export default Gallery;
