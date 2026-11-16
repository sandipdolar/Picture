import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "../Component/HeaderComponent/Header";
import Sidebar from "../Component/SidebarComponent/Sidebar";
import { getImages } from "../api/imageApi";

import { X } from "lucide-react";

const shuffleImages = (images) => {
  const shuffled = [...images];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

function Gallery() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const PAGE_SIZE = 20;

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
  });

  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);


  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const imageElements = document.querySelectorAll(".pin-image");

    imageElements.forEach((img) => {
      if (img.complete) {
        const skeleton =
          img.parentElement.querySelector(".pin-skeleton");

        img.classList.remove("opacity-0");
        img.classList.add("opacity-100");

        skeleton?.classList.add("hidden");
      }
    });
  }, [images]);

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

  // Fetch the first page whenever the search query changes
  useEffect(() => {
    const requestId = ++requestIdRef.current;

    loadingMoreRef.current = false;

    setImages([]);
    setPage(1);
    setHasMore(true);
    setError("");
    setLoadMoreError("");
    setIsLoading(true);
    setIsLoadingMore(false);

    const fetchImages = async () => {
      try {
        const data = await getImages({
          page: 1,
          limit: PAGE_SIZE,
          search: searchQuery,
        });

        if (requestId !== requestIdRef.current) return;

        setImages(shuffleImages(data.images));
        setPage(1);
        setHasMore(data.pagination.hasNextPage);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Could not fetch images:", error);
        setError("Could not load images. Please try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(fetchImages, searchQuery ? 300 : 0);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Fetch the next page of images
  const loadMoreImages = useCallback(async () => {
    if (
      loadingMoreRef.current ||
      !hasMore ||
      isLoading
    ) {
      return;
    }

    loadingMoreRef.current = true;

    const requestId = requestIdRef.current;
    const nextPage = page + 1;

    setIsLoadingMore(true);
    setLoadMoreError("");

    try {
      const data = await getImages({
        page: nextPage,
        limit: PAGE_SIZE,
        search: searchQuery,
      });

      // Ignore outdated requests
      if (requestId !== requestIdRef.current) return;

      // Prevent duplicate images
      setImages((previousImages) => {
        const existingIds = new Set(
          previousImages.map((image) => image._id)
        );

        const newImages = data.images.filter(
          (image) => !existingIds.has(image._id)
        );

        return [...previousImages, ...shuffleImages(newImages)];
      });

      setPage(nextPage);
      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error("Could not load more images:", error);
      setLoadMoreError("Could not load more images. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [page, hasMore, isLoading, searchQuery]);

  // Detect when the user reaches the bottom of the gallery
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (
      !sentinel ||
      isLoading ||
      isLoadingMore ||
      !hasMore ||
      loadMoreError ||
      error
    ) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {

        if (entries[0].isIntersecting) {
          loadMoreImages();
        }
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "500px",
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [
    loadMoreImages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreError,
    error,
    images.length,
  ]);

  // Convert API image records into the format used by the gallery
  const pins = useMemo(() => {
    return images.map((image) => ({
      id: image._id,
      image: image.imageUrl,
      title: image.title,
    }));
  }, [images]);

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

      <div className="ml-0 min-h-screen md:ml-21">
        <Header />

        <main className="px-4 sm:px-6">
          <h2 className="mb-7 mt-6 w-fit border-b-2 border-black pb-2 font-medium meet">
            All
          </h2>

          {isLoading ? (

            <div className="flex min-h-[60vh] items-center justify-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-neutral-200 border-t-neutral-800" />
              <p className="text-sm text-neutral-500">
                Loading images...
              </p>
            </div>
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
              {searchQuery.trim()
                ? `No images found for "${searchQuery}".`
                : "No images were found."}
            </p>
          ) : (
            <div className="mb-20 columns-2 gap-4 sm:mb-5 sm:columns-3 lg:mb-4 lg:columns-4 xl:mb-2 xl:columns-5">
              {pins.map((pin) => (
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
                      src={pin.image}
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
                        const img = event.currentTarget;

                        img.classList.remove("opacity-0");
                        img.classList.add("opacity-100");

                        const skeleton =
                          img.parentElement.querySelector(".pin-skeleton");

                        skeleton?.classList.add("hidden");
                      }}
                      onError={(event) => {
                        const img = event.currentTarget;

                        img.classList.remove("opacity-0");
                        img.classList.add("opacity-100");

                        const skeleton =
                          img.parentElement.querySelector(".pin-skeleton");

                        skeleton?.classList.add("hidden");
                      }}
                    />

                    <div
                      aria-hidden="true"
                      className="pin-skeleton absolute inset-0 z-0 animate-pulse bg-neutral-200"
                    />

                    <div className="absolute right-2 top-2 z-20 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100" >
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

          {/* Infinite scroll loader */}
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-neutral-200 border-t-neutral-800" />

              <p className="text-sm text-neutral-500">
                Loading more images...
              </p>
            </div>
          )}

          {/* Retry loading more images */}
          {loadMoreError && (
            <div className="py-6 text-center">
              <p className="text-sm text-red-600">{loadMoreError}</p>

              <button
                type="button"
                onClick={loadMoreImages}
                className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Infinite scroll detection element */}
          <div ref={sentinelRef} className="h-2 w-full" />
        </main>
      </div>

      
      {notification.message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-100 w-[calc(100%-32px)] max-w-105 -translate-x-1/2 sm:bottom-6"
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

              <p className="mt-0.5 wrap-break-word text-xs leading-5 text-neutral-500 sm:text-sm">
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
