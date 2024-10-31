import styles from '../styles/CroppedImages.module.css';

const CroppedImages = ({ images }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={styles.rightSide}>
      <h2 className={styles.title}>Cropped Images</h2>
      <div className={styles.scrollableContainer}>
        <div className={styles.croppedImagesGrid}>
          {images.map((obj, index) => (
            <div key={index} className={styles.imageWrapper}>
              <img
                src={obj.image}
                alt={`Cropped image ${index + 1}`}
                className={styles.croppedImage}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CroppedImages;
