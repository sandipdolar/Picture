import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Image as ImageIcon,
  LayoutDashboard,
  Upload,
  Trash2,
  LogOut,
  Images,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  X,
  ExternalLink,
  ShieldCheck,
  FileImage,
  Pencil,
  Eye,
  Copy,
  CalendarDays,
  Link as LinkIcon,
} from "lucide-react";

import {
  getImages,
  uploadImage,
  deleteImage,
  updateImage,
} from "../../api/imageApi";
import { getAdminSession, logoutAdmin } from "../../api/authApi";

function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [deletingImage, setDeletingImage] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const IMAGES_PER_PAGE = 12;

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const [session, imageList] = await Promise.all([
          getAdminSession(),
          getImages(),
        ]);

        if (!active) return;

        setAdmin(session);
        setImages(imageList);
      } catch (err) {
        if (!active) return;

        if (
          err.message?.toLowerCase().includes("log in") ||
          err.message?.toLowerCase().includes("session") ||
          err.message?.toLowerCase().includes("unauthorized")
        ) {
          navigate("/admin/login", { replace: true });
          return;
        }

        setError(err.message || "Could not load dashboard data.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 3500);

    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setVisibleCount(IMAGES_PER_PAGE);
  }, [search]);

  
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setUploadError(
        `"${selectedFile.name}" is not supported. Please select JPG, PNG, WEBP, or GIF.`
      );

      setFile(null);
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setUploadError("Image size must be 5 MB or smaller.");

      setFile(null);
      event.target.value = "";
      return;
    }

    setUploadError("");
    setError("");
    setFile(selectedFile);
  };

  const handleCopyImageUrl = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setNotice("Image URL copied successfully!");
    } catch (error) {
      setError("Could not copy image URL.");
    }
  };

  
  const handleUpload = async (event) => {
    event.preventDefault();

    setUploadError("");
    setError("");
    setNotice("");

    if (!title.trim() || !file) {
      setUploadError("Please provide a title and select an image.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImage = await uploadImage(title.trim(), file);

      setImages((current) => [uploadedImage, ...current]);

      setTitle("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setNotice("Image uploaded successfully!");
    } catch (err) {
      setUploadError(err.message || "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };


  const handleDelete = async () => {
    if (!deletingImage) return;

    const image = deletingImage;

    setDeletingId(image._id);
    setError("");
    setNotice("");

    try {
      await deleteImage(image._id);

      setImages((current) =>
        current.filter((item) => item._id !== image._id)
      );

      setSelectedImage((current) =>
        current?._id === image._id ? null : current
      );

      setDeletingImage(null);

      setNotice("Image deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete image.");

      if (
        err.message?.toLowerCase().includes("log in") ||
        err.message?.toLowerCase().includes("session") ||
        err.message?.toLowerCase().includes("unauthorized")
      ) {
        navigate("/admin/login", { replace: true });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateImage = async (event) => {
    event.preventDefault();

    if (!editingImage || !editTitle.trim()) {
      setError("Image title is required.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setNotice("");

    try {
      const updatedImage = await updateImage(
        editingImage._id,
        editTitle.trim()
      );

      setImages((current) =>
        current.map((image) =>
          image._id === updatedImage._id ? updatedImage : image
        )
      );

      setEditingImage(null);
      setEditTitle("");

      setNotice("Image title updated successfully!");
    } catch (err) {
      setError(err.message || "Could not update image title.");

      if (
        err.message?.toLowerCase().includes("log in") ||
        err.message?.toLowerCase().includes("session") ||
        err.message?.toLowerCase().includes("unauthorized")
      ) {
        navigate("/admin/login", { replace: true });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError("");

    try {
      await logoutAdmin();
      navigate("/admin/login", { replace: true });
    } catch (err) {
      setError(err.message || "Could not log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const filteredImages = images.filter((image) =>
    image.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  const visibleImages = filteredImages.slice(0, visibleCount);

  const hasMoreImages = visibleCount < filteredImages.length;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-indigo-600"
          />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Preparing your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {editingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isUpdating
            ) {
              setEditingImage(null);
              setEditTitle("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-image-heading"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  id="edit-image-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Edit image title
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update your image information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingImage(null);
                  setEditTitle("");
                }}
                disabled={isUpdating}
                aria-label="Close edit dialog"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 overflow-hidden rounded-xl bg-slate-100">
              <img
                src={editingImage.imageUrl}
                alt={editingImage.title}
                className="h-48 w-full object-contain"
              />
            </div>

            <form onSubmit={handleUpdateImage}>
              <label
                htmlFor="edit-image-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Image title
              </label>

              <input
                id="edit-image-title"
                type="text"
                maxLength={120}
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Enter image title"
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {editTitle.length}/120
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingImage(null);
                    setEditTitle("");
                  }}
                  disabled={isUpdating}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating || !editTitle.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {isUpdating ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedImage(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-details-heading"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2
                  id="image-details-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Image details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete image information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                aria-label="Close image details"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="max-h-72 w-full object-contain"
                />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Image title
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {selectedImage.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Upload date
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays size={16} className="text-indigo-600" />
                    {selectedImage.createdAt
                      ? new Date(selectedImage.createdAt).toLocaleString()
                      : "Date unavailable"}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Image URL
                  </p>

                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <LinkIcon
                      size={16}
                      className="shrink-0 text-indigo-600"
                    />

                    <p className="min-w-0 flex-1 break-all text-xs text-slate-600">
                      {selectedImage.imageUrl}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyImageUrl(selectedImage.imageUrl)
                      }
                      title="Copy image URL"
                      aria-label="Copy image URL"
                      className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-600"
                    >
                      <Copy size={17} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setDeletingImage(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-image-heading"
            aria-describedby="delete-image-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-image-heading"
              className="mt-5 text-lg font-bold text-slate-900"
            >
              Delete this image?
            </h2>

            <p
              id="delete-image-description"
              className="mt-2 text-sm leading-6 text-slate-500"
            >
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-800">
                "{deletingImage.title}"
              </span>
              ? This image will also be removed from your public gallery.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl bg-slate-100">
              <img
                src={deletingImage.imageUrl}
                alt={deletingImage.title}
                className="h-40 w-full object-contain"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingImage(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}

                {deletingId ? "Deleting..." : "Delete image"}
              </button>
            </div>
          </div>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="min-w-0 px-4 pt-4">
          <img src="/logo.png" alt="" className="h-14" />
        </div>

        <div className="px-4 pt-4">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 font-semibold text-indigo-700">
            <LayoutDashboard size={19} />
            <span className="text-sm">Overview</span>
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("image-library")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Images size={19} />
            Image library
          </button>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={18} className="text-emerald-600" />
              Secure workspace
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Image management is restricted to authenticated admins.
            </p>
          </div>

          <Link
            to="/"
            target="_blank"
            className="mt-3 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ExternalLink size={17} />
            View public gallery
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <Link to="/" className="flex items-center">
            <div>
              <p className="text-base font-bold tracking-tight">
                Picture-To-Picture
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Admin workspace</p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-semibold">
                {admin?.email || "Administrator"}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">
                Admin account
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {admin?.email?.charAt(0).toUpperCase() || "A"}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Log out"
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <LogOut size={17} />
              )}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-10">
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
            >
              <CheckCircle2 size={19} />
              {notice}
            </div>
          )}

          <section className="mb-8">
            <p className="text-sm font-medium text-indigo-600">
              YOUR CONTENT, ONE PLACE
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome Admin
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your visual collection, publish new images, and keep your
              public gallery up to date.
            </p>
          </section>

          <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total images
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    {images.length}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Images in your collection
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Images size={22} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Storage status
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight">
                    Connected
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Managed through your image backend
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                  <Upload size={21} />
                </div>
                <div>
                  <h2 className="font-bold">Upload a new image</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add an image to your public gallery.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpload} className="p-5 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="image-title"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Image title
                    </label>
                    <input
                      id="image-title"
                      type="text"
                      maxLength={120}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Peaceful mountain landscape"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                    <p className="mt-2 text-right text-xs text-slate-400">
                      {title.length}/120
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Image file
                    </label>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
                    >
                      <FileImage size={29} className="text-indigo-600" />
                      <span className="mt-3 text-sm font-semibold text-slate-700">
                        {file ? file.name : "Choose an image"}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        JPG, PNG, WEBP or GIF · Up to 5 MB
                      </span>
                    </button>

                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="*/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    
                    {uploadError && (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                      >
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">Upload failed</p>
                          <p className="mt-1 break-words leading-5">
                            {uploadError}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setUploadError("")}
                          aria-label="Dismiss upload error"
                          className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    )}


                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || !title.trim() || !file}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isUploading ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                    {isUploading ? "Uploading image..." : "Upload image"}
                  </button>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Preview
                  </p>
                  <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {preview ? (
                      <div className="relative w-full">
                        <img
                          src={preview}
                          alt="Selected upload preview"
                          className="max-h-80 w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          aria-label="Remove selected image"
                          className="absolute right-2 top-2 rounded-full bg-white p-2 text-slate-700 shadow hover:bg-red-50 hover:text-red-600"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ) : (
                      <div className="px-5 py-10 text-center">
                        <ImageIcon
                          size={34}
                          className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 text-sm font-medium text-slate-500">
                          Your preview will appear here
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Select an image to get started
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </section>

          <section id="image-library" className="scroll-mt-24">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  CONTENT MANAGEMENT
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                  Image library
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {images.length} {images.length === 1 ? "image" : "images"}{" "}
                  available in the gallery
                </p>
              </div>

              <div className="w-full sm:max-w-xs">
                <label htmlFor="image-search" className="sr-only">
                  Search images by title
                </label>
                <input
                  id="image-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
                <Images size={38} className="mx-auto text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-800">
                  {images.length === 0
                    ? "Your library is empty"
                    : "No matching images"}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {images.length === 0
                    ? "Upload your first image using the form above. It will appear here and in the public gallery."
                    : "Try another search term or clear your search."}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {visibleImages.map((image) => (
                  <article
                    key={image._id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />

                      <div className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
                        Published
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      <h3
                        title={image.title}
                        className="truncate text-sm font-semibold text-slate-800"
                      >
                        {image.title}
                      </h3>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <a
                          href={image.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"
                        >
                          <ExternalLink size={14} />
                          View image
                        </a>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingImage(image);
                              setEditTitle(image.title);
                              setError("");
                              setNotice("");
                            }}
                            aria-label={`Edit ${image.title}`}
                            title="Edit image title"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-indigo-600 transition hover:bg-indigo-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingImage(image)}
                            disabled={deletingId === image._id}
                            aria-label={`Delete ${image.title}`}
                            title="Delete image"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === image._id ? (
                              <LoaderCircle size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedImage(image)}
                            title="View image details"
                            aria-label={`View details for ${image.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {hasMoreImages && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((current) => current + IMAGES_PER_PAGE)
                      }
                      className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Load More Images
                      <span className="ml-2 text-xs text-slate-400">
                        ({filteredImages.length - visibleCount} remaining)
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            Picture-To-Picture Admin · Manage your visual collection
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
