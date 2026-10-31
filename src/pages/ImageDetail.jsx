
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Download,
  Copy,
  Share2,
  MoreHorizontal,
  Heart,
  LoaderCircle,
  ImageOff,
  X,
} from "lucide-react";

import Header from "../Component/HeaderComponent/Header";
import Sidebar from "../Component/SidebarComponent/Sidebar";

import observeImages from "../../Observer";
import { getImages } from "../api/imageApi";

// Shuffle images without modifying the original array
function shuffleImages(images) {
  const shuffled = [...images];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function ImageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isLiked, setIsLiked] = useState(false);

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
  });

  // Scroll to top whenever the selected image changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [id]);

  // Automatically hide notification after 3 seconds
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

  // Fetch all images from backend
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

  // Convert API images into gallery pin format
  const pins = useMemo(() => {
    return images.map((image) => ({
      id: image._id,
      image: image.imageUrl,
      title: image.title || "Untitled Image",
    }));
  }, [images]);

  // Find currently selected pin
  const selectedPin = useMemo(() => {
    return pins.find((pin) => pin.id === id);
  }, [pins, id]);

  // Get remaining images and shuffle their order whenever the selected image changes
    const relatedPins = useMemo(() => {
    const filteredPins = pins.filter((pin) => pin.id !== id);

    return shuffleImages(filteredPins);
    }, [pins, id]);

  // Initialize lazy loading for related images
  useEffect(() => {
    if (!relatedPins.length) return;

    return observeImages();
  }, [relatedPins]);

    // Show notification
    const showNotification = (message, type = "success") => {
    setNotification({
        message,
        type,
    });
    };

  // Copy image to clipboard
  const handleSave = async (pin) => {
    showNotification("Copying image...", "success");

    try {
        if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error("Image clipboard is not supported.");
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

        const context = canvas.getContext("2d");
        context.drawImage(bitmap, 0, 0);
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

        showNotification("Image copied successfully!", "success");

    } catch (error) {
        console.error("Could not copy image:", error);

        showNotification(
        "Could not copy image. Check browser permissions.",
        "error"
        );
    }
    };

  // Download image
  const handleDownload = async (pin) => {
    
    showNotification("Downloading image...", "success");
    
    try {
    
      const response = await fetch(pin.image);

      if (!response.ok) {
        throw new Error("Failed to fetch image.");
      }

      const blob = await response.blob();

      const mimeExtensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };

      const extension = mimeExtensions[blob.type] || "png";

      const safeTitle = pin.title
        .replace(/[<>:"/\\|?*]/g, "")
        .trim() || "image";

      const imageUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = imageUrl;
      link.download = `${safeTitle}.${extension}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 1000);

      showNotification(
        `Image downloaded: ${safeTitle}`,
        "success"
      );
    } catch (error) {
      console.error("Image download error:", error);

      showNotification(
        "Download failed. Please try again.",
        "error"
      );
    }
  };

  // Share image URL
  const handleShare = async () => {
    
    showNotification("Copying image link...", "success");
    
    try {

      if (!navigator.clipboard) {
        throw new Error("Clipboard is not supported.");
      }

      await navigator.clipboard.writeText(window.location.href);

      showNotification("Image link copied successfully!", "success");
    } catch (error) {
      console.error("Share error:", error);

      showNotification("Could not copy image link.", "error");
    }
  };

  // Navigate to another image
  const handleImageClick = (pin) => {
    navigate(`/image/${pin.id}`);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />

        <div className="ml-0 min-h-screen md:ml-[84px]">
          <Header />

          <div className="flex min-h-[70vh] items-center justify-center gap-3">
            <LoaderCircle className="animate-spin" size={25} />

            <p className="text-sm text-neutral-500">
              Loading image...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error || !selectedPin) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar />

        <div className="ml-0 min-h-screen md:ml-[84px]">
          <Header />

          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4">
            <ImageOff size={45} className="text-neutral-400" />

            <p className="text-center text-neutral-600">
              {error || "Image not found."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      <div className="ml-0 min-h-screen md:ml-[84px]">
        <Header />

        <main className="px-4 pb-20 pt-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition hover:bg-neutral-200"
          >
            <ArrowLeft size={23} />
          </button>

          {/* Main image detail section */}
          <section className="mx-auto grid max-w-[1350px] grid-cols-1 overflow-hidden rounded-[24px] border border-neutral-200 bg-white lg:grid-cols-2">
            {/* Main image */}
            <div
              className="relative flex h-[420px] items-center justify-center overflow-hidden bg-neutral-100 sm:h-[560px] lg:h-[min(75vh,760px)]"
              onContextMenu={(event) => event.preventDefault()}
            >
              <img
                key={selectedPin.id}
                src={selectedPin.image}
                alt={selectedPin.title}
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
                className="h-full w-full select-none object-contain"
              />

              {/* Main image actions */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(selectedPin)}
                  title="Copy image"
                  aria-label="Copy image"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 hover:bg-neutral-100"
                >
                  <Copy size={19} />
                </button>
              </div>
            </div>

            {/* Image information */}
            <div className="flex min-h-[420px] flex-col p-5 sm:p-8 lg:min-h-0 lg:p-10">
              {/* Top actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={handleShare}
                    title="Share image"
                    aria-label="Share image"
                    className="rounded-full p-2 transition hover:bg-neutral-100"
                  >
                    <Share2 size={23} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(selectedPin)}
                    title="Download image"
                    aria-label="Download image"
                    className="rounded-full p-2 transition hover:bg-neutral-100"
                  >
                    <Download size={22} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(selectedPin)}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Save
                </button>
              </div>

              {/* Image title */}
              <div className="mt-8">
                <h1 className="break-words text-2xl font-semibold text-neutral-900 sm:text-3xl">
                  {selectedPin.title}
                </h1>
              </div>

              {/* Image information */}
              {/* Image information */}
              <div className="mt-7 flex items-center gap-3">
                {/* Interactive Heart Button */}
                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  aria-label="Like image"
                  className={`group flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                    isLiked
                      ? 'bg-rose-100 hover:bg-rose-200 scale-105'
                      : 'bg-neutral-100 hover:bg-neutral-200 active:scale-95'
                  }`}
                >
                  <Heart
                    size={21}
                    className={`transition-all duration-300 ease-in-out ${
                      isLiked
                        ? 'fill-rose-500 text-rose-500 scale-110'
                        : 'text-neutral-700 group-hover:text-rose-500 group-hover:scale-110'
                    }`}
                  />
                </button>

                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Image Gallery
                  </p>

                  <p className="text-xs text-neutral-500">
                    Discover more images
                  </p>
                </div>
              </div>

              <div className="flex-1" />

              {/* Bottom actions */}
              <div className="mt-8 border-t border-neutral-200 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">
                    Explore more images
                  </p>

                  <div
                    className="rounded-full p-2 transition hover:bg-neutral-100"
                    title="More options"
                  >
                    <MoreHorizontal size={23} />
                  </div>
                </div>

                <p className="text-sm leading-6 text-neutral-500">
                  Discover other images from our gallery below.
                </p>
              </div>
            </div>
          </section>

          {/* Related images section */}
          <section className="mt-12 w-full">
            {relatedPins.length > 0 ? (
              <div
                key={id}
                className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
              >
                {relatedPins.map((pin) => (
                  <article
                    key={pin.id}
                    className="mb-5 break-inside-avoid"
                  >
                    <div
                      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-neutral-100"
                      onContextMenu={(event) => event.preventDefault()}
                      onDragStart={(event) => event.preventDefault()}
                    >
                      {/* Lazy loading image */}
                      <img
                        src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                        data-src={pin.image}
                        alt={pin.title}
                        loading="lazy"
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        onDragStart={(event) => event.preventDefault()}
                        onClick={() => handleImageClick(pin)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            handleImageClick(pin);
                          }
                        }}
                        className="pin-image relative z-10 block h-auto w-full cursor-pointer select-none opacity-0 transition-opacity duration-300"
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

                      {/* Skeleton */}
                      <div
                        aria-hidden="true"
                        className="pin-skeleton absolute inset-0 z-0 min-h-[150px] animate-pulse bg-neutral-200"
                      />

                      {/* Save button */}
                      <div className="absolute right-2 top-2 z-20 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label={`Copy ${pin.title}`}
                          title="Copy image"
                          onClick={(event) => {
                            event.stopPropagation();
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
            ) : (
              <div className="py-16 text-center text-neutral-500">
                No more images available.
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Notification - same design as Gallery.jsx */}
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
            {/* Notification icon */}
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

            {/* Notification message */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                {notification.type === "success"
                  ? "Success"
                  : "Something went wrong"}
              </p>

              <p className="mt-0.5 break-words text-xs leading-5 text-neutral-500 sm:text-sm">
                {notification.message}
              </p>
            </div>

            {/* Dismiss notification */}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() =>
                setNotification({
                  message: "",
                  type: "success",
                })
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

export default ImageDetail;
