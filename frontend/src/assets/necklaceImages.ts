// Import all necklace images
const necklaceImages = Array.from({ length: 11 }, (_, i) => {
  const imagePath = new URL(`./Photoroom/soo-${String(i).padStart(4, '0')}-Photoroom.png`, import.meta.url).href;
  return {
    src: imagePath,
    angle: (i * 18) - 90 // -90° to +90° in 18° increments
  };
});

export default necklaceImages;
