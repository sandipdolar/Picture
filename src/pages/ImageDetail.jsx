import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

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

import {
  getImages,
  getImageById,
} from "../api/imageApi";

// Shuffle images without modifying the original array
function shuffleImages(images) {
  const shuffled = [...images];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

function ImageDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const PAGE_SIZE = 20;

  // URL search parameters
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";

  const isSearching = searchQuery.trim().length > 0;

  // Selected image states
  const [selectedImage, setSelectedImage] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  // Related images states
  const [images, setImages] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [loadMoreError, setLoadMoreError] = useState("");

  const [isInitialRelatedError, setIsInitialRelatedError] = useState(false);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  // Like state
  const [isLiked, setIsLiked] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
  });

  // Refs
  const sentinelRef = useRef(null);

  const loadingMoreRef = useRef(false);

  const selectedRequestIdRef = useRef(0);

  const relatedRequestIdRef = useRef(0);

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

  // Handle search through URL parameters
  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);

    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }

    setSearchParams(params, {
      replace: true,
    });
  };

  // Fetch the selected image independently
  useEffect(() => {
    const requestId = ++selectedRequestIdRef.current;

    setSelectedImage(null);

    setIsLoading(true);

    setError("");

    setIsLiked(false);

    const fetchSelectedImage = async () => {
      try {
        const image = await getImageById(id);

        if (requestId !== selectedRequestIdRef.current) {
          return;
        }

        setSelectedImage(image);
      } catch (error) {
        if (requestId !== selectedRequestIdRef.current) {
          return;
        }

        console.error("Could not fetch selected image:", error);

        setError(
          error.message || "Could not load image. Please try again."
        );
      } finally {
        if (requestId === selectedRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchSelectedImage();

    return () => {
      selectedRequestIdRef.current++;
    };
  }, [id]);

  // Fetch the first page of related images whenever search changes
  useEffect(() => {
    const requestId = ++relatedRequestIdRef.current;

    loadingMoreRef.current = false;

    setImages([]);
    setIsLoadingRelated(true);

    setPage(1);

    setHasMore(true);

    setLoadMoreError("");
    setIsInitialRelatedError(false);

    setIsLoadingMore(false);

    const fetchRelatedImages = async () => {
      try {
        const data = await getImages({
          page: 1,
          limit: PAGE_SIZE,
          search: searchQuery,
        });

        if (requestId !== relatedRequestIdRef.current) {
          return;
        }

        // Exclude the currently selected image
        const relatedImages = data.images.filter(
          (image) => image._id !== id
        );

        setImages(shuffleImages(relatedImages));

        setPage(1);

        setHasMore(data.pagination.hasNextPage);
      } catch (error) {
        if (requestId !== relatedRequestIdRef.current) {
          return;
        }

        console.error("Could not fetch related images:", error);

        setIsInitialRelatedError(true);

        setLoadMoreError(
          "Could not load related images. Please try again."
        );
      } finally {
        if (requestId === relatedRequestIdRef.current) {
          setIsLoadingRelated(false);
        }
      }
    };

    const timer = setTimeout(
      fetchRelatedImages,
      searchQuery ? 300 : 0
    );

    return () => {
      clearTimeout(timer);

      relatedRequestIdRef.current++;
    };
  }, [searchQuery, id]);

  // Convert API images into gallery pin format
  const pins = useMemo(() => {
    return images.map((image) => ({
      id: image._id,
      image: image.imageUrl,
      title: image.title || "Untitled Image",
    }));
  }, [images]);

  // Convert selected image into pin format
  const selectedPin = useMemo(() => {
    if (!selectedImage) return null;

    return {
      id: selectedImage._id,
      image: selectedImage.imageUrl,
      title: selectedImage.title || "Untitled Image",
    };
  }, [selectedImage]);

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({
      message,
      type,
    });
  };

  const retryRelatedImages = async () => {
    const requestId = ++relatedRequestIdRef.current;

    loadingMoreRef.current = false;

    setIsLoadingRelated(true);
    setIsLoadingMore(false);
    setLoadMoreError("");
    setIsInitialRelatedError(false);

    try {
      const data = await getImages({
        page: 1,
        limit: PAGE_SIZE,
        search: searchQuery,
      });

      if (requestId !== relatedRequestIdRef.current) {
        return;
      }

      const relatedImages = data.images.filter(
        (image) => image._id !== id
      );

      setImages(shuffleImages(relatedImages));
      setPage(1);
      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      if (requestId !== relatedRequestIdRef.current) {
        return;
      }

      console.error("Could not retry related images:", error);

      setIsInitialRelatedError(true);

      setLoadMoreError(
        "Could not load related images. Please try again."
      );
    } finally {
      if (requestId === relatedRequestIdRef.current) {
        setIsLoadingRelated(false);
      }
    }
};

  // Fetch the next page of related images
  const loadMoreImages = useCallback(async () => {
    if (
      loadingMoreRef.current ||
      isLoadingRelated ||
      !hasMore
    ) {
      return;
    }

    loadingMoreRef.current = true;

    const requestId = relatedRequestIdRef.current;

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
      if (requestId !== relatedRequestIdRef.current) {
        return;
      }

      // Exclude selected image
      const filteredImages = data.images.filter(
        (image) => image._id !== id
      );

      // Randomize the newly fetched images
      const newImages = shuffleImages(filteredImages);

      // Prevent duplicate images
      setImages((previousImages) => {
        const existingIds = new Set(
          previousImages.map((image) => image._id)
        );

        const uniqueImages = newImages.filter(
          (image) => !existingIds.has(image._id)
        );

        return [
          ...previousImages,
          ...uniqueImages,
        ];
      });

      setPage(nextPage);

      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      if (requestId !== relatedRequestIdRef.current) {
        return;
      }

      setIsInitialRelatedError(false);

      console.error("Could not load more related images:", error);

      setLoadMoreError(
        "Could not load more images. Please try again."
      );
    } finally {
      if (requestId === relatedRequestIdRef.current) {
        loadingMoreRef.current = false;

        setIsLoadingMore(false);
      }
    }
  }, [page, hasMore, searchQuery, id, isLoadingRelated]);

  // Detect when the user reaches the bottom
  useEffect(() => {

    const sentinel = sentinelRef.current;

    if (
      !sentinel ||
      isLoading ||
      isLoadingRelated ||
      isLoadingMore ||
      !hasMore ||
      loadMoreError ||
      !("IntersectionObserver" in window)
    ) {
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
    isLoadingRelated,
    isLoadingMore,
    hasMore,
    loadMoreError,
    pins.length,
  ]);

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
        new ClipboardItem({
          "image/png": pngBlob,
        }),
      ]);

      showNotification(
        "Image copied successfully!",
        "success"
      );
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

      await navigator.clipboard.writeText(
        window.location.href
      );

      showNotification(
        "Image link copied successfully!",
        "success"
      );
    } catch (error) {
      console.error("Share error:", error);

      showNotification(
        "Could not copy image link.",
        "error"
      );
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

        <div className="ml-0 min-h-screen md:ml-21">
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

        <div className="ml-0 min-h-screen md:ml-21">
          <Header onSearch={handleSearch} />

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

      <div className="ml-0 min-h-screen md:ml-21">
        <Header onSearch={handleSearch} />

        <main className="px-4 pb-20 pt-5 sm:px-6 lg:px-8">
          {isSearching && (
            <h2 className="mb-7 mt-6 w-fit border-b-2 border-black pb-2 font-medium">
              Search Results
            </h2>
          )}
          {!isSearching && (
            <>
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 transition hover:bg-neutral-200"
              >
                <ArrowLeft size={23} />
              </button>

              {/* Main image detail section */}
              <section className="mx-auto grid max-w-337.5 grid-cols-1 overflow-hidden rounded-3xl border border-neutral-200 bg-white lg:grid-cols-2">

                {/* Main image */}
                <div
                  className="relative flex h-105 items-center justify-center overflow-hidden bg-neutral-100 sm:h-140 lg:h-[min(75vh,760px)]"
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
                <div className="flex min-h-105 flex-col p-5 sm:p-8 lg:min-h-0 lg:p-10">

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
                    <h1 className="wrap-break-word text-2xl font-semibold text-neutral-900 sm:text-3xl">
                      {selectedPin.title}
                    </h1>
                  </div>

                  {/* Image information */}
                  <div className="mt-7 flex items-center gap-3">

                    {/* Interactive Heart Button */}
                    <button
                      type="button"
                      onClick={() => setIsLiked(!isLiked)}
                      aria-label="Like image"
                      className={`group flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                        isLiked
                          ? "bg-rose-100 hover:bg-rose-200 scale-105"
                          : "bg-neutral-100 hover:bg-neutral-200 active:scale-95"
                      }`}
                    >
                      <Heart
                        size={21}
                        className={`transition-all duration-300 ease-in-out ${
                          isLiked
                            ? "fill-rose-500 text-rose-500 scale-110"
                            : "text-neutral-700 group-hover:text-rose-500 group-hover:scale-110"
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
            </>
          )}

          {/* Related images section */}
          <section className="mt-12 w-full">

            {isLoadingRelated ? (
              <div className="flex min-h-[60vh] items-center justify-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-neutral-200 border-t-neutral-800" />

                <p className="text-sm text-neutral-500">
                  Loading images...
                </p>
              </div>
            ) : pins.length > 0 ? (
              <div
                key={id}
                className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
              >
                {pins.map((pin) => (
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
                        src={pin.image}
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

                      {/* Skeleton */}
                      <div
                        aria-hidden="true"
                        className="pin-skeleton absolute inset-0 z-0 min-h-37.5 animate-pulse bg-neutral-200"
                      />

                      {/* Save button */}
                      <div className="absolute right-2 top-2 z-20 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100" >
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
              !isLoadingMore &&
              !loadMoreError && (
                <div className="py-16 text-center text-neutral-500">
                  No more images available.
                </div>
              )
            )}

            {/* Loading more images */}
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
                <p className="text-sm text-red-600">
                  {loadMoreError}
                </p>

                <button
                  type="button"
                  onClick={
                    isInitialRelatedError
                      ? retryRelatedImages
                      : loadMoreImages
                  }
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Infinite scroll detection element */}
            <div
              ref={sentinelRef}
              className="h-2 w-full"
            />

          </section>
        </main>
      </div>

      {/* Notification - same design as Gallery.jsx */}
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
                    d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 1 1.7-3l7.5-13.1a2 2 0 0 1 3.4 0Z"
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

              <p className="mt-0.5 wrap-break-word text-xs leading-5 text-neutral-500 sm:text-sm">
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