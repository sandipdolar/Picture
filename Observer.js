
// export default function observeImages() {
//   const images = document.querySelectorAll("img[data-src]");

//   if (!("IntersectionObserver" in window)) {
//     images.forEach((img) => {
//       img.src = img.dataset.src;
//     });

//     return () => {};
//   }

//   const observer = new IntersectionObserver(
//     (entries, observer) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           const img = entry.target;

//           img.src = img.dataset.src;

//           img.onload = () => {
//             img.classList.add("loaded");
//           };

//           observer.unobserve(img);
//         }
//       });
//     },
//     {
//       root: null,
//       threshold: 1,
//     }
//   );

//   images.forEach((img) => {
//     observer.observe(img);
//   });

//   return () => {
//     observer.disconnect();
//   };
// }


export default function observeImages() {
  const images = document.querySelectorAll("img[data-src]");

  const MIN_SKELETON_TIME = 800;

  function loadImage(img) {
    if (img.dataset.loading === "true" || img.classList.contains("loaded")) {
      return;
    }

    img.dataset.loading = "true";

    const startTime = Date.now();

    img.onload = () => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(
        0,
        MIN_SKELETON_TIME - elapsed
      );

      setTimeout(() => {
        img.classList.add("loaded");

        const skeleton = img.parentElement.querySelector(
          ".pin-skeleton"
        );

        if (skeleton) {
          skeleton.classList.add("hidden");
        }
      }, remainingTime);
    };

    img.onerror = () => {
      img.style.display = "none";

      const skeleton = img.parentElement.querySelector(
        ".pin-skeleton"
      );

      if (skeleton) {
        skeleton.classList.add("hidden");
      }

      console.error(`Failed to load image: ${img.dataset.src}`);
    };

    img.src = img.dataset.src;
  }

  if (!("IntersectionObserver" in window)) {
    images.forEach(loadImage);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      threshold: 0.1,
      rootMargin: "200px",
    }
  );

  images.forEach((img) => observer.observe(img));

  return () => {
    observer.disconnect();
  };
}
